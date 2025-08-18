import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_BASE_URL } from '../config/api';

//const API_BASE_URL = 'http://192.168.192.166:3001/api/users';

export default function RegisterScreen({ navigation }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const handleRegister = async () => {
        if (!nome || !email || !senha) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        try {
            const targetUrl = `${API_BASE_URL}/register`;
            console.log("Tentando conectar a:", targetUrl); // Para ver no console do Metro
            Alert.alert("Conectando a", targetUrl); // Para ver no app
            const response = await fetch(`${API_BASE_URL}/register`, { // Usando a constante
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome, email, senha }),
            });

            const data = await response.json();

            if (response.ok) { // Status 200-299
                Alert.alert('Cadastro realizado!', data.message || `Bem-vindo, ${nome}!`);
                navigation.goBack(); // volta para o login
            } else {
                Alert.alert('Erro no Cadastro', data.error || 'Não foi possível realizar o cadastro.');
            }
        } catch (error) {
            console.error('Erro ao conectar com o servidor:', error);
            Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Tente novamente mais tarde.');
        }
    };

    // FRONT
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cadastro</Text>
            <TextInput
                style={styles.input}
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
            />
            <TextInput
                style={styles.input}
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Voltar para login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: {
        height: 50, borderWidth: 1, borderColor: '#ccc',
        borderRadius: 8, paddingHorizontal: 10, marginBottom: 15
    },
    button: {
        backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center'
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    link: { color: '#007AFF', marginTop: 20, textAlign: 'center' },
});
