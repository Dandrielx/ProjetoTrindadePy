import React from 'react';
import { View, Text, Button } from 'react-native';
import globalStyles from '../styles/global';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_jwt_token'; // Mesma chave

export default function HomeScreen({ navigation, setIsLoggedIn }) {
    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (e) {
            console.error("Erro ao remover token", e);
        }
        setIsLoggedIn(false); // Atualiza o estado
    };

    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Bem-vindo à Pesquisa!</Text>
            <Button title="Ir para o Mapa" onPress={() => navigation.navigate('Map')} />
            <View style={{ marginTop: 20 }}>
                <Button title="Logout" onPress={handleLogout} color="red" />
            </View>
        </View>
    );
}