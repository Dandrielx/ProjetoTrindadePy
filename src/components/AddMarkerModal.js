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
    ActivityIndicator,
    Switch
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
    const [isWater, setIsWater] = useState(false);
    const [localType, setLocalType] = useState('unico');

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
        // Proteção extra: se initialCoords vier com lat/lng, ele mapeia corretamente
        const lat = initialCoords.latitude || initialCoords.lat;
        const lng = initialCoords.longitude || initialCoords.lng;

        if (!lat || !lng) {
            alert("Erro: Coordenadas não encontradas.");
            return;
        }

        const markerData = {
            latitude: lat,
            longitude: lng,
            tipo_poluicao: type,
            intensidade: parseInt(intensity),
            descricao: description,
            agua: isWater,           // Campo novo do backend
            tipo_local: localType    // Campo novo do backend
        };

        console.log("Objeto enviado ao onSave:", markerData);
        onSave(markerData, image);
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Nova Ocorrência</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>

                        {/* CAMPO: AGUA OU TERRA */}
                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.label}>Encontrado na água?</Text>
                                <Text style={styles.subLabel}>{isWater ? "Sim (Mar/Rio)" : "Não (Praia/Terra)"}</Text>
                            </View>
                            <Switch
                                value={isWater}
                                onValueChange={setIsWater}
                                trackColor={{ false: "#DDD", true: "#A5D6A7" }}
                                thumbColor={isWater ? COLORS.primary : "#f4f3f4"}
                            />
                        </View>

                        {/* CAMPO: TIPO DE LOCAL (Lixo Único ou Área Suja) */}
                        <Text style={styles.label}>Formato da Poluição</Text>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, localType === 'unico' && styles.toggleBtnActive]}
                                onPress={() => setLocalType('unico')}
                            >
                                <MaterialCommunityIcons
                                    name="package-variant"
                                    size={20}
                                    color={localType === 'unico' ? "#FFF" : COLORS.primary}
                                />
                                <Text style={[styles.toggleText, localType === 'unico' && styles.toggleTextActive]}>Item Único</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.toggleBtn, localType === 'sujo' && styles.toggleBtnActive]}
                                onPress={() => setLocalType('sujo')}
                            >
                                <MaterialCommunityIcons
                                    name="image-filter-hdr" // Nome correto corrigido
                                    size={20}
                                    color={localType === 'sujo' ? "#FFF" : COLORS.primary}
                                />
                                <Text style={[styles.toggleText, localType === 'sujo' && styles.toggleTextActive]}>Local Sujo</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Tipo de Poluente</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={type}
                                onValueChange={(v) => setType(v)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Lixo (Geral)" value="lixo" />
                                <Picker.Item label="Óleo / Químico" value="oleo" />
                                <Picker.Item label="Plástico" value="plastico" />
                            </Picker>
                        </View>

                        <Text style={styles.label}>Intensidade (1 a 10)</Text>
                        <View style={styles.intensityContainer}>
                            <Text style={styles.intensityValue}>{intensity}</Text>
                            <TextInput
                                style={[styles.input, { flex: 1, marginLeft: 10 }]}
                                keyboardType="numeric"
                                value={intensity}
                                onChangeText={(v) => {
                                    if (v === '' || (parseInt(v) >= 1 && parseInt(v) <= 10)) setIntensity(v);
                                }}
                            />
                        </View>

                        <Text style={styles.label}>Descrição (Opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Descreva o local..."
                            multiline
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
                        </TouchableOpacity>
                    </ScrollView>

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
    // Estilos do seletor de tipo de local (Toggle Buttons)
    toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginHorizontal: 5
    },
    toggleBtnActive: { backgroundColor: COLORS.primary },
    toggleText: { marginLeft: 8, fontWeight: '600', color: COLORS.primary },
    toggleTextActive: { color: '#FFF' },
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