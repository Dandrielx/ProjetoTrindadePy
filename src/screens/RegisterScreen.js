import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '../config/api';

const COLORS = {
    primary: '#81C784',
    primaryDark: '#2E7D32',
    background: '#FFFFFF',
    inputBg: '#F5F5F5',
    text: '#333',
    placeholder: '#999'
};

export default function RegisterScreen({ navigation }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [cargo, setCargo] = useState('cidadao');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!nome || !email || !senha) {
            Alert.alert('Atenção', 'Preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, cargo }),
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                Alert.alert('Sucesso', 'Cadastro realizado!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Erro', data.error || 'Falha no cadastro.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.primaryDark} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Criar Conta</Text>
                <Text style={styles.subtitle}>Junte-se a nós</Text>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.primaryDark} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Nome Completo"
                        placeholderTextColor={COLORS.placeholder}
                        value={nome}
                        onChangeText={setNome}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primaryDark} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        placeholderTextColor={COLORS.placeholder}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.primaryDark} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        placeholderTextColor={COLORS.placeholder}
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <MaterialCommunityIcons
                            name={showPassword ? "eye" : "eye-off"}
                            size={22}
                            color={COLORS.placeholder}
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>Tipo de Perfil:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={cargo}
                        onValueChange={(itemValue) => setCargo(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Cidadão (Colaborador)" value="cidadao" />
                        <Picker.Item label="Pesquisador (Técnico)" value="pesquisador" />
                    </Picker>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Cadastrar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 20, paddingTop: 50 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 100 }, // Padding bottom evita teclado cobrindo
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 5 },
    subtitle: { fontSize: 16, color: COLORS.placeholder, marginBottom: 30 },
    pickerContainer: { backgroundColor: COLORS.inputBg, borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
    picker: { height: 55, width: '100%' },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    icon: { marginRight: 10 },
    input: { flex: 1, color: COLORS.text, fontSize: 16 },

    button: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});