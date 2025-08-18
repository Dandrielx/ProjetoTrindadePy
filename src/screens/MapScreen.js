import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location'; // Importa a biblioteca do Expo

const MapScreen = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // Este useEffect será executado uma vez, quando o componente for montado
    useEffect(() => {
        (async () => {
            // 1. Pede permissão para acessar a localização
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permissão para acessar a localização foi negada');
                setLoading(false);
                return;
            }

            // 2. Pega a localização atual do usuário
            try {
                let currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation);
            } catch (error) {
                setErrorMsg('Não foi possível obter a localização. Verifique se o GPS está ativado.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Função para gerar o HTML do mapa dinamicamente
    const createMapHtml = (coords) => {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const userLat = ${coords.latitude};
          const userLng = ${coords.longitude};

          const map = L.map('map').setView([userLat, userLng], 15); // Centraliza na localização do usuário

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Adiciona um marcador azul para a localização do usuário
          L.marker([userLat, userLng]).addTo(map)
            .bindPopup('Você está aqui!')
            .openPopup();

          // Adiciona um círculo para indicar a precisão
          L.circle([userLat, userLng], {
            radius: ${coords.accuracy}, // A precisão vem do objeto de localização
            color: 'blue',
            fillColor: '#30f',
            fillOpacity: 0.2
          }).addTo(map);

        </script>
      </body>
      </html>
    `;
    };

    // Renderização condicional
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Obtendo localização...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.center}>
                <Text>{errorMsg}</Text>
            </View>
        );
    }

    if (location) {
        return (
            <WebView
                originWhitelist={['*']}
                source={{ html: createMapHtml(location.coords) }} // Gera o HTML com as coordenadas
                style={styles.webview}
                setBuiltInZoomControls={false}
            />
        );
    }

    // Fallback caso algo inesperado aconteça
    return (
        <View style={styles.center}>
            <Text>Não foi possível carregar o mapa.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webview: {
        flex: 1,
    },
});

export default MapScreen;