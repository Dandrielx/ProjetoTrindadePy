import React from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView } from 'react-native';

// Recebemos os estados e as funções para alterá-los como props
export function DrawerContent({ showHeatmap, setShowHeatmap, showMarkers, setShowMarkers, mapTheme, setMapTheme }) {
    const toggleTheme = () => {
        setMapTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Opções do Mapa</Text>
            <View style={styles.separator} />

            <View style={styles.controlItem}>
                <Text style={styles.label}>Mapa de Calor</Text>
                <Switch value={showHeatmap} onValueChange={setShowHeatmap} />
            </View>
            <View style={styles.controlItem}>
                <Text style={styles.label}>Pontos Individuais</Text>
                <Switch value={showMarkers} onValueChange={setShowMarkers} />
            </View>
            <View style={styles.controlItem}>
                <Text style={styles.label}>Tema Escuro</Text>
                <Switch value={mapTheme === 'dark'} onValueChange={toggleTheme} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    separator: {
        height: 1,
        backgroundColor: '#ccc',
        marginBottom: 20,
    },
    controlItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    label: {
        fontSize: 16,
    },
});