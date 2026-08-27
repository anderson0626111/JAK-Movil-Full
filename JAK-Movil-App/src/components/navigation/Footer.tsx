import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

interface FooterProps {
  onHomePress?: () => void;
  onContactPress?: () => void;
  onCatalogPress?: () => void;
  onAboutPress?: () => void;
}

export function Footer({
  onHomePress,
  onContactPress,
  onCatalogPress,
  onAboutPress,
}: FooterProps) {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Error al abrir enlace: ", err));
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.content}>
        
        {/* Sección 1: Marca / Descripción */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>Rosybel Auto Sales <Text style={styles.brandAccent}></Text></Text>
          <Text style={styles.brandDescription}>
            Tu plataforma de confianza para encontrar, comparar y comprar vehículos en la República Dominicana.
          </Text>
        </View>

        {/* Sección 2: Enlaces Rápidos */}
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>Navegación</Text>
          <TouchableOpacity onPress={onHomePress}>
            <Text style={styles.linkText}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCatalogPress}>
            <Text style={styles.linkText}>Catálogo de Vehículos</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAboutPress}>
            <Text style={styles.linkText}>Sobre Nosotros</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onContactPress}>
            <Text style={styles.linkText}>Contacto</Text>
          </TouchableOpacity>
        </View>

        {/* Sección 3: Contacto & Info */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <Text style={styles.contactText}> C/ Almirante #14 Veron, Punta Cana, Republica Dominicana</Text>
          <Text style={styles.contactText}> +1 (809) 474-8410</Text>
          <Text style={styles.contactText}> contacto@rosybelautosales.com</Text>
        </View>

      </View>

      {/* Separador */}
      <View style={styles.divider} />

      {/* Copyright */}
      <View style={styles.bottomBar}>
        <Text style={styles.copyrightText}>
           {new Date().getFullYear()} Rosybel Auto Sales. Todos los derechos reservados.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#111827',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 'auto',
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: 24,
  },
  brandSection: {
    flex: 1,
    minWidth: 250,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  brandAccent: {
    color: '#ef4444',
  },
  brandDescription: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  linksSection: {
    flex: 1,
    minWidth: 180,
  },
  contactSection: {
    flex: 1,
    minWidth: 220,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  linkText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  contactText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  bottomBar: {
    alignItems: 'center',
  },
  copyrightText: {
    color: '#6b7280',
    fontSize: 12,
  },
});