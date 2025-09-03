import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Switch, SafeAreaView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
// Ícone para o botão de tema
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MapScreen = () => {
    const [status, setStatus] = useState({ loading: true, error: null, mapHtml: null });

    // Estados para controlar a UI
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(false);
    const [mapTheme, setMapTheme] = useState('light'); // 'light' ou 'dark'

    useEffect(() => {
        const loadMap = async () => {
            // Para não mostrar o loading toda vez que um switch muda, apenas na primeira vez
            if (!status.mapHtml) {
                setStatus(prev => ({ ...prev, loading: true }));
            }

            try {
                // ... (código de permissão e localização continua o mesmo) ...
                let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
                if (permissionStatus !== 'granted') throw new Error('A permissão para aceder à localização foi negada.');

                const currentLocation = await Location.getCurrentPositionAsync({});
                if (!currentLocation) throw new Error('Não foi possível obter a localização atual.');

                const asset = Asset.fromModule(require('./map.html'));
                await asset.downloadAsync();
                let htmlContent = await FileSystem.readAsStringAsync(asset.localUri);

                const pollutionData = [
                    // --- Centro e Porto ---
                    { lat: -32.0353, lng: -52.0986, intensity: 9, type: 'garbage' },        // Perto do centro
                    { lat: -32.038, lng: -52.095, intensity: 7, type: 'microplastic' },   // Cais do Porto
                    { lat: -32.045, lng: -52.105, intensity: 6, type: 'oil' },             // Área portuária
                    { lat: -32.033, lng: -52.100, intensity: 8, type: 'garbage' },
                    { lat: -32.036, lng: -52.097, intensity: 10, type: 'garbage' },       // Ponto intenso no centro
                    { lat: -32.037, lng: -52.099, intensity: 5, type: 'microplastic' },
                    { lat: -32.041, lng: -52.093, intensity: 7, type: 'oil' },
                    { lat: -32.043, lng: -52.102, intensity: 9, type: 'microplastic' },
                    { lat: -32.032, lng: -52.096, intensity: 10, type: 'garbage' },
                    { lat: -32.040, lng: -52.108, intensity: 8, type: 'oil' },

                    // --- Praia do Cassino ---
                    { lat: -32.188, lng: -52.164, intensity: 10, type: 'microplastic' },  // Perto dos Vagonetes
                    { lat: -32.19, lng: -52.165, intensity: 8, type: 'microplastic' },   // Orla
                    { lat: -32.177, lng: -52.168, intensity: 5, type: 'garbage' },       // Entrada da praia
                    { lat: -32.21, lng: -52.18, intensity: 7, type: 'garbage' },        // Mais ao sul na praia
                    { lat: -32.291, lng: -52.260, intensity: 9, type: 'oil' },           // Perto do Navio Altair (simulando mancha)

                    // --- Molhes da Barra ---
                    { lat: -32.160, lng: -52.097, intensity: 6, type: 'microplastic' },   // Molhe Oeste
                    { lat: -32.165, lng: -52.092, intensity: 8, type: 'garbage' },        // Arredores do molhe

                    // --- Bairros Residenciais e Lagoa ---
                    { lat: -32.05, lng: -52.13, intensity: 4, type: 'garbage' },        // Parque São Pedro
                    { lat: -32.07, lng: -52.15, intensity: 1, type: 'oil' },             // Margem da Lagoa dos Patos
                    { lat: -32.08, lng: -52.16, intensity: 10, type: 'microplastic' },
                    { lat: -32.02, lng: -52.11, intensity: 3, type: 'garbage' }         // Próximo à FURG
                ];

                // Substitui todos os placeholders
                htmlContent = htmlContent.replace(/__USER_COORDS__/g, JSON.stringify(currentLocation.coords));
                htmlContent = htmlContent.replace(/__POLLUTION_DATA__/g, JSON.stringify(pollutionData));
                htmlContent = htmlContent.replace(/__SHOW_HEATMAP__/g, showHeatmap);
                htmlContent = htmlContent.replace(/__SHOW_MARKERS__/g, showMarkers);
                htmlContent = htmlContent.replace(/__MAP_THEME__/g, `'${mapTheme}'`); // Adiciona aspas para ser uma string JS

                setStatus({ loading: false, error: null, mapHtml: htmlContent });

            } catch (e) {
                console.error("Erro ao carregar o mapa:", e);
                setStatus({ loading: false, error: e.message, mapHtml: null });
            }
        };

        loadMap();
    }, [showHeatmap, showMarkers, mapTheme]); // Re-executa quando qualquer opção muda

    const toggleTheme = () => {
        setMapTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    // --- Lógica de Renderização ---
    if (status.loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>A carregar mapa...</Text>
            </View>
        );
    }

    if (status.error) {
        return (
            <View style={styles.center}>
                <Text>Ocorreu um erro:</Text>
                <Text>{status.error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {status.mapHtml && (
                <WebView
                    originWhitelist={['*']}
                    source={{ html: status.mapHtml }}
                    style={styles.webview}
                />
            )}

            {/* Botão para alternar o tema do mapa */}
            <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
                <MaterialCommunityIcons
                    name={mapTheme === 'light' ? "weather-night" : "weather-sunny"}
                    size={24}
                    color="white"
                />
            </TouchableOpacity>

            {/* Painel de Controlo */}
            <View style={styles.controls}>
                <View style={styles.controlItem}>
                    <Text>Mostrar Mapa de Calor</Text>
                    <Switch value={showHeatmap} onValueChange={setShowHeatmap} />
                </View>
                <View style={styles.controlItem}>
                    <Text>Mostrar Pontos Individuais</Text>
                    <Switch value={showMarkers} onValueChange={setShowMarkers} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    webview: { flex: 1 },
    controls: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
    controlItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    themeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
        zIndex: 10, // Garante que o botão fique sobre o mapa
    },
});

export default MapScreen;