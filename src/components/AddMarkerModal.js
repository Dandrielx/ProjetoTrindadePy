import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // Se não tiver, instale: npx expo install @react-native-picker/picker

// Paleta
const COLORS = {
    primary: '#81C784',
    primaryDark: '#2E7D32',
    background: '#FFFFFF',
    inputBg: '#F5F5F5',
    text: '#333',
    placeholder: '#999',
    danger: '#ef5350',
    overlay: 'rgba(0,0,0,0.6)'
};

const AddMarkerModal = ({ visible, onClose, onSave, initialCoords }) => {
    const [type, setType] = useState('lixo');
    const [intensity, setIntensity] = useState('1');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);

    // Reseta os campos quando o modal abre
    useEffect(() => {
        if (visible) {
            setType('lixo');
            setIntensity('5');
            setDescription('');
            setImage(null);
        }
    }, [visible]);

    const pickImage = async () => {
        setLoadingImage(true);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
        setLoadingImage(false);
    };

    const handleSave = () => {
        // Prepara os dados
        const markerData = {
            latitude: initialCoords.latitude,
            longitude: initialCoords.longitude,
            tipo_poluicao: type,
            intensidade: parseInt(intensity),
            descricao: description,
        };
        // Chama a função do pai
        onSave(markerData, image);
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header do Modal */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Nova Ocorrência</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>

                        <Text style={styles.label}>Tipo de Poluição</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={type}
                                onValueChange={(itemValue) => setType(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Lixo Plástico" value="lixo" />
                                <Picker.Item label="Óleo / Químico" value="oleo" />
                                <Picker.Item label="Rede de Pesca" value="rede" />
                                <Picker.Item label="Outros" value="outros" />
                            </Picker>
                        </View>

                        <Text style={styles.label}>Intensidade (1 a 10)</Text>
                        <View style={styles.intensityContainer}>
                            <Text style={styles.intensityValue}>{intensity}</Text>
                            <View style={{ flex: 1, paddingLeft: 10 }}>
                                {/* Slider Simulado (ou use @react-native-community/slider) */}
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={intensity}
                                    onChangeText={(v) => {
                                        if (v === '' || (parseInt(v) >= 1 && parseInt(v) <= 10)) setIntensity(v);
                                    }}
                                    placeholder="1-10"
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Descrição (Opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Descreva o local..."
                            multiline
                            numberOfLines={3}
                            value={description}
                            onChangeText={setDescription}
                        />

                        <Text style={styles.label}>Foto</Text>
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {image ? (
                                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <MaterialCommunityIcons name="camera-plus" size={30} color={COLORS.primary} />
                                    <Text style={styles.placeholderText}>Adicionar Foto</Text>
                                </View>
                            )}
                            {loadingImage && <ActivityIndicator style={styles.loading} color={COLORS.primary} />}
                        </TouchableOpacity>

                    </ScrollView>

                    {/* Footer com Botões */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={[styles.buttonText, styles.cancelText]}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.buttonText}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: COLORS.background,
        borderRadius: 20,
        elevation: 10,
        maxHeight: '90%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primaryDark
    },
    content: {
        padding: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 10
    },
    input: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: COLORS.text
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top'
    },
    pickerContainer: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 10,
        overflow: 'hidden' // Importante para o border radius no Android
    },
    picker: {
        height: 50,
        width: '100%',
        color: COLORS.text
    },
    intensityContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    intensityValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        width: 30,
        textAlign: 'center'
    },
    imagePicker: {
        height: 120,
        backgroundColor: COLORS.inputBg,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        borderStyle: 'dashed',
        overflow: 'hidden'
    },
    placeholderImage: {
        alignItems: 'center'
    },
    placeholderText: {
        color: COLORS.primary,
        marginTop: 5,
        fontWeight: '500'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#EEE'
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5
    },
    cancelButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD'
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#FFF'
    },
    cancelText: {
        color: '#777'
    }
});

export default AddMarkerModal;