import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TOKEN_KEY = 'user_jwt_token';

// Paleta (Mantenha consistente com o Login)
const COLORS = {
    primary: '#81C784',
    primaryDark: '#2E7D32',
    background: '#FFFFFF',
    text: '#333',
    cardBg: '#F5F5F5',
    danger: '#e57373'
};

export default function HomeScreen({ navigation, setIsLoggedIn }) {
    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (e) {
            console.error("Erro ao remover token", e);
        }
        setIsLoggedIn(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.greeting}>Olá, Pesquisador!</Text>
                <Text style={styles.subtitle}>O que vamos monitorar hoje?</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.mapCard}
                    onPress={() => navigation.navigate('Map')}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardIconContainer}>
                        <MaterialCommunityIcons name="map-search-outline" size={40} color="#FFF" />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Abrir Mapa</Text>
                        <Text style={styles.cardDesc}>Visualizar e adicionar pontos de poluição</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primaryDark} />
                </TouchableOpacity>

                {/* Aqui você pode adicionar mais cards futuramente (ex: Estatísticas, Perfil) */}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Sair da conta</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    header: { marginTop: 60, marginBottom: 40 },
    greeting: { fontSize: 32, fontWeight: 'bold', color: COLORS.primaryDark },
    subtitle: { fontSize: 16, color: '#666', marginTop: 5 },

    content: { flex: 1 },
    mapCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 20,
        borderRadius: 20,
        elevation: 2, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EEEEEE'
    },
    cardIconContainer: {
        backgroundColor: COLORS.primary,
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    cardTextContainer: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    cardDesc: { fontSize: 12, color: '#888', marginTop: 2 },

    footer: { marginBottom: 30, alignItems: 'center' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' }
});