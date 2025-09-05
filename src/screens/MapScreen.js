import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Switch, SafeAreaView, TouchableOpacity, Modal, TextInput, Button, Alert, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';

// Carrega o ficheiro HTML como um módulo estático
const mapHtmlAsset = Asset.fromModule(require('./map.html'));

const MapScreen = ({ showHeatmap, showMarkers, mapTheme }) => {
    // --- Estados para controlo do mapa e da UI ---
    const [status, setStatus] = useState({ loading: true, error: null });
    const [initialHtml, setInitialHtml] = useState(null);
    const webviewRef = useRef(null);
    const [isAddingMarker, setIsAddingMarker] = useState(false);

    // --- Estados para o Modal de criação de marcador ---
    const [modalVisible, setModalVisible] = useState(false);
    const [newMarkerCoords, setNewMarkerCoords] = useState(null);
    const [markerTipo, setMarkerTipo] = useState('');
    const [markerIntensidade, setMarkerIntensidade] = useState('');
    const [markerDescricao, setMarkerDescricao] = useState('');

    const [markerImage, setMarkerImage] = useState(null);

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
            setStatus({ loading: true, error: null });
            let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') throw new Error('A permissão para aceder à localização foi negada.');

            const currentLocation = await Location.getCurrentPositionAsync({});
            if (!currentLocation) throw new Error('Não foi possível obter a localização atual.');

            const response = await fetch('http://192.168.8.62:5000/api/marcacoes');
            if (!response.ok) {
                throw new Error('Falha ao buscar os dados de poluição do servidor.');
            }

            const pollutionData = await response.json();

            const initialData = {
                userCoords: currentLocation.coords,
                pollutionPoints: pollutionData,
            };

            webviewRef.current?.injectJavaScript(`window.init(${JSON.stringify(initialData)}); true;`);
            setStatus({ loading: false, error: null });
        } catch (e) {
            console.error("Erro na inicialização do mapa:", e);
            setStatus({ loading: false, error: e.message });
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.25, // Reduz a qualidade para uploads mais rápidos
        });

        if (!result.canceled) {
            setMarkerImage(result.assets[0]); // Guarda o objeto da imagem
        }
    };

    // Efeitos para enviar comandos para o WebView quando os switches mudam
    useEffect(() => {
        webviewRef.current?.injectJavaScript(`toggleAddMarkerMode(${isAddingMarker}); true;`);
    }, [isAddingMarker]);

    useEffect(() => {
        // O código para atualizar o mapa agora usa as props
        webviewRef.current?.injectJavaScript(`
            setHeatmapVisible(${showHeatmap});
            setMarkersVisible(${showMarkers});
            setTheme('${mapTheme}');
            true;
        `);
    }, [showHeatmap, showMarkers, mapTheme]);


    // --- Funções para o fluxo de criação de marcador ---

    const updateWebViewVisuals = () => {
        webviewRef.current?.injectJavaScript(`
            setHeatmapVisible(${showHeatmap});
            setMarkersVisible(${showMarkers});
            setTheme('${mapTheme}');
            true;
        `);
    };

    const onMapMarkerAdded = (coords) => {
        setNewMarkerCoords(coords);
        setModalVisible(true);
        setIsAddingMarker(false);
    };

    const handleSaveMarker = async () => {
        const intensidade = parseInt(markerIntensidade, 10);
        if (!markerTipo || isNaN(intensidade) || intensidade < 1 || intensidade > 10) {
            Alert.alert("Erro de Validação", "Por favor, preencha o tipo e uma intensidade de 1 a 10.");
            return;
        }

        try {
            let imageUrl = null;
            if (markerImage) {
                Alert.alert("Aguarde", "A enviar imagem...");
                const uploadedUrl = await uploadImage(markerImage);
                imageUrl = uploadedUrl;
            }

            const marcacaoData = {
                latitude: newMarkerCoords.lat,
                longitude: newMarkerCoords.lng,
                tipo_poluicao: markerTipo,
                intensidade: intensidade,
                descricao: markerDescricao,
                imagem_url: imageUrl,
            };

            await sendMarkerToAPI(marcacaoData);

        } catch (error) {
            Alert.alert("Erro", error.message);
        }
    };

    const uploadImage = async (imageAsset) => {
        const token = await SecureStore.getItemAsync('user_jwt_token');
        const apiUrl = 'http://192.168.8.62:5000/api/upload';

        // O FormData é necessário para enviar ficheiros
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
                //'Content-Type': 'multipart/form-data',
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

            const response = await fetch('http://192.168.8.62:5000/api/marcacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso", "Marcação criada com sucesso!");
                setModalVisible(false);
                setMarkerTipo('');
                setMarkerIntensidade('');
                setMarkerDescricao('');
                initMapInWebView();
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
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Adicionar Marcação</Text>

                        <View style={pickerSelectStyles.container}>
                            <RNPickerSelect
                                onValueChange={(value) => setMarkerTipo(value)}
                                items={[
                                    { label: 'Microplástico', value: 'microplastic' },
                                    { label: 'Lixo (Geral)', value: 'garbage' },
                                    { label: 'Óleo', value: 'oil' },
                                ]}
                                style={pickerSelectStyles}
                                placeholder={{ label: "Selecione um tipo de poluição...", value: null }}
                                value={markerTipo}
                            />
                        </View>
                        <TextInput
                            placeholder="Intensidade (1-10)"
                            style={styles.input}
                            value={markerIntensidade}
                            onChangeText={setMarkerIntensidade}
                            keyboardType="numeric"
                        />
                        <TextInput
                            placeholder="Descrição (opcional)"
                            style={styles.input}
                            value={markerDescricao}
                            onChangeText={setMarkerDescricao}
                            multiline
                        />

                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            <Text>Adicionar Foto</Text>
                        </TouchableOpacity>
                        {markerImage && <Image source={{ uri: markerImage.uri }} style={styles.previewImage} />}

                        <View style={styles.buttonRow}>
                            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="red" />
                            <Button title="Salvar" onPress={handleSaveMarker} />
                        </View>
                    </View>
                </View>
            </Modal>

            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: initialHtml }}
                style={styles.webview}
                onLoadEnd={initMapInWebView}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'marker_added') {
                            onMapMarkerAdded(data.payload);
                        } else {
                            console.log(`[WebView ${data.type.toUpperCase()}]:`, ...data.payload);
                        }
                    } catch (e) { console.log('[WebView Raw]:', event.nativeEvent.data); }
                }}
            />

            {status.loading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#FFF" /></View>)}
            {status.error && (<View style={styles.errorOverlay}><Text style={styles.errorText}>{status.error}</Text></View>)}

            <TouchableOpacity style={[styles.actionButton, { bottom: 120, backgroundColor: isAddingMarker ? '#c0392b' : '#2980b9' }]} onPress={() => setIsAddingMarker(!isAddingMarker)}>
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