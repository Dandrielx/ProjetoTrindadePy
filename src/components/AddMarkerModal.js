import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, Button, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';

export default function AddMarkerModal({ visible, onClose, onSave, initialCoords }) {
    const [markerTipo, setMarkerTipo] = useState(null); // Iniciar como null
    const [markerIntensidade, setMarkerIntensidade] = useState('');
    const [markerDescricao, setMarkerDescricao] = useState('');
    const [markerImage, setMarkerImage] = useState(null);

    // Limpa os campos sempre que o modal se torna visível
    useEffect(() => {
        if (visible) {
            setMarkerTipo(null);
            setMarkerIntensidade('');
            setMarkerDescricao('');
            setMarkerImage(null);
        }
    }, [visible]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.25,
        });

        if (!result.canceled) {
            setMarkerImage(result.assets[0]);
        }
    };

    const handleSave = () => {
        // 1. Converte a intensidade para número
        const intensidade = parseInt(markerIntensidade.trim(), 10);

        // 2. Validações separadas para mensagens de erro claras
        if (!markerTipo) {
            Alert.alert("Campo Obrigatório", "Por favor, selecione um tipo de poluição.");
            return;
        }

        if (isNaN(intensidade) || intensidade < 1 || intensidade > 10) {
            Alert.alert("Valor Inválido", "A intensidade deve ser um número entre 1 e 10.");
            return; s
        }

        // 3. Se tudo estiver correto, monta o objeto de dados
        const marcacaoData = {
            latitude: initialCoords.lat,
            longitude: initialCoords.lng,
            tipo_poluicao: markerTipo,
            intensidade: intensidade,
            descricao: markerDescricao,
        };

        // 4. Chama a função onSave passada pelo MapScreen
        onSave(marcacaoData, markerImage);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Adicionar Marcação</Text>

                    {markerImage && <Image source={{ uri: markerImage.uri }} style={styles.previewImage} />}

                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        <Text>{markerImage ? 'Trocar Imagem' : 'Selecionar Imagem'}</Text>
                    </TouchableOpacity>

                    <RNPickerSelect
                        onValueChange={(value) => setMarkerTipo(value)}
                        items={[
                            { label: 'Microplástico', value: 'microplastic' },
                            { label: 'Lixo (Geral)', value: 'garbage' },
                            { label: 'Óleo', value: 'oil' },
                        ]}
                        style={pickerSelectStyles}
                        placeholder={{ label: "Selecione o tipo de poluição...", value: null }}
                        value={markerTipo}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Intensidade (1-10)"
                        value={markerIntensidade}
                        onChangeText={setMarkerIntensidade}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Descrição (opcional)"
                        value={markerDescricao}
                        onChangeText={setMarkerDescricao}
                    />

                    <View style={styles.buttonRow}>
                        <Button title="Cancelar" color="red" onPress={onClose} />
                        <Button title="Salvar" onPress={handleSave} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Estilos
const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    input: { width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 5, marginBottom: 10, paddingHorizontal: 10 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
    imagePicker: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginBottom: 15,
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        color: 'black',
        paddingRight: 30,
        marginBottom: 10,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        color: 'black',
        paddingRight: 30,
        marginBottom: 10,
    },
});