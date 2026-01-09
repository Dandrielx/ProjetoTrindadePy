import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy'; // Mantido import legacy para compatibilidade
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

// Importe o novo componente Modal
import AddMarkerModal from '../components/AddMarkerModal';

// Carrega o ficheiro HTML
const mapHtmlAsset = Asset.fromModule(require('./map.html'));

// Paleta de Cores Moderna
const COLORS = {
    primary: '#81C784',      // Verde Pastel
    primaryDark: '#388E3C',  // Verde Escuro para contraste
    accent: '#4DB6AC',
    danger: '#e57373',       // Vermelho suave
    white: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.95)',
    shadow: '#000'
};

const MapScreen = ({ showHeatmap, showMarkers, mapTheme, filters }) => {
    const [status, setStatus] = useState({ loading: true, error: null });
    const [initialHtml, setInitialHtml] = useState(null);
    const webviewRef = useRef(null);
    const [isAddingMarker, setIsAddingMarker] = useState(false);

    // Estados para controlar o Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [newMarkerCoords, setNewMarkerCoords] = useState(null);

    // URL Base para facilitar manutenção (mesmo IP do seu arquivo original)
    const API_URL = `${API_BASE_URL}/api`;

    // Efeito para carregar o template HTML inicial
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
            setStatus({ loading: true, error: null });

            let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') {
                throw new Error('A permissão para aceder à localização foi negada.');
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            if (!currentLocation) {
                throw new Error('Não foi possível obter a localização atual.');
            }

            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.types && filters.types.length > 0) params.append('types', filters.types.join(','));

            const queryString = params.toString();
            const apiUrl = `${API_URL}/marcacoes?${queryString}`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Falha ao buscar os dados de poluição do servidor.');
            }
            const pollutionData = await response.json();

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
            const apiUrl = `${API_URL}/marcacoes?${queryString}`;

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

    // Efeitos para enviar comandos para o WebView
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
        if (initialHtml) {
            updateMapData();
        }
    }, [filters, initialHtml]);


    // --- Funções para o fluxo de criação de marcador ---

    const onMapMarkerAdded = (coords) => {
        setNewMarkerCoords(coords);
        setModalVisible(true);
        setIsAddingMarker(false);
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
        const uploadUrl = `${API_URL}/upload/`;

        const formData = new FormData();
        formData.append('file', {
            uri: imageAsset.uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
        });

        const response = await fetch(uploadUrl, {
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

            const response = await fetch(`${API_URL}/marcacoes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso", "Marcação criada com sucesso!");
                setModalVisible(false);
                initMapInWebView();
            } else {
                throw new Error(responseData.error || "Não foi possível criar a marcação");
            }
        } catch (error) {
            Alert.alert("Erro de Rede", error.message);
        }
    };

    // --- Renderização ---
    if (!initialHtml) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingTextInitial}>Carregando mapa...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Configuração da Barra de Status Transparente */}
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

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
                            console.log(`[WebView ${data.type.toUpperCase()}]:`, ...data.payload);
                        }
                    } catch (e) {
                        console.log('[WebView Raw]:', event.nativeEvent.data);
                    }
                }}
            />

            {/* Overlay de Carregamento Estilizado (Pílula Flutuante) */}
            {status.loading && (
                <View style={styles.loadingPill}>
                    <ActivityIndicator size="small" color={COLORS.primaryDark} />
                    <Text style={styles.loadingPillText}>Atualizando...</Text>
                </View>
            )}

            {/* Overlay de Erro Estilizado */}
            {status.error && (
                <View style={styles.errorCard}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.white} />
                    <Text style={styles.errorText}>{status.error}</Text>
                    <TouchableOpacity onPress={updateMapData} style={styles.retryButton}>
                        <Text style={styles.retryText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Botão de Ação Flutuante (FAB) */}
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    { backgroundColor: isAddingMarker ? COLORS.danger : COLORS.primary }
                ]}
                onPress={() => setIsAddingMarker(!isAddingMarker)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons
                    name={isAddingMarker ? "close" : "plus"}
                    size={30}
                    color="white"
                />
            </TouchableOpacity>

            {/* Aviso quando modo de adicionar está ativo */}
            {isAddingMarker && (
                <View style={styles.instructionPill}>
                    <Text style={styles.instructionText}>Toque no mapa para adicionar</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white
    },
    webview: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    loadingTextInitial: {
        marginTop: 10,
        color: COLORS.primaryDark,
        fontSize: 16,
        fontWeight: '600'
    },
    // Estilo novo do Loading (Pílula no topo)
    loadingPill: {
        position: 'absolute',
        top: 60, // Abaixo da Status Bar
        alignSelf: 'center',
        backgroundColor: COLORS.overlay,
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        zIndex: 10,
    },
    loadingPillText: {
        color: COLORS.primaryDark,
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14
    },
    // Estilo do Botão Flutuante (FAB)
    actionButton: {
        position: 'absolute',
        bottom: 40,
        right: 25,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 20,
    },
    // Estilo do Card de Erro
    errorCard: {
        position: 'absolute',
        top: 110,
        left: 20,
        right: 20,
        backgroundColor: COLORS.danger,
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        elevation: 5,
        zIndex: 15,
    },
    errorText: {
        color: 'white',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
        fontSize: 14
    },
    retryButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    // Instrução flutuante quando está adicionando
    instructionPill: {
        position: 'absolute',
        bottom: 120,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    instructionText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14
    }
});

export default MapScreen;