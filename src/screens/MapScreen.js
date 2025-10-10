import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// Importe o novo componente Modal
import AddMarkerModal from '../components/AddMarkerModal';

// Carrega o ficheiro HTML
const mapHtmlAsset = Asset.fromModule(require('./map.html'));

const MapScreen = ({ showHeatmap, showMarkers, mapTheme, filters }) => {
    const [status, setStatus] = useState({ loading: true, error: null });
    const [initialHtml, setInitialHtml] = useState(null);
    const webviewRef = useRef(null);
    const [isAddingMarker, setIsAddingMarker] = useState(false);

    // Estados para controlar o Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [newMarkerCoords, setNewMarkerCoords] = useState(null);

    // Efeito para carregar o template HTML inicial (corre uma vez)
    useEffect(() => {
        const loadHtmlTemplate = async () => {
            try {
                if (!mapHtmlAsset.downloaded) {
                    await mapHtmlAsset.downloadAsync();
                }
                const htmlContent = await FileSystem.readAsStringAsync(mapHtmlAsset.localUri);
                setInitialHtml(htmlContent);
            } catch (e) {
                setStatus({ loading: false, error: 'Falha ao carregar o template do mapa.' });
            }
        };
        loadHtmlTemplate();
    }, []);


    // Função para inicializar o mapa DENTRO do WebView
    const initMapInWebView = async () => {
        try {
            // Mostra o indicador de carregamento
            setStatus({ loading: true, error: null });

            // Pede permissão de localização
            let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') {
                throw new Error('A permissão para aceder à localização foi negada.');
            }

            // Obtém a localização atual do utilizador
            const currentLocation = await Location.getCurrentPositionAsync({});
            if (!currentLocation) {
                throw new Error('Não foi possível obter a localização atual.');
            }

            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.types && filters.types.length > 0) params.append('types', filters.types.join(','));

            const queryString = params.toString();
            // Lembre-se de confirmar que o seu IP está correto aqui
            const apiUrl = `http://192.168.8.62:5000/api/marcacoes?${queryString}`;

            // Busca os dados de poluição da sua API
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Falha ao buscar os dados de poluição do servidor.');
            }
            const pollutionData = await response.json();

            // Prepara os dados para injetar no WebView
            const initialData = {
                userCoords: currentLocation.coords,
                pollutionPoints: pollutionData,
                showHeatmap: showHeatmap,
                showMarkers: showMarkers
            };

            webviewRef.current?.injectJavaScript(`
                window.init(${JSON.stringify(initialData)});
                true; 
            `);

            setStatus({ loading: false, error: null });
        } catch (e) {
            console.error("Erro na inicialização do mapa:", e);
            setStatus({ loading: false, error: e.message });
        }
    };

    // Função que inicializa ou atualiza o mapa com dados
    const updateMapData = async () => {
        if (!webviewRef.current) return;

        try {
            setStatus(prev => ({ ...prev, loading: true, error: null }));

            const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') throw new Error('A permissão para aceder à localização foi negada.');

            const currentLocation = await Location.getCurrentPositionAsync({});
            if (!currentLocation) throw new Error('Não foi possível obter a localização atual.');

            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.types && filters.types.length > 0) params.append('types', filters.types.join(','));

            const queryString = params.toString();
            const apiUrl = `http://192.168.8.62:5000/api/marcacoes?${queryString}`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Falha ao buscar dados do servidor.');

            const pollutionData = await response.json();

            const initialData = {
                userCoords: currentLocation.coords,
                pollutionPoints: pollutionData,
                showHeatmap: showHeatmap,
                showMarkers: showMarkers
            };

            webviewRef.current.injectJavaScript(`window.init(${JSON.stringify(initialData)}); true;`);
            setStatus(prev => ({ ...prev, loading: false }));
        } catch (e) {
            console.error("Erro ao atualizar o mapa:", e);
            setStatus({ loading: false, error: e.message });
        }
    };

    // Efeitos para enviar comandos para o WebView quando os switches mudam
    useEffect(() => {
        webviewRef.current?.injectJavaScript(`toggleAddMarkerMode(${isAddingMarker}); true;`);
    }, [isAddingMarker]);

    useEffect(() => {
        webviewRef.current?.injectJavaScript(`
            setHeatmapVisible(${showHeatmap});
            setMarkersVisible(${showMarkers});
            setTheme('${mapTheme}');
            true;
        `);
    }, [showHeatmap, showMarkers, mapTheme]);

    useEffect(() => {
        if (initialHtml) { // Só executa se o HTML do webview já estiver carregado
            updateMapData(); // Esta função busca os dados da API usando os filtros
        }
    }, [filters, initialHtml]); // Reage à mudança dos filtros (e à primeira carga do HTML)


    // --- Funções para o fluxo de criação de marcador ---

    const onMapMarkerAdded = (coords) => {
        setNewMarkerCoords(coords);
        setModalVisible(true);
        setIsAddingMarker(false); // Desativa o modo de adição após o clique
    };

    const handleSaveMarker = async (marcacaoData, imageAsset) => {
        try {
            let finalData = { ...marcacaoData };
            if (imageAsset) {
                Alert.alert("Aguarde", "A enviar imagem...");
                const uploadedUrl = await uploadImage(imageAsset);
                finalData.imagem_url = uploadedUrl;
            }

            await sendMarkerToAPI(finalData);

        } catch (error) {
            Alert.alert("Erro", error.message);
        }
    };

    const uploadImage = async (imageAsset) => {
        const token = await SecureStore.getItemAsync('user_jwt_token');
        const apiUrl = 'http://192.168.8.62:5000/api/upload/';

        const formData = new FormData();
        formData.append('file', {
            uri: imageAsset.uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const responseData = await response.json();
        if (!response.ok) {
            console.error("Erro no upload:", responseData);
            throw new Error(responseData.error || "Falha no upload da imagem.");
        }
        return responseData.image_url;
    };

    const sendMarkerToAPI = async (data) => {
        try {
            const token = await SecureStore.getItemAsync('user_jwt_token');
            if (!token) {
                Alert.alert("Erro", "Você não está logado.");
                return;
            }

            const response = await fetch('http://192.168.8.62:5000/api/marcacoes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso", "Marcação criada com sucesso!");
                setModalVisible(false); // Fecha o modal
                initMapInWebView(); // Atualiza o mapa para mostrar o novo ponto
            } else {
                throw new Error(responseData.error || "Não foi possível criar a marcação");
            }
        } catch (error) {
            Alert.alert("Erro de Rede", error.message);
        }
    };

    // --- Lógica de Renderização ---
    if (!initialHtml) {
        return <View style={styles.center}><ActivityIndicator size="large" /><Text>A preparar mapa...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>

            {/* Renderiza o componente do Modal quando houver coordenadas */}
            {newMarkerCoords && (
                <AddMarkerModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSaveMarker}
                    initialCoords={newMarkerCoords}
                />
            )}

            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: initialHtml }}
                style={styles.webview}
                onLoadEnd={updateMapData}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'marker_added') {
                            onMapMarkerAdded(data.payload);
                        } else {
                            // Log para outras mensagens vindas do WebView
                            console.log(`[WebView ${data.type.toUpperCase()}]:`, ...data.payload);
                        }
                    } catch (e) {
                        // Log para mensagens que não são JSON
                        console.log('[WebView Raw]:', event.nativeEvent.data);
                    }
                }}
            />

            {status.loading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#FFF" /></View>)}
            {status.error && (<View style={styles.errorOverlay}><Text style={styles.errorText}>{status.error}</Text></View>)}

            <TouchableOpacity style={[styles.actionButton, { bottom: 20, backgroundColor: isAddingMarker ? '#c0392b' : '#2980b9' }]} onPress={() => setIsAddingMarker(!isAddingMarker)}>
                <MaterialCommunityIcons name={isAddingMarker ? "close" : "plus"} size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    webview: { flex: 1, backgroundColor: '#333' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    errorOverlay: { position: 'absolute', top: 50, left: 10, right: 10, padding: 10, backgroundColor: 'rgba(255, 0, 0, 0.8)', borderRadius: 5 },
    errorText: { color: 'white', textAlign: 'center' },
    controls: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
    controlItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    themeButton: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20, padding: 8, zIndex: 10 },
    actionButton: { position: 'absolute', right: 20, borderRadius: 30, padding: 12, zIndex: 10, elevation: 5 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    input: { width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 5, marginBottom: 10, paddingHorizontal: 10 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
    imagePicker: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginBottom: 15,
    },
});

const pickerSelectStyles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 10,
    },
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        color: 'black',
        paddingRight: 30, // para garantir que o texto não fique debaixo da seta
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        color: 'black',
        paddingRight: 30, // para garantir que o tex§§§to não fique debaixo da seta
    },
});

export default MapScreen;