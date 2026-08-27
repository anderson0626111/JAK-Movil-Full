import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Linking, ScrollView } from 'react-native';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSendWhatsApp = () => {
    if (!formData.name || !formData.message) {
      alert('Por favor completa al menos tu nombre y un mensaje.');
      return;
    }

    const text = `Hola, mi nombre es ${formData.name}.\nCorreo: ${formData.email}\nTeléfono: ${formData.phone}\n\nMensaje: ${formData.message}`;
    const url = `https://wa.me/18496522611?text=${encodeURIComponent(text)}`; // Cambiar por el número de Rosibel Auto Sales Services
    
    Linking.openURL(url).catch(() => {
      alert('No se pudo abrir WhatsApp');
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ponte en Contacto con Nosotros</Text>
        <Text style={styles.subtitle}>
          ¿Tienes alguna duda o te interesa un vehículo? Escríbenos y te responderemos a la brevedad.
        </Text>

        {/* Formulario */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre Completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Juan Pérez"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.flex1]}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          <View style={[styles.formGroup, styles.flex1]}>
            <Text style={styles.label}>Teléfono / WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="809-000-0000"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mensaje *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escribe tu consulta aquí..."
            multiline
            numberOfLines={4}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
          />
        </View>

        <TouchableOpacity style={styles.sendButton} onPress={handleSendWhatsApp}>
          <Text style={styles.sendButtonText}>ENVIAR POR WHATSAPP 📲</Text>
        </TouchableOpacity>
      </View>

      {/* Información Directa */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📍 Ubicación</Text>
          <Text style={styles.infoText}>Bávaro, La Altagracia, República Dominicana</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📞 Atención Directa</Text>
          <Text style={styles.infoText}>+1 (809) 474-8410</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✉️ Correo Electrónico</Text>
          <Text style={styles.infoText}>contacto@rosybelautosales.com</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 800,
    width: '100%',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  flex1: {
    flex: 1,
    minWidth: 200,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  infoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: 800,
    width: '100%',
    marginTop: 24,
    gap: 16,
  },
  infoBox: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    color: '#111827',
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});