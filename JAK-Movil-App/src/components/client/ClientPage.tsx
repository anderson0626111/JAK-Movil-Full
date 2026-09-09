import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../config/api';

export function ClientPage({ language }: { language: 'ES' | 'EN' }) {
  const isEnglish = language === 'EN';
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', vehiculo: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    try {
      setLoading(true); setMessage('');
      const response = await fetch(`${API_URL}/api/solicitudes-clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No fue posible enviar la solicitud');
      setForm({ nombre: '', email: '', telefono: '', vehiculo: '', mensaje: '' });
      setMessage(isEnglish ? 'Your request was sent. We will contact you soon.' : 'Tu solicitud fue enviada. Te contactaremos pronto.');
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible enviar la solicitud'); }
    finally { setLoading(false); }
  }

  const input = (key: keyof typeof form, label: string, options?: { email?: boolean; multiline?: boolean }) => <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, options?.multiline && styles.textarea]} value={form[key]} onChangeText={(value) => set(key, value)} keyboardType={options?.email ? 'email-address' : 'default'} autoCapitalize={options?.email ? 'none' : 'sentences'} multiline={options?.multiline} /></View>;

  return <View style={styles.page}><View style={styles.panel}>
    <Text style={styles.title}>{isEnglish ? 'Buy a vehicle' : 'Compra un vehículo'}</Text>
    <Text style={styles.subtitle}>{isEnglish ? 'Tell us which vehicle interests you and we will help you complete the purchase.' : 'Cuéntanos qué vehículo te interesa y te ayudaremos a completar la compra.'}</Text>
    {input('nombre', isEnglish ? 'Full name' : 'Nombre completo')}
    {input('email', isEnglish ? 'Email' : 'Correo electrónico', { email: true })}
    {input('telefono', isEnglish ? 'Phone number' : 'Teléfono')}
    {input('vehiculo', isEnglish ? 'Vehicle you are interested in' : 'Vehículo que te interesa')}
    {input('mensaje', isEnglish ? 'Message (optional)' : 'Mensaje (opcional)', { multiline: true })}
    {!!message && <Text style={styles.message}>{message}</Text>}
    <TouchableOpacity style={styles.submit} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{isEnglish ? 'Send request' : 'Enviar solicitud'}</Text>}</TouchableOpacity>
  </View></View>;
}

const styles = StyleSheet.create({
  page: { width: '100%', alignItems: 'center', padding: 32 }, panel: { width: '100%', maxWidth: 640, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 24 }, title: { color: '#111827', fontSize: 24, fontWeight: '800' }, subtitle: { color: '#6b7280', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 }, field: { marginBottom: 14 }, label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 6 }, input: { minHeight: 44, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, paddingHorizontal: 11, color: '#111827' }, textarea: { height: 96, paddingTop: 10, textAlignVertical: 'top' }, message: { color: '#166534', marginBottom: 14 }, submit: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#dc2626', paddingHorizontal: 18 }, submitText: { color: '#fff', fontWeight: '800' },
});
