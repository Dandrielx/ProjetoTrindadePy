// src/navigation/DrawerContent.js
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const POLLUTANT_TYPES = [
    { label: 'Microplástico', value: 'microplastic' },
    { label: 'Lixo (Geral)', value: 'garbage' },
    { label: 'Óleo', value: 'oil' },
];

const THEME_COLOR = '#81C784'; // Verde Pastel
const TEXT_COLOR = '#2E3A33';
const BG_COLOR = '#FFFFFF';

export function DrawerContent({ navigation, ...props }) {
    const {
        showHeatmap, setShowHeatmap,
        showMarkers, setShowMarkers,
        mapTheme, setMapTheme,
        filters, setFilters
    } = props;

    // --- LÓGICA (MANTIDA) ---
    const [draftFilters, setDraftFilters] = useState(filters);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState('startDate');

    useEffect(() => {
        setDraftFilters(filters);
    }, [filters]);

    const toggleTheme = () => {
        setMapTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            setDraftFilters(prev => ({ ...prev, [datePickerTarget]: dateString }));
        }
    };

    const handleTypeToggle = (typeValue) => {
        setDraftFilters(prev => {
            const newTypes = new Set(prev.types);
            if (newTypes.has(typeValue)) {
                newTypes.delete(typeValue);
            } else {
                newTypes.add(typeValue);
            }
            return { ...prev, types: Array.from(newTypes) };
        });
    };

    const clearDateFilters = () => {
        setDraftFilters(prev => ({ ...prev, startDate: null, endDate: null }));
    };

    const clearTypeFilters = () => {
        setDraftFilters(prev => ({ ...prev, types: [] }));
    };

    const applyFilters = () => {
        setFilters(draftFilters);
        navigation.closeDrawer();
    };

    // Componente Auxiliar de Botão para manter estilo consistente
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

                {/* CABEÇALHO MODERNO */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>US</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>Usuário</Text>
                        <Text style={styles.userEmail}>usuario@email.com</Text>
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

                {/* SEÇÃO FILTROS */}
                <Text style={styles.sectionTitle}>Filtros</Text>

                <View style={styles.card}>
                    <Text style={styles.subLabel}>Período</Text>
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
                        <TouchableOpacity onPress={clearDateFilters} style={styles.clearLink}>
                            <Text style={styles.clearLinkText}>Limpar Datas</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.divider} />

                    <Text style={[styles.subLabel, { marginTop: 10 }]}>Poluentes</Text>
                    {POLLUTANT_TYPES.map(type => (
                        <TouchableOpacity key={type.value} style={styles.checkboxRow} onPress={() => handleTypeToggle(type.value)}>
                            <MaterialCommunityIcons
                                name={draftFilters.types.includes(type.value) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                size={24}
                                color={draftFilters.types.includes(type.value) ? THEME_COLOR : '#ccc'}
                            />
                            <Text style={styles.checkboxLabel}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                    {draftFilters.types.length > 0 && (
                        <TouchableOpacity onPress={clearTypeFilters} style={styles.clearLink}>
                            <Text style={styles.clearLinkText}>Limpar Tipos</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#F7F9F8', // Fundo off-white levemente esverdeado/cinza
        paddingTop: 40,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: THEME_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_COLOR,
    },
    userEmail: {
        fontSize: 14,
        color: '#757575',
    },
    // Sections
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#757575',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginTop: 10,
    },
    card: {
        backgroundColor: BG_COLOR,
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 10,
    },
    label: {
        fontSize: 16,
        color: TEXT_COLOR,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
        marginBottom: 10,
    },
    // Buttons Helpers
    btn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    btnPrimary: {
        backgroundColor: THEME_COLOR,
    },
    btnOutline: {
        borderWidth: 1,
        borderColor: THEME_COLOR,
        backgroundColor: 'transparent',
    },
    btnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    btnTextPrimary: {
        color: '#FFF',
    },
    btnTextOutline: {
        color: THEME_COLOR,
    },
    // Date & Filters
    dateButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateTo: {
        color: '#999',
        marginHorizontal: 10,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
        color: TEXT_COLOR,
    },
    clearLink: {
        alignSelf: 'flex-end',
        marginTop: 5,
        marginBottom: 5,
    },
    clearLinkText: {
        color: '#E57373', // Vermelho suave pastel
        fontSize: 12,
        fontWeight: '600',
    },
    // Footer / Apply Button
    footer: {
        padding: 20,
        backgroundColor: BG_COLOR,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    applyButton: {
        backgroundColor: THEME_COLOR,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: THEME_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    applyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});