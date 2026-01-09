import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#81C784',
    background: '#F7F9F8',
    white: '#FFFFFF',
    text: '#333',
    cardBg: '#FFFFFF',
};

const StatisticsScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />



            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Card de Resumo Rápido */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>129</Text>
                        <Text style={styles.summaryLabel}>Total</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: '#026796ff' }]}>45</Text>
                        <Text style={styles.summaryLabel}>Na Água</Text>
                    </View>
                </View>

                {/* Placeholder de Gráfico 1 */}
                <Text style={styles.sectionTitle}>Distribuição por Tipo</Text>
                <View style={styles.chartPlaceholder}>
                    <MaterialCommunityIcons name="chart-pie" size={80} color="#E0E0E0" />
                    <Text style={styles.placeholderText}>Gráfico de Pizza: Tipos de Poluentes</Text>
                </View>

                {/* Placeholder de Gráfico 2 */}
                <Text style={styles.sectionTitle}>Intensidade Média Mensal</Text>
                <View style={styles.chartPlaceholder}>
                    <MaterialCommunityIcons name="chart-line" size={80} color="#E0E0E0" />
                    <Text style={styles.placeholderText}>Gráfico de Linha: Evolução Temporal</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    scrollContent: { padding: 20 },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 25,
        marginBottom: 25,
        elevation: 4,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
    summaryLabel: { fontSize: 14, color: '#FFF', opacity: 0.9 },
    divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
    chartPlaceholder: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    placeholderText: { marginTop: 10, color: '#AAA', fontSize: 14 }
});

export default StatisticsScreen;