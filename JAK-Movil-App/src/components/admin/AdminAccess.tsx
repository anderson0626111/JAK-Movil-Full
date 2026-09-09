import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../config/api';

export interface AdminUser { id: number; nombre: string; email: string; rol: 'admin'; }

interface VehicleRecord {
  id: number; marca: string; modelo: string; anio?: number; precio: number; moneda: 'USD' | 'DOP';
  tipo: string; transmision: string; combustible: string; condicion?: string; color_exterior?: string | null;
  kilometraje?: string | null; accesorios?: string | null; descripcion?: string | null; fotos?: string[];
  estado?: 'disponible' | 'vendido';
}

type VehicleForm = Omit<VehicleRecord, 'id' | 'anio' | 'precio' | 'fotos' | 'estado'> & { anio: string; precio: string };

const emptyForm: VehicleForm = { marca: '', modelo: '', anio: '', precio: '', moneda: 'USD', tipo: '', transmision: '', combustible: '', condicion: 'Usado', color_exterior: '', kilometraje: '', accesorios: '', descripcion: '' };

function getError(data: unknown, fallback: string) {
  return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string' ? data.error : fallback;
}

export function AdminLogin({ onAuthenticated, onCancel }: { onAuthenticated: (token: string, user: AdminUser, remember: boolean) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login() {
    try {
      setLoading(true); setError('');
      const response = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, contrasena }) });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible iniciar sesion'));
      onAuthenticated(data.token, data.usuario, remember);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible iniciar sesion'); }
    finally { setLoading(false); }
  }

  return <View style={styles.accessWrap}><View style={styles.accessPanel}>
    <Text style={styles.title}>Acceder</Text><Text style={styles.hint}>Ingresa tus credenciales para continuar.</Text>
    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <TextInput style={styles.input} value={contrasena} onChangeText={setContrasena} placeholder="Contrasena" secureTextEntry autoComplete="current-password" onSubmitEditing={login} />
    <View style={styles.rememberRow}><Switch value={remember} onValueChange={setRemember} trackColor={{ false: '#d1d5db', true: '#fca5a5' }} thumbColor={remember ? '#dc2626' : '#ffffff'} /><Text style={styles.rememberText}>Mantener sesion iniciada</Text></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={onCancel}><Text style={styles.secondaryText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={login} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Entrar</Text>}</TouchableOpacity></View>
  </View></View>;
}

