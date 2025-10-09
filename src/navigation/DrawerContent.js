// src/navigation/DrawerContent.js
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity, Button, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const POLLUTANT_TYPES = [
    { label: 'Microplástico', value: 'microplastic' },
    { label: 'Lixo (Geral)', value: 'garbage' },
    { label: 'Óleo', value: 'oil' },
];

export function DrawerContent({ navigation, ...props }) {
    const {
        showHeatmap, setShowHeatmap,
        showMarkers, setShowMarkers,
        mapTheme, setMapTheme,
        filters, setFilters // Recebe os filtros ATUAIS e a função para ATUALIZÁ-LOS
    } = props;

    // 1. CRIA UM ESTADO "RASCUNHO" LOCAL PARA OS FILTROS
    const [draftFilters, setDraftFilters] = useState(filters);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState('startDate');

    // Sincroniza o rascunho se os filtros principais mudarem
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
            // Modifica o estado rascunho
            setDraftFilters(prev => ({ ...prev, [datePickerTarget]: dateString }));
        }
    };

    const handleTypeToggle = (typeValue) => {
        // Modifica o estado rascunho
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

    // 2. FUNÇÃO DO BOTÃO "APLICAR"
    const applyFilters = () => {
        setFilters(draftFilters); // Atualiza o estado principal no MapDrawerNavigator
        navigation.closeDrawer(); // Fecha o menu para ver o resultado
    };

    return (
        // Usamos um SafeAreaView + ScrollView para garantir que o botão não sobreponha o conteúdo
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Visualização</Text>
                <View style={styles.separator} />
                <View style={styles.controlItem}>
                    <Text style={styles.label}>Mapa de Calor</Text>
                    <Switch value={showHeatmap} onValueChange={setShowHeatmap} />
                </View>
                <View style={styles.controlItem}>
                    <Text style={styles.label}>Pontos Individuais</Text>
                    <Switch value={showMarkers} onValueChange={setShowMarkers} />
                </View>
                <View style={styles.controlItem}>
                    <Text style={styles.label}>Tema Escuro</Text>
                    <Switch value={mapTheme === 'dark'} onValueChange={toggleTheme} />
                </View>

                <View style={styles.separator} />
                <Text style={styles.title}>Filtros</Text>

                <Text style={styles.label}>Período:</Text>
                <View style={styles.dateRow}>
                    <Button title={draftFilters.startDate || "Data Início"} onPress={() => { setDatePickerTarget('startDate'); setShowDatePicker(true); }} />
                    <Text>até</Text>
                    <Button title={draftFilters.endDate || "Data Fim"} onPress={() => { setDatePickerTarget('endDate'); setShowDatePicker(true); }} />
                </View>
                {(draftFilters.startDate || draftFilters.endDate) && (
                    <TouchableOpacity onPress={clearDateFilters}>
                        <Text style={styles.clearButton}>Limpar Datas</Text>
                    </TouchableOpacity>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                <Text style={styles.label}>Tipo de Poluente:</Text>
                {POLLUTANT_TYPES.map(type => (
                    <TouchableOpacity key={type.value} style={styles.checkboxRow} onPress={() => handleTypeToggle(type.value)}>
                        <MaterialCommunityIcons name={draftFilters.types.includes(type.value) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color="#333" />
                        <Text style={styles.checkboxLabel}>{type.label}</Text>
                    </TouchableOpacity>
                ))}
                {draftFilters.types.length > 0 && (
                    <TouchableOpacity onPress={clearTypeFilters}>
                        <Text style={styles.clearButton}>Limpar Tipos</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* 3. BOTÃO "APLICAR" NO FINAL DO DRAWER */}
            <View style={styles.applyButtonContainer}>
                <Button title="Aplicar Filtros" onPress={applyFilters} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    separator: { height: 1, backgroundColor: '#ccc', marginVertical: 15 },
    controlItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    label: { fontSize: 16, color: '#333' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 10 },
    clearButton: { color: '#e74c3c', textAlign: 'center', marginTop: 5, marginBottom: 15, fontSize: 14 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    checkboxLabel: { marginLeft: 10, fontSize: 16, color: '#333' },
    applyButtonContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#f8f8f8'
    }
});