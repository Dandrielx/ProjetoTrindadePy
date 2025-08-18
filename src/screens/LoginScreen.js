import Reac, { useState } from 'react';
import { View, Text, Button, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import globalStyles from '../styles/global';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'user_jwt_token'; // Chave para armazenar o token
//const API_BASE_URL = 'http://192.168.192.166:3001/api/users'; // Exemplo se a nova porta for 3001

export default function LoginScreen({ navigation, setIsLoggedIn }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha email e senha.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha: password }), // 'senha' é o esperado pelo backend
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                await SecureStore.setItemAsync(TOKEN_KEY, data.token);
                setIsLoggedIn(true); // Atualiza o estado no AppNavigator

            } else {
                Alert.alert('Falha no Login', data.error || 'Email ou senha inválidos.');
            }
        } catch (error) {
            setLoading(false);
            console.error('Erro ao conectar com o servidor:', error);
            Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
        }
    };

    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Faça o login em sua conta</Text>
            <TextInput
                placeholder="Email"
                style={globalStyles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Senha"
                secureTextEntry
                style={globalStyles.input}
                value={password}
                onChangeText={setPassword}
            />
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <Button title="Login" onPress={handleLogin} />
            )}
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ color: '#007AFF', marginTop: 20, textAlign: 'center' }}>
                    Não tem conta? Cadastre-se
                </Text>
            </TouchableOpacity>
        </View>
    );
}
