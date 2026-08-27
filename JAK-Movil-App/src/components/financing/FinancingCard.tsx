import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Linking } from 'react-native';

interface FinancingCardProps {
  institution: {
    id: number;
    name: string;
    logo: any;
    phone: string;
    location: string;
    website: string;
  };
}

export function FinancingCard({ institution }: FinancingCardProps) {
  const handlePhoneCall = () => {
    Linking.openURL(`tel:${institution.phone}`);
  };

  const handleWebsite = () => {
    Linking.openURL(institution.website);
  };

  return (
    <View style={styles.card}>
      {/* Logo del banco */}
      <View style={styles.logoContainer}>
        <Image
          source={institution.logo}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Nombre del banco */}
      <Text style={styles.institutionName}>{institution.name}</Text>

      {/* Acciones - Botones de contacto */}
      <View style={styles.actionsContainer}>
        {/* Botón Teléfono */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePhoneCall}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>☎</Text>
        </TouchableOpacity>

        {/* Botón Ubicación */}
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>📍</Text>
        </TouchableOpacity>

        {/* Botón Sitio Web */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleWebsite}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>🔗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  logo: {
    width: '90%',
    height: '90%',
  },
  institutionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
});
