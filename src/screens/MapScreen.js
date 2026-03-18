import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

import AddMarkerModal from '../components/AddMarkerModal';

const mapHtmlAsset = Asset.fromModule(require('./map.html'));

const COLORS = {
    primary: '#81C784',
    primaryDark: '#388E3C',
    accent: '#4DB6AC',
    danger: '#e57373',
    white: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.95)',
    shadow: '#000'
};

const MapScreen = ({ showHeatmap, showMarkers, mapTheme, filters, userRole, userId }) => {
    const [status, setStatus] = useState({ loading: true, error: null });
    const [initialHtml, setInitialHtml] = useState(null);
    const webviewRef = useRef(null);
    const [isAddingMarker, setIsAddingMarker] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [newMarkerCoords, setNewMarkerCoords] = useState(null);

    // ESTADOS PARA EDIÇÃO / NOVA COLETA
    const [editMode, setEditMode] = useState(false);
    const [markerToEdit, setMarkerToEdit] = useState(null);

    const API_URL = `${API_BASE_URL}/api`;

    useEffect(() => {
        const loadHtmlTemplate = async () => {
            try {
                if (!mapHtmlAsset.downloaded) await mapHtmlAsset.downloadAsync();
                const htmlContent = await FileSystem.readAsStringAsync(mapHtmlAsset.localUri);
                setInitialHtml(htmlContent);
            } catch (e) {
                setStatus({ loading: false, error: 'Falha ao carregar o template do mapa.' });
            }
        };
        loadHtmlTemplate();
    }, []);

    const updateMapData = async () => {
        if (!webviewRef.current) return;
        try {
            setStatus(prev => ({ ...prev, loading: true, error: null }));
            const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') throw new Error('Permissão negada.');

            const currentLocation = await Location.getCurrentPositionAsync({});

            // Filtros da API
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.types && filters.types.length > 0) params.append('types', filters.types.join(','));

            const response = await fetch(`${API_URL}/marcacoes/?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao buscar dados.');

            const pollutionData = await response.json();
            const initialData = {
                userCoords: currentLocation.coords,
                pollutionPoints: pollutionData,
                showHeatmap,
                showMarkers,
                apiBaseUrl: API_BASE_URL
            };

            webviewRef.current.injectJavaScript(`window.init(${JSON.stringify(initialData)}); true;`);
            setStatus(prev => ({ ...prev, loading: false }));
        } catch (e) {
            setStatus({ loading: false, error: e.message });
        }
    };

    // Sincroniza estados do App com a WebView
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
        if (initialHtml) updateMapData();
    }, [filters, initialHtml]);

    const handleSaveMarker = async (marcacaoData, imageAsset, isEdit = false, markerId = null) => {
        const url = isEdit ? `${API_URL}/marcacoes/${markerId}` : `${API_URL}/marcacoes/`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            let finalData = { ...marcacaoData };
            const token = await SecureStore.getItemAsync('user_jwt_token');

            if (imageAsset) {
                const formData = new FormData();
                formData.append('file', {
                    uri: imageAsset.uri,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                });

                const uploadResponse = await fetch(`${API_URL}/upload/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                const uploadData = await uploadResponse.json();
                if (!uploadResponse.ok) throw new Error(uploadData.error || "Erro no upload");
                finalData.imagem_url = uploadData.image_url;
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(finalData)
            });

            const resData = await response.json();
            if (response.ok) {
                Alert.alert("Sucesso", isEdit ? "Marcação atualizada!" : "Marcação criada!");
                setModalVisible(false);
                setEditMode(false);
                setMarkerToEdit(null);
                updateMapData();
            } else {
                throw new Error(resData.error || "Falha na operação");
            }
        } catch (error) {
            Alert.alert("Erro", error.message);
        }
    };

    if (!initialHtml) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <AddMarkerModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditMode(false);
                    setMarkerToEdit(null);
                }}
                onSave={handleSaveMarker}
                initialCoords={newMarkerCoords}
                userRole={userRole}
                editMode={editMode}
                markerToEdit={markerToEdit}
            />

            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: initialHtml }}
                style={styles.webview}
                onLoadEnd={updateMapData}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);

                        // 1. Novo ponto clicado no mapa
                        if (data.type === 'marker_added') {
                            setNewMarkerCoords({
                                latitude: data.payload.latitude || data.payload.lat,
                                longitude: data.payload.longitude || data.payload.lng
                            });
                            setEditMode(false);
                            setMarkerToEdit(null);
                            setModalVisible(true);
                            setIsAddingMarker(false);
                        }

                        // 2. Edição de dados existentes
                        else if (data.type === 'edit_marker_request') {
                            const marker = data.payload;

                            // Regra de Propriedade: Apenas dono edita comunitário
                            const isOwner = marker.usuario_id === userId;
                            if (marker.projeto === 'comunitario' && !isOwner && userRole !== 'pesquisador') {
                                Alert.alert("Acesso Negado", "Você só pode editar suas próprias marcações.");
                                return;
                            }

                            setMarkerToEdit(marker);
                            setEditMode(true);
                            setNewMarkerCoords({ latitude: marker.lat, longitude: marker.lng });
                            setModalVisible(true);
                        }

                        // 3. Adição de nova coleta (Série Temporal)
                        else if (data.type === 'add_coleta_request') {
                            const ponto = data.payload;
                            // Pega a última coleta para sugerir os nomes dos campos técnicos
                            const ultimaColeta = ponto.coletas[0];
                            const template = ultimaColeta.detalhes.map(d => ({
                                chave: d.chave,
                                valor: "" // Valor limpo para nova entrada
                            }));

                            setMarkerToEdit({
                                ...ponto,
                                detalhes: template,
                                id: ponto.id // Referência para vincular a nova coleta
                            });
                            setEditMode(false); // Não é edição do registro antigo, é criação de um novo
                            setNewMarkerCoords({ latitude: ponto.lat, longitude: ponto.lng });
                            setModalVisible(true);
                        }
                    } catch (e) {
                        console.log('[WebView Message Error]:', e.message);
                    }
                }}
            />

            {status.loading && (
                <View style={styles.loadingPill}>
                    <ActivityIndicator size="small" color={COLORS.primaryDark} />
                    <Text style={styles.loadingPillText}>Atualizando...</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isAddingMarker ? COLORS.danger : COLORS.primary }]}
                onPress={() => setIsAddingMarker(!isAddingMarker)}
            >
                <MaterialCommunityIcons name={isAddingMarker ? "close" : "plus"} size={30} color="white" />
            </TouchableOpacity>

            {isAddingMarker && (
                <View style={styles.instructionPill}>
                    <Text style={styles.instructionText}>Toque no mapa para adicionar</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
    webview: { flex: 1, backgroundColor: COLORS.white },
    loadingPill: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: COLORS.overlay,
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        zIndex: 10,
    },
    loadingPillText: { color: COLORS.primaryDark, marginLeft: 8, fontWeight: 'bold', fontSize: 14 },
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
        zIndex: 20,
    },
    instructionPill: {
        position: 'absolute',
        bottom: 120,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    instructionText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});

export default MapScreen;