export function AdminPanel({ token, user, onLogout, onBack }: { token: string; user: AdminUser; onLogout: () => void; onBack: () => void }) {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saleCandidate, setSaleCandidate] = useState<VehicleRecord | null>(null);
  const [selling, setSelling] = useState(false);
  const [message, setMessage] = useState('');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const change = (field: keyof VehicleForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetForm = () => { setEditingId(null); setPhotoUrls([]); setForm(emptyForm); setMessage(''); };

  async function loadVehicles() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/vehiculos`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible cargar el inventario'));
      setVehicles(data);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible cargar el inventario'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadVehicles(); }, []);

  function edit(vehicle: VehicleRecord) {
    setEditingId(vehicle.id);
    setForm({ marca: vehicle.marca, modelo: vehicle.modelo, anio: String(vehicle.anio ?? ''), precio: String(vehicle.precio), moneda: vehicle.moneda, tipo: vehicle.tipo, transmision: vehicle.transmision, combustible: vehicle.combustible, condicion: vehicle.condicion || 'Usado', color_exterior: vehicle.color_exterior || '', kilometraje: vehicle.kilometraje || '', accesorios: vehicle.accesorios || '', descripcion: vehicle.descripcion || '' });
    setPhotoUrls(vehicle.fotos || []); setMessage('Editando vehiculo seleccionado.');
  }

  async function save() {
    try {
      const precioTexto = form.precio.trim();
      const precio = Number(precioTexto.replace(/[^0-9.]/g, ''));
      if (!precioTexto || !Number.isFinite(precio) || precio <= 0) { setMessage('Ingresa un precio valido mayor que cero.'); return; }
      setSaving(true); setMessage('');
      const response = await fetch(`${API_URL}/api/admin/vehiculos${editingId ? `/${editingId}` : ''}`, { method: editingId ? 'PUT' : 'POST', headers, body: JSON.stringify({ ...form, anio: Number(form.anio), precio }) });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible guardar el vehiculo'));
      const wasEditing = Boolean(editingId); resetForm(); setMessage(wasEditing ? 'Vehiculo actualizado.' : 'Vehiculo creado.'); await loadVehicles();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible guardar el vehiculo'); }
    finally { setSaving(false); }
  }

  async function uploadPhoto(file: File) {
    if (!editingId) return;
    try {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) throw new Error('Selecciona una imagen JPG, PNG o WebP');
      if (file.size > 5 * 1024 * 1024) throw new Error('La imagen debe pesar como maximo 5 MB');
      setUploading(true); setMessage('');
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('No se pudo leer la imagen')); reader.readAsDataURL(file); });
      const response = await fetch(`${API_URL}/api/admin/vehiculos/${editingId}/fotos`, { method: 'POST', headers, body: JSON.stringify({ dataUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible subir la foto'));
      setPhotoUrls((current) => [...current, data.foto]); setMessage('Foto subida correctamente.'); await loadVehicles();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible subir la foto'); }
    finally { setUploading(false); }
  }

  async function confirmSale() {
    if (!saleCandidate) return;
    try {
      setSelling(true);
      const response = await fetch(`${API_URL}/api/admin/vehiculos/${saleCandidate.id}/vender`, { method: 'PATCH', headers });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible registrar la venta'));
      if (editingId === saleCandidate.id) resetForm();
      setMessage(data.mensaje);
      setSaleCandidate(null);
      await loadVehicles();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible registrar la venta'); }
    finally { setSelling(false); }
  }

  async function cancelSale(id: number) {
    try {
      const response = await fetch(`${API_URL}/api/admin/vehiculos/${id}/cancelar-venta`, { method: 'PATCH', headers });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible cancelar la venta'));
      setMessage(data.mensaje);
      await loadVehicles();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible cancelar la venta'); }
  }

  const field = (label: string, key: keyof VehicleForm, options?: string[]) => <View style={styles.field} key={key}><Text style={styles.label}>{label}</Text>{options ? <View style={styles.optionRow}>{options.map((option) => <TouchableOpacity key={option} onPress={() => change(key, option)} style={[styles.option, form[key] === option && styles.optionSelected]}><Text style={[styles.optionText, form[key] === option && styles.optionTextSelected]}>{option}</Text></TouchableOpacity>)}</View> : <TextInput style={[styles.input, (key === 'accesorios' || key === 'descripcion') && styles.textarea]} value={String(form[key] ?? '')} onChangeText={(value) => change(key, value)} multiline={key === 'accesorios' || key === 'descripcion'} keyboardType={key === 'anio' || key === 'precio' ? 'numeric' : 'default'} />}</View>;

  const availableVehicles = vehicles.filter((vehicle) => vehicle.estado !== 'vendido');
  const soldVehicles = vehicles.filter((vehicle) => vehicle.estado === 'vendido');
  const renderVehicle = (vehicle: VehicleRecord, sold = false) => <View key={vehicle.id} style={styles.vehicleRow}><View style={styles.vehicleInfo}><Text style={styles.vehicleTitle}>{vehicle.marca} {vehicle.modelo}</Text><Text style={styles.vehicleMeta}>{vehicle.anio} · {vehicle.moneda} {Number(vehicle.precio).toLocaleString()}</Text>{sold && <Text style={styles.soldText}>Vehiculo vendido</Text>}</View><TouchableOpacity onPress={() => edit(vehicle)} style={styles.editButton}><Text style={styles.editText}>Editar</Text></TouchableOpacity>{sold ? <TouchableOpacity onPress={() => cancelSale(vehicle.id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Volver a publicar</Text></TouchableOpacity> : <TouchableOpacity onPress={() => setSaleCandidate(vehicle)} style={styles.deleteButton}><Text style={styles.deleteText}>Vender</Text></TouchableOpacity>}</View>;

  return <View style={styles.panel}>
    <View style={styles.panelHeader}><View><Text style={styles.title}>Administracion</Text><Text style={styles.hint}>{user.nombre} · Inventario</Text></View><View style={styles.headerActions}><TouchableOpacity style={styles.secondaryButton} onPress={onBack}><Text style={styles.secondaryText}>Volver al catalogo</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={onLogout}><Text style={styles.secondaryText}>Salir</Text></TouchableOpacity></View></View>
    <View style={styles.form}><Text style={styles.formTitle}>{editingId ? 'Editar vehiculo' : 'Agregar vehiculo'}</Text><View style={styles.fieldGrid}>{field('Marca', 'marca')}{field('Modelo', 'modelo')}{field('Año', 'anio')}{field('Precio', 'precio')}{field('Moneda', 'moneda', ['USD', 'DOP'])}{field('Condicion', 'condicion', ['Nuevo', 'Usado'])}{field('Tipo', 'tipo')}{field('Transmision', 'transmision')}{field('Combustible', 'combustible')}{field('Color exterior', 'color_exterior')}{field('Kilometraje', 'kilometraje')}</View>{field('Caracteristicas (una por linea)', 'accesorios')}{field('Descripcion', 'descripcion')}
      {editingId ? <View style={styles.photoSection}><Text style={styles.label}>Fotos del vehiculo</Text>{Platform.OS === 'web' && <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => { const file = event.currentTarget.files?.[0]; if (file) await uploadPhoto(file); event.currentTarget.value = ''; }} />}{uploading && <ActivityIndicator color="#dc2626" style={styles.uploading} />}<View style={styles.photoRow}>{photoUrls.map((uri) => <Image key={uri} source={{ uri }} style={styles.thumbnail} />)}</View></View> : <Text style={styles.hint}>Guarda el vehiculo antes de subir sus fotos.</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}<View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryText}>Limpiar</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editingId ? 'Guardar cambios' : 'Crear vehiculo'}</Text>}</TouchableOpacity></View>
    </View>
    <Text style={styles.formTitle}>Vehiculos disponibles</Text>
    {loading ? <ActivityIndicator color="#dc2626" /> : availableVehicles.map((vehicle) => renderVehicle(vehicle))}
    <Text style={[styles.formTitle, styles.soldSectionTitle]}>Vehiculos vendidos</Text>
    {!loading && (soldVehicles.length ? soldVehicles.map((vehicle) => renderVehicle(vehicle, true)) : <Text style={styles.hint}>Aun no hay vehiculos vendidos.</Text>)}
    <Modal visible={saleCandidate !== null} transparent animationType="fade" onRequestClose={() => !selling && setSaleCandidate(null)}><View style={styles.modalOverlay}><View style={styles.modalPanel}><Text style={styles.formTitle}>Confirmar venta</Text><Text style={styles.modalText}>¿Confirmas que el vehículo {saleCandidate?.marca} {saleCandidate?.modelo} fue vendido?</Text><Text style={styles.modalHint}>Dejará de aparecer del catálogo público, pero conservará sus datos en Vehiculos vendidos.</Text><View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setSaleCandidate(null)} disabled={selling}><Text style={styles.secondaryText}>No, cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={confirmSale} disabled={selling}>{selling ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sí, vender</Text>}</TouchableOpacity></View></View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  accessWrap: { alignItems: 'center', padding: 32 }, accessPanel: { width: '100%', maxWidth: 440, backgroundColor: '#fff', padding: 24, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }, panel: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 24 }, panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }, headerActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, title: { color: '#111827', fontSize: 22, fontWeight: '800' }, hint: { color: '#6b7280', marginTop: 4 }, rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }, rememberText: { color: '#374151', fontSize: 14 }, form: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 20, marginBottom: 26 }, formTitle: { color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 16 }, soldSectionTitle: { marginTop: 30 }, fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, field: { minWidth: 190, flexGrow: 1, flexBasis: 220, marginBottom: 14 }, label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 6 }, input: { minHeight: 42, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, paddingHorizontal: 10, color: '#111827', backgroundColor: '#fff' }, textarea: { height: 92, paddingTop: 10, textAlignVertical: 'top' }, optionRow: { flexDirection: 'row', gap: 8 }, option: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10 }, optionSelected: { borderColor: '#dc2626', backgroundColor: '#fef2f2' }, optionText: { color: '#374151', fontWeight: '700' }, optionTextSelected: { color: '#b91c1c' }, photoSection: { marginBottom: 14 }, photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, thumbnail: { width: 90, height: 68, borderRadius: 4, backgroundColor: '#e5e7eb' }, uploading: { alignSelf: 'flex-start', marginTop: 10 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }, primaryButton: { minWidth: 116, minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#dc2626', borderRadius: 4 }, primaryText: { color: '#fff', fontWeight: '800' }, secondaryButton: { minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 4, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' }, secondaryText: { color: '#374151', fontWeight: '700' }, error: { color: '#b91c1c', marginTop: 10 }, message: { color: '#374151', marginBottom: 12 }, vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, vehicleInfo: { flex: 1 }, vehicleTitle: { color: '#111827', fontWeight: '800' }, vehicleMeta: { color: '#6b7280', marginTop: 2 }, soldText: { color: '#b45309', fontSize: 12, fontWeight: '700', marginTop: 4 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }, modalPanel: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 8, padding: 24 }, modalText: { color: '#111827', fontSize: 16, lineHeight: 23 }, modalHint: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginTop: 10 }, editButton: { padding: 9 }, editText: { color: '#b91c1c', fontWeight: '800' }, deleteButton: { padding: 9 }, deleteText: { color: '#991b1b', fontWeight: '800' },
});
