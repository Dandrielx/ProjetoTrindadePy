import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ícones
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'user_jwt_token';

// Paleta de cores local (pode mover para um arquivo separado depois)
const COLORS = {
    primary: '#81C784', // Verde Pastel
    primaryDark: '#2E7D32', // Verde Escuro (para texto/contraste)
    background: '#FFFFFF',
    inputBg: '#F5F5F5',
    text: '#333',
    placeholder: '#999'
};

export default function LoginScreen({ navigation, setIsLoggedIn }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Atenção', 'Preencha email e senha.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha: password }),
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                await SecureStore.setItemAsync(TOKEN_KEY, data.token);
                setIsLoggedIn(true);
            } else {
                Alert.alert('Erro', data.error || 'Dados inválidos.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Erro de Conexão', 'Verifique sua internet.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Bem-vindo de volta!</Text>
                <Text style={styles.subtitle}>Faça login para continuar</Text>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primaryDark} style={styles.icon} />
                    <TextInput
                        placeholder="Email"
                        placeholderTextColor={COLORS.placeholder}
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.primaryDark} style={styles.icon} />
                    <TextInput
                        placeholder="Senha"
                        placeholderTextColor={COLORS.placeholder}
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <MaterialCommunityIcons
                            name={showPassword ? "eye" : "eye-off"}
                            size={22}
                            color={COLORS.placeholder}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
                    <Text style={styles.footerText}>
                        Não tem conta? <Text style={styles.linkText}>Cadastre-se</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.placeholder,
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 12, // Borda arredondada moderna
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 55,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 2, // Sombra Android
        shadowColor: "#000", // Sombra iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerLink: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.text,
        fontSize: 14,
    },
    linkText: {
        color: COLORS.primaryDark,
        fontWeight: 'bold',
    }
});