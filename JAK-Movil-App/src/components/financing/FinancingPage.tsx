import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { financingInstitutions } from '../../data/financingData';
import { FinancingCard } from './FinancingCard';

export function FinancingPage() {
  return (
    <ScrollView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>Financiamientos y Seguros</Text>
        <Text style={styles.subtitle}>
          Nuestros Aliados en Financiamiento y Protección
        </Text>
      </View>

      {/* Grid de tarjetas */}
      <View style={styles.gridContainer}>
        {financingInstitutions.map((institution) => (
          <FinancingCard
            key={institution.id}
            institution={institution}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Contáctanos para más información sobre nuestras opciones de financiamiento
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#262626',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  footer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
