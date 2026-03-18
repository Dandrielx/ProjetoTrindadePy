import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Lista de poluentes atualizada para incluir a categoria de Pesquisa
const POLLUTANT_TYPES = [
    { label: 'Plástico', value: 'plastico' },
    { label: 'Lixo (Geral)', value: 'lixo' },
    { label: 'Óleo', value: 'oleo' },
    { label: 'Pesquisa Técnica', value: 'pesquisa' }, // Novo filtro solicitado
];

const THEME_COLOR = '#81C784';
const TEXT_COLOR = '#2E3A33';
const BG_COLOR = '#FFFFFF';

export function DrawerContent({ navigation, ...props }) {
    const {
        showHeatmap, setShowHeatmap,
        showMarkers, setShowMarkers,
        mapTheme, setMapTheme,
        filters, setFilters
    } = props;

    // Estado local para manipulação antes de "Aplicar"
    const [draftFilters, setDraftFilters] = useState(filters);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState('startDate');

    // Sincroniza com o estado global quando o Drawer é aberto
    useEffect(() => {
        setDraftFilters(filters);
    }, [filters]);

    const toggleTheme = () => {
        setMapTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            // Formato YYYY-MM-DD para compatibilidade com o Backend
            const dateString = selectedDate.toISOString().split('T')[0];
            setDraftFilters(prev => ({ ...prev, [datePickerTarget]: dateString }));
        }
    };

    const handleTypeToggle = (typeValue) => {
        setDraftFilters(prev => {
            const newTypes = new Set(prev.types || []);
            if (newTypes.has(typeValue)) {
                newTypes.delete(typeValue);
            } else {
                newTypes.add(typeValue);
            }
            return { ...prev, types: Array.from(newTypes) };
        });
    };

    const clearFilters = (type) => {
        if (type === 'date') {
            setDraftFilters(prev => ({ ...prev, startDate: null, endDate: null }));
        } else {
            setDraftFilters(prev => ({ ...prev, types: [] }));
        }
    };

    const applyFilters = () => {
        setFilters(draftFilters);
        navigation.closeDrawer();
    };

    const CustomButton = ({ title, onPress, variant = 'primary' }) => (
        <TouchableOpacity
            style={[styles.btn, variant === 'outline' ? styles.btnOutline : styles.btnPrimary]}
            onPress={onPress}
        >
            <Text style={[styles.btnText, variant === 'outline' ? styles.btnTextOutline : styles.btnTextPrimary]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <View style={styles.avatarContainer}><Text style={styles.avatarText}>US</Text></View>
                    <View>
                        <Text style={styles.userName}>Configurações</Text>
                        <Text style={styles.userEmail}>Filtros de Visualização</Text>
                    </View>
                </View>

                {/* SEÇÃO VISUALIZAÇÃO */}
                <Text style={styles.sectionTitle}>Visualização</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Mapa de Calor</Text>
                        <Switch
                            trackColor={{ false: "#e0e0e0", true: "#A5D6A7" }}
                            thumbColor={showHeatmap ? THEME_COLOR : "#f4f3f4"}
                            value={showHeatmap}
                            onValueChange={setShowHeatmap}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Pontos Individuais</Text>
                        <Switch
                            trackColor={{ false: "#e0e0e0", true: "#A5D6A7" }}
                            thumbColor={showMarkers ? THEME_COLOR : "#f4f3f4"}
                            value={showMarkers}
                            onValueChange={setShowMarkers}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Tema Escuro</Text>
                        <Switch
                            trackColor={{ false: "#e0e0e0", true: "#A5D6A7" }}
                            thumbColor={mapTheme === 'dark' ? THEME_COLOR : "#f4f3f4"}
                            value={mapTheme === 'dark'}
                            onValueChange={toggleTheme}
                        />
                    </View>
                </View>

                {/* SEÇÃO FILTROS DE PERÍODO */}
                <Text style={styles.sectionTitle}>Filtros</Text>
                <View style={styles.card}>
                    <Text style={styles.subLabel}>Período das Coletas</Text>
                    <View style={styles.dateButtonsRow}>
                        <CustomButton
                            title={draftFilters.startDate || "Início"}
                            variant="outline"
                            onPress={() => { setDatePickerTarget('startDate'); setShowDatePicker(true); }}
                        />
                        <Text style={styles.dateTo}>até</Text>
                        <CustomButton
                            title={draftFilters.endDate || "Fim"}
                            variant="outline"
                            onPress={() => { setDatePickerTarget('endDate'); setShowDatePicker(true); }}
                        />
                    </View>
                    {(draftFilters.startDate || draftFilters.endDate) && (
                        <TouchableOpacity onPress={() => clearFilters('date')} style={styles.clearLink}>
                            <Text style={styles.clearLinkText}>Limpar Datas</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.divider} />

                    {/* SEÇÃO FILTROS DE TIPO */}
                    <Text style={[styles.subLabel, { marginTop: 10 }]}>Categorias de Poluição</Text>
                    {POLLUTANT_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.value}
                            style={styles.checkboxRow}
                            onPress={() => handleTypeToggle(type.value)}
                        >
                            <MaterialCommunityIcons
                                name={draftFilters.types?.includes(type.value) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                size={24}
                                color={draftFilters.types?.includes(type.value) ? THEME_COLOR : '#ccc'}
                            />
                            <Text style={styles.checkboxLabel}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                    {draftFilters.types?.length > 0 && (
                        <TouchableOpacity onPress={() => clearFilters('type')} style={styles.clearLink}>
                            <Text style={styles.clearLinkText}>Limpar Categorias</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                    <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9F8', paddingTop: 40 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: THEME_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    userName: { fontSize: 18, fontWeight: 'bold', color: TEXT_COLOR },
    userEmail: { fontSize: 14, color: '#757575' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#757575', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 10 },
    card: { backgroundColor: BG_COLOR, borderRadius: 12, padding: 15, marginBottom: 20, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
    label: { fontSize: 16, color: TEXT_COLOR },
    subLabel: { fontSize: 14, fontWeight: '600', color: '#757575', marginBottom: 10 },
    btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 100 },
    btnPrimary: { backgroundColor: THEME_COLOR },
    btnOutline: { borderWidth: 1, borderColor: THEME_COLOR, backgroundColor: 'transparent' },
    btnText: { fontSize: 14, fontWeight: '500' },
    btnTextPrimary: { color: '#FFF' },
    btnTextOutline: { color: THEME_COLOR },
    dateButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateTo: { color: '#999', marginHorizontal: 10 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    checkboxLabel: { marginLeft: 10, fontSize: 16, color: TEXT_COLOR },
    clearLink: { alignSelf: 'flex-end', marginTop: 5, marginBottom: 5 },
    clearLinkText: { color: '#E57373', fontSize: 12, fontWeight: '600' },
    footer: { padding: 20, backgroundColor: BG_COLOR, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    applyButton: { backgroundColor: THEME_COLOR, paddingVertical: 15, borderRadius: 10, alignItems: 'center', elevation: 4 },
    applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});