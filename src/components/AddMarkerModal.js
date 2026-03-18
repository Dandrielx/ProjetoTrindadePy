import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';

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
import { Picker } from '@react-native-picker/picker';

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

const AddMarkerModal = ({ visible, onClose, onSave, initialCoords, userRole, editMode = false, markerToEdit = null }) => {
    // ESTADOS GERAIS
    const [activeTab, setActiveTab] = useState('comum');
    const [latStr, setLatStr] = useState('');
    const [lngStr, setLngStr] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [dataColeta, setDataColeta] = useState(new Date().toISOString().split('T')[0]);
    const [date, setDate] = useState(new Date()); // Inicia com a data atual
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ESTADOS CIDADÃO
    const [type, setType] = useState('lixo');
    const [intensity, setIntensity] = useState('5');
    const [isWater, setIsWater] = useState(false);
    const [localType, setLocalType] = useState('unico');

    // ESTADOS PESQUISADOR
    const [projeto, setProjeto] = useState('maranhao');
    const [suggestedFields, setSuggestedFields] = useState([]);
    const [customValues, setCustomValues] = useState({});
    const [newFields, setNewFields] = useState([]);

        const onChangeDate = (event, selectedDate) => {
        // No Android, o 'event.type' pode ser 'set' ou 'dismissed'
        setShowDatePicker(false); 
        if (selectedDate) {
            setDate(selectedDate);
        }
        };

    // 1. Carregar campos sugeridos do Backend
    useEffect(() => {
        if (visible && userRole === 'pesquisador' && activeTab === 'pesquisa') {
            fetch(`${API_BASE_URL}/api/marcacoes/config/campos/${projeto}`)
                .then(res => res.json())
                .then(data => setSuggestedFields(data))
                .catch(err => console.error("Erro ao buscar campos:", err));
        }
    }, [projeto, visible, activeTab]);

    // 2. Sincronizar dados ao abrir o modal
    useEffect(() => {
        if (visible) {
            // Sincroniza Coordenadas (Sempre)
            setLatStr(String(initialCoords?.latitude || initialCoords?.lat || ''));
            setLngStr(String(initialCoords?.longitude || initialCoords?.lng || ''));

            if (editMode && markerToEdit) {
                const proj = markerToEdit.projeto || 'comunitario';
                setProjeto(proj === 'comunitario' ? 'maranhao' : proj);
                setDescription(markerToEdit.description || '');
                setDataColeta(markerToEdit.data.split('T')[0]);

                // Campos da Aba Comum (Cidadão)
                setType(markerToEdit.type || 'lixo');
                setIntensity(String(markerToEdit.intensity || '5'));
                setIsWater(!!markerToEdit.agua);
                setLocalType(markerToEdit.tipo_local || 'unico');



                // Definição de Aba e Metadados Técnicos
                if (proj === 'comunitario') {
                    setActiveTab('comum');
                    setCustomValues({});
                } else {
                    setActiveTab('pesquisa');
                    const detailsMap = {};
                    markerToEdit.detalhes?.forEach(d => detailsMap[d.chave] = d.valor);
                    setCustomValues(detailsMap);
                }
            } else {
                setDataColeta(new Date().toISOString().split('T')[0]);
                // Reset Total para Novo Ponto
                setDescription('');
                setImage(null);
                setCustomValues({});
                setNewFields([]);
                setType('lixo');
                setIntensity('5');
                setIsWater(false);
                setLocalType('unico');
                setActiveTab('comum');
            }
        }
    }, [visible, initialCoords, editMode, markerToEdit]);

    const pickImage = async () => {
        setLoadingImage(true);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0]);
        setLoadingImage(false);
    };

    const handleSave = () => {
        const finalLat = parseFloat(latStr);
        const finalLng = parseFloat(lngStr);

        const dataFormatada = date.toISOString().split('T')[0]; // Gera "2024-03-17"

        if (isNaN(finalLat) || isNaN(finalLng)) {
            alert("Coordenadas inválidas.");
            return;
        }

        // Processa metadados da aba de pesquisa
        const detalhes = Object.keys(customValues)
            .filter(key => customValues[key] && String(customValues[key]).trim() !== '')
            .map(key => ({ chave: key.toLowerCase(), valor: String(customValues[key]) }));

        let markerData = {
            marcacao_id: markerToEdit ? markerToEdit.id : null,
            latitude: finalLat,
            longitude: finalLng,
            data_coleta: dataFormatada,
            descricao: description,
            projeto: projeto,
            detalhes: detalhes,
            intensidade: 5,           // Default para pesquisa
            tipo_poluicao: 'pesquisa', // Default para pesquisa
            agua: false,
            tipo_local: 'unico'
        };

        // Sobrescreve com dados da aba comum se for o caso
        if (activeTab === 'comum') {
            markerData.projeto = 'comunitario';
            markerData.intensidade = parseInt(intensity);
            markerData.tipo_poluicao = type;
            markerData.agua = isWater;
            markerData.tipo_local = localType;
            markerData.detalhes = [];
        }

        // O markerToEdit?.id garante que o backend receba o ID correto no PUT
        onSave(markerData, image, editMode, markerToEdit?.id);
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{editMode ? "Editar Ponto" : "Nova Ocorrência"}</Text>
                        <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color="#999" /></TouchableOpacity>
                    </View>

                    {/* Barra de Abas: Só aparece se for pesquisador e não estiver editando ponto comunitário */}
                    {userRole === 'pesquisador' && (!editMode || markerToEdit?.projeto !== 'comunitario') && (
                        <View style={styles.tabContainer}>
                            <TouchableOpacity style={[styles.tab, activeTab === 'comum' && styles.activeTab]} onPress={() => setActiveTab('comum')}><Text style={[styles.tabText, activeTab === 'comum' && styles.activeTabText]}>Cidadão</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, activeTab === 'pesquisa' && styles.activeTab]} onPress={() => setActiveTab('pesquisa')}><Text style={[styles.tabText, activeTab === 'pesquisa' && styles.activeTabText]}>Pesquisador</Text></TouchableOpacity>
                        </View>
                    )}

                    <ScrollView contentContainerStyle={styles.content}>
                        {activeTab === 'comum' ? (
                            <>
                                <View style={styles.switchRow}>
                                    <View><Text style={styles.label}>Encontrado na água?</Text><Text style={styles.subLabel}>{isWater ? "Sim (Mar/Rio)" : "Não (Praia/Terra)"}</Text></View>
                                    <Switch value={isWater} onValueChange={setIsWater} trackColor={{ false: "#DDD", true: "#A5D6A7" }} thumbColor={isWater ? COLORS.primary : "#f4f3f4"} />
                                </View>

                                <Text style={styles.label}>Formato da Poluição</Text>
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity style={[styles.toggleBtn, localType === 'unico' && styles.toggleBtnActive]} onPress={() => setLocalType('unico')}><MaterialCommunityIcons name="package-variant" size={20} color={localType === 'unico' ? "#FFF" : COLORS.primary} /><Text style={[styles.toggleText, localType === 'unico' && styles.toggleTextActive]}>Item Único</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.toggleBtn, localType === 'sujo' && styles.toggleBtnActive]} onPress={() => setLocalType('sujo')}><MaterialCommunityIcons name="image-filter-hdr" size={20} color={localType === 'sujo' ? "#FFF" : COLORS.primary} /><Text style={[styles.toggleText, localType === 'sujo' && styles.toggleTextActive]}>Local Sujo</Text></TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Tipo de Poluente</Text>
                                <View style={styles.pickerContainer}><Picker selectedValue={type} onValueChange={setType} style={styles.picker}><Picker.Item label="Lixo (Geral)" value="lixo" /><Picker.Item label="Óleo / Químico" value="oleo" /><Picker.Item label="Plástico" value="plastico" /></Picker></View>

                                <Text style={styles.label}>Intensidade (1 a 10)</Text>
                                <View style={styles.intensityContainer}><Text style={styles.intensityValue}>{intensity}</Text><TextInput style={[styles.input, { flex: 1, marginLeft: 10 }]} keyboardType="numeric" value={intensity} onChangeText={setIntensity} /></View>

                                <Text style={styles.label}>Descrição (Opcional)</Text>
                                <TextInput style={[styles.input, styles.textArea]} placeholder="Descreva o local..." multiline value={description} onChangeText={setDescription} />

                                <Text style={styles.label}>Foto</Text>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>{image ? <Image source={{ uri: image.uri }} style={styles.previewImage} /> : <View style={styles.placeholderImage}><MaterialCommunityIcons name="camera-plus" size={30} color={COLORS.primary} /><Text style={styles.placeholderText}>Adicionar Foto</Text></View>}</TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>Data da Coleta</Text>
                                <TouchableOpacity 
                                    style={styles.input} 
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primaryDark} />
                                        <Text style={{ marginLeft: 10, color: COLORS.text }}>
                                            {date.toLocaleDateString('pt-BR')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeDate} // Agora a função existe
                                        maximumDate={new Date()} // Opcional: não permite datas futuras
                                    />
                                )}
                                <Text style={styles.label}>Coordenadas (Edição Manual)</Text>
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.subLabel}>Latitude</Text><TextInput style={styles.input} value={latStr} onChangeText={setLatStr} keyboardType="numeric" /></View>
                                    <View style={{ flex: 1 }}><Text style={styles.subLabel}>Longitude</Text><TextInput style={styles.input} value={lngStr} onChangeText={setLngStr} keyboardType="numeric" /></View>
                                </View>

                                <Text style={styles.label}>Projeto</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={projeto} onValueChange={setProjeto} style={styles.picker}>
                                        <Picker.Item label="Maranhão (Laranja)" value="maranhao" />
                                        <Picker.Item label="Trindade (Azul Escuro)" value="trindade" />
                                    </Picker>
                                </View>

                                <View style={styles.researchHeader}>
                                    <Text style={styles.label}>Dados da Pesquisa (BD)</Text>
                                    <TouchableOpacity onPress={() => setNewFields([...newFields, ''])}><MaterialCommunityIcons name="plus-circle" size={26} color={COLORS.primaryDark} /></TouchableOpacity>
                                </View>

                                {suggestedFields.map(campo => (
                                    <View key={campo} style={styles.dynamicRow}>
                                        <Text style={styles.fieldKeyLabel}>{campo.toUpperCase()}:</Text>
                                        <TextInput style={[styles.input, { flex: 1 }]} value={customValues[campo] || ''} onChangeText={(v) => setCustomValues({ ...customValues, [campo]: v })} />
                                    </View>
                                ))}

                                {newFields.map((_, index) => (
                                    <View key={index} style={styles.dynamicRow}>
                                        <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Novo Nome" onChangeText={(key) => { const f = [...newFields]; f[index] = key; setNewFields(f); }} />
                                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Valor" onChangeText={(v) => { if (newFields[index]) setCustomValues({ ...customValues, [newFields[index]]: v }); }} />
                                    </View>
                                ))}

                                <Text style={styles.label}>Descrição (Opcional)</Text>
                                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

                                <Text style={styles.label}>Foto (Opcional)</Text>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>{image ? <Image source={{ uri: image.uri }} style={styles.previewImage} /> : <MaterialCommunityIcons name="camera-plus" size={30} color={COLORS.primary} />}</TouchableOpacity>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>{loadingImage ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{editMode ? "Atualizar" : "Salvar"}</Text>}</TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: 20 },
    modalContainer: { backgroundColor: COLORS.background, borderRadius: 20, elevation: 10, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryDark },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    tab: { flex: 1, padding: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
    tabText: { color: '#999', fontWeight: 'bold' },
    activeTabText: { color: COLORS.primaryDark },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 15 },
    subLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    input: { backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.text },
    textArea: { height: 80, textAlignVertical: 'top' },
    pickerContainer: { backgroundColor: COLORS.inputBg, borderRadius: 10, overflow: 'hidden' },
    picker: { height: 50, width: '100%', color: COLORS.text },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    intensityContainer: { flexDirection: 'row', alignItems: 'center' },
    intensityValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, width: 30, textAlign: 'center' },
    toggleContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary, marginHorizontal: 5 },
    toggleBtnActive: { backgroundColor: COLORS.primary },
    toggleText: { marginLeft: 8, fontWeight: '600', color: COLORS.primary },
    toggleTextActive: { color: '#FFF' },
    imagePicker: { height: 100, backgroundColor: COLORS.inputBg, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD' },
    previewImage: { width: '100%', height: '100%', borderRadius: 10 },
    researchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    dynamicRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    fieldKeyLabel: { width: 100, fontWeight: 'bold', color: COLORS.primaryDark, fontSize: 12 },
    footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#EEE' },
    button: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
    cancelButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
    saveButton: { backgroundColor: COLORS.primary },
    buttonText: { fontWeight: 'bold', color: '#FFF' },
    cancelText: { color: '#777', fontWeight: 'bold' }
});

export default AddMarkerModal;