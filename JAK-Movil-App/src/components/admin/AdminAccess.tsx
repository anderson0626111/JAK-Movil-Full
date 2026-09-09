import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../config/api';

export interface AdminUser { id: number; nombre: string; email: string; rol: 'admin'; }

interface VehicleRecord {
  id: number; marca: string; modelo: string; anio?: number; precio: number; moneda: 'USD' | 'DOP';
  tipo: string; transmision: string; combustible: string; condicion?: string; color_exterior?: string | null;
  kilometraje?: string | null; accesorios?: string | null; descripcion?: string | null; fotos?: string[];
  estado?: 'disponible' | 'vendido';
  vendido_en?: string | null; tiene_venta?: boolean | number;
}

interface ClientRequest {
  id: number; nombre: string; email: string; telefono: string; vehiculo: string; mensaje: string | null; creado_en: string;
}

interface ClientSale { id: number; vehiculo: string; nombre: string; apellido: string; cedula: string; direccion: string; vendido_en: string; }

type VehicleForm = Omit<VehicleRecord, 'id' | 'anio' | 'precio' | 'fotos' | 'estado'> & { anio: string; precio: string };

const emptyForm: VehicleForm = { marca: '', modelo: '', anio: '', precio: '', moneda: 'USD', tipo: '', transmision: '', combustible: '', condicion: 'Usado', color_exterior: '', kilometraje: '', accesorios: '', descripcion: '' };

function getError(data: unknown, fallback: string) {
  return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string' ? data.error : fallback;
}

export function AdminLogin({ language, onAuthenticated, onCancel }: { language: 'ES' | 'EN'; onAuthenticated: (token: string, user: AdminUser, remember: boolean) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEnglish = language === 'EN';

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
    <Text style={styles.title}>{isEnglish ? 'Sign in' : 'Acceder'}</Text><Text style={styles.hint}>{isEnglish ? 'Enter your credentials to continue.' : 'Ingresa tus credenciales para continuar.'}</Text>
    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={isEnglish ? 'Email' : 'Correo'} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <TextInput style={styles.input} value={contrasena} onChangeText={setContrasena} placeholder={isEnglish ? 'Password' : 'Contrasena'} secureTextEntry autoComplete="current-password" onSubmitEditing={login} />
    <View style={styles.rememberRow}><Switch value={remember} onValueChange={setRemember} trackColor={{ false: '#d1d5db', true: '#fca5a5' }} thumbColor={remember ? '#dc2626' : '#ffffff'} /><Text style={styles.rememberText}>{isEnglish ? 'Keep me signed in' : 'Mantener sesion iniciada'}</Text></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={onCancel}><Text style={styles.secondaryText}>{isEnglish ? 'Cancel' : 'Cancelar'}</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={login} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isEnglish ? 'Sign in' : 'Entrar'}</Text>}</TouchableOpacity></View>
  </View></View>;
}

export function AdminPanel({ token, user, language, onLogout, onBack }: { token: string; user: AdminUser; language: 'ES' | 'EN'; onLogout: () => void; onBack: () => void }) {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [clientSales, setClientSales] = useState<ClientSale[]>([]);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saleCandidate, setSaleCandidate] = useState<VehicleRecord | null>(null);
  const [selling, setSelling] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [buyer, setBuyer] = useState({ nombre: '', apellido: '', cedula: '', direccion: '' });
  const [editingClient, setEditingClient] = useState<ClientSale | null>(null);
  const [savingClient, setSavingClient] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientSale | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);
  const [message, setMessage] = useState('');
  const [section, setSection] = useState<'form' | 'available' | 'sold' | 'clients'>('form');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const isEnglish = language === 'EN';

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

  async function loadClientRequests() {
    try {
      const response = await fetch(`${API_URL}/api/admin/solicitudes-clientes`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible cargar las solicitudes'));
      setClientRequests(data.solicitudes || []);
      setClientSales(data.ventas || []);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible cargar las solicitudes'); }
  }

  useEffect(() => { loadVehicles(); loadClientRequests(); }, []);

  function edit(vehicle: VehicleRecord) {
    setSection('form');
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
    if (!buyer.nombre.trim() || !buyer.apellido.trim() || !buyer.cedula.trim() || !buyer.direccion.trim()) {
      const error = isEnglish ? 'Complete all buyer details.' : 'Completa todos los datos del comprador.';
      setSaleError(error);
      return;
    }
    try {
      setSaleError('');
      setSelling(true);
      const response = await fetch(`${API_URL}/api/admin/vehiculos/${saleCandidate.id}/vender`, { method: 'PATCH', headers, body: JSON.stringify(buyer) });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible registrar la venta'));
      if (editingId === saleCandidate.id) resetForm();
      setMessage(data.mensaje);
      setSaleCandidate(null);
      setBuyer({ nombre: '', apellido: '', cedula: '', direccion: '' });
      await loadVehicles();
      await loadClientRequests();
    } catch (reason) { setSaleError(reason instanceof Error ? reason.message : 'No fue posible registrar la venta'); }
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

  async function saveClient() {
    if (!editingClient) return;
    try {
      setSavingClient(true);
      const response = await fetch(`${API_URL}/api/admin/ventas/${editingClient.id}`, { method: 'PUT', headers, body: JSON.stringify(editingClient) });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible actualizar el cliente'));
      setEditingClient(null); setMessage(data.mensaje); await loadClientRequests();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible actualizar el cliente'); }
    finally { setSavingClient(false); }
  }

  function deleteClient(client: ClientSale) {
    setClientToDelete(client);
  }

  async function confirmDeleteClient() {
    if (!clientToDelete) return;
    try {
      setDeletingClient(true);
      const response = await fetch(`${API_URL}/api/admin/ventas/${clientToDelete.id}`, { method: 'DELETE', headers });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'No fue posible eliminar el cliente'));
      setClientToDelete(null);
      setMessage(data.mensaje || 'Cliente eliminado.');
      await loadClientRequests();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible eliminar el cliente'); }
    finally { setDeletingClient(false); }
  }

  async function downloadInvoice(client: ClientSale) {
    try {
      const response = await fetch(`${API_URL}/api/admin/ventas/${client.id}/factura`, { headers });
      if (!response.ok) { const data = await response.json(); throw new Error(getError(data, 'No fue posible generar la factura')); }
      if (Platform.OS !== 'web') throw new Error('La descarga de factura esta disponible en la version web.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `factura-venta-${client.id}.pdf`; link.click();
      window.URL.revokeObjectURL(url);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No fue posible generar la factura'); }
  }

  const field = (label: string, key: keyof VehicleForm, options?: string[]) => <View style={[styles.field, (key === 'accesorios' || key === 'descripcion') && styles.wideField]} key={key}><Text style={styles.label}>{label}</Text>{options ? <View style={styles.optionRow}>{options.map((option) => <TouchableOpacity key={option} onPress={() => change(key, option)} style={[styles.option, form[key] === option && styles.optionSelected]}><Text style={[styles.optionText, form[key] === option && styles.optionTextSelected]}>{option}</Text></TouchableOpacity>)}</View> : <TextInput style={[styles.input, (key === 'accesorios' || key === 'descripcion') && styles.textarea]} value={String(form[key] ?? '')} onChangeText={(value) => change(key, value)} multiline={key === 'accesorios' || key === 'descripcion'} keyboardType={key === 'anio' || key === 'precio' ? 'numeric' : 'default'} />}</View>;

  const availableVehicles = vehicles.filter((vehicle) => vehicle.estado !== 'vendido');
  const soldVehicles = vehicles.filter((vehicle) => vehicle.estado === 'vendido' || Boolean(vehicle.vendido_en) || Boolean(vehicle.tiene_venta));
  const renderVehicle = (vehicle: VehicleRecord, sold = false) => <View key={vehicle.id} style={styles.vehicleRow}><View style={styles.vehicleInfo}><Text style={styles.vehicleTitle}>{vehicle.marca} {vehicle.modelo}</Text><Text style={styles.vehicleMeta}>{vehicle.anio} · {vehicle.moneda} {Number(vehicle.precio).toLocaleString()}</Text>{sold && <Text style={styles.soldText}>{vehicle.estado === 'vendido' ? (isEnglish ? 'Vehicle sold' : 'Vehiculo vendido') : (isEnglish ? 'Vehicle sold and republished' : 'Vehiculo vendido y publicado de nuevo')}</Text>}</View><TouchableOpacity onPress={() => edit(vehicle)} style={styles.editButton}><Text style={styles.editText}>{isEnglish ? 'Edit vehicle' : 'Editar vehiculo'}</Text></TouchableOpacity>{sold && vehicle.estado === 'vendido' ? <TouchableOpacity onPress={() => cancelSale(vehicle.id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isEnglish ? 'Republish' : 'Volver a publicar'}</Text></TouchableOpacity> : !sold ? <TouchableOpacity onPress={() => setSaleCandidate(vehicle)} style={styles.deleteButton}><Text style={styles.deleteText}>{isEnglish ? 'Sell' : 'Vender'}</Text></TouchableOpacity> : null}</View>;

  return <View style={styles.panel}>
    <View style={styles.panelHeader}><View><Text style={styles.title}>{isEnglish ? 'Administration' : 'Administracion'}</Text><Text style={styles.hint}>{user.nombre} · {isEnglish ? 'Inventory' : 'Inventario'}</Text></View><View style={styles.headerActions}><TouchableOpacity style={styles.secondaryButton} onPress={onBack}><Text style={styles.secondaryText}>{isEnglish ? 'Back to catalog' : 'Volver al catalogo'}</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={onLogout}><Text style={styles.secondaryText}>{isEnglish ? 'Sign out' : 'Salir'}</Text></TouchableOpacity></View></View>
    <View style={styles.sectionTabs}><TouchableOpacity onPress={() => setSection('form')} style={[styles.sectionTab, section === 'form' && styles.sectionTabActive]}><Text style={[styles.sectionTabText, section === 'form' && styles.sectionTabTextActive]}>{editingId ? (isEnglish ? 'Edit vehicle' : 'Editar vehiculo') : (isEnglish ? 'Add vehicle' : 'Agregar vehiculo')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setSection('available')} style={[styles.sectionTab, section === 'available' && styles.sectionTabActive]}><Text style={[styles.sectionTabText, section === 'available' && styles.sectionTabTextActive]}>{isEnglish ? 'Available vehicles' : 'Vehiculos disponibles'}</Text></TouchableOpacity><TouchableOpacity onPress={() => setSection('sold')} style={[styles.sectionTab, section === 'sold' && styles.sectionTabActive]}><Text style={[styles.sectionTabText, section === 'sold' && styles.sectionTabTextActive]}>{isEnglish ? 'Sold vehicles' : 'Vehiculos vendidos'}</Text></TouchableOpacity><TouchableOpacity onPress={() => { setSection('clients'); loadClientRequests(); }} style={[styles.sectionTab, section === 'clients' && styles.sectionTabActive]}><Text style={[styles.sectionTabText, section === 'clients' && styles.sectionTabTextActive]}>{isEnglish ? 'Customers' : 'Clientes'}</Text></TouchableOpacity></View>
    {section === 'form' && <View style={styles.form}><Text style={styles.formTitle}>{editingId ? (isEnglish ? 'Edit vehicle' : 'Editar vehiculo') : (isEnglish ? 'Add vehicle' : 'Agregar vehiculo')}</Text><View style={styles.fieldGrid}>{field(isEnglish ? 'Make' : 'Marca', 'marca')}{field('Modelo', 'modelo')}{field(isEnglish ? 'Year' : 'Año', 'anio')}{field(isEnglish ? 'Price' : 'Precio', 'precio')}{field(isEnglish ? 'Currency' : 'Moneda', 'moneda', ['USD', 'DOP'])}{field(isEnglish ? 'Condition' : 'Condicion', 'condicion', ['Nuevo', 'Usado'])}{field(isEnglish ? 'Type' : 'Tipo', 'tipo')}{field(isEnglish ? 'Transmission' : 'Transmision', 'transmision')}{field(isEnglish ? 'Fuel' : 'Combustible', 'combustible')}{field(isEnglish ? 'Exterior color' : 'Color exterior', 'color_exterior')}{field(isEnglish ? 'Mileage' : 'Kilometraje', 'kilometraje')}</View>{field(isEnglish ? 'Features (one per line)' : 'Caracteristicas (una por linea)', 'accesorios')}{field(isEnglish ? 'Description' : 'Descripcion', 'descripcion')}
      {editingId ? <View style={styles.photoSection}><Text style={styles.label}>Fotos del vehiculo</Text>{Platform.OS === 'web' && <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => { const file = event.currentTarget.files?.[0]; if (file) await uploadPhoto(file); event.currentTarget.value = ''; }} />}{uploading && <ActivityIndicator color="#dc2626" style={styles.uploading} />}<View style={styles.photoRow}>{photoUrls.map((uri) => <Image key={uri} source={{ uri }} style={styles.thumbnail} />)}</View></View> : <Text style={styles.hint}>Guarda el vehiculo antes de subir sus fotos.</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}<View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryText}>{isEnglish ? 'Cancel' : 'Cancelar'}</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryText}>{isEnglish ? 'Clear' : 'Limpiar'}</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editingId ? (isEnglish ? 'Save changes' : 'Guardar cambios') : (isEnglish ? 'Add vehicle' : 'Añadir vehículo')}</Text>}</TouchableOpacity></View>
    </View>}
    {section === 'available' && <View style={styles.listSection}><Text style={styles.formTitle}>{isEnglish ? 'Available vehicles' : 'Vehiculos disponibles'}</Text>{loading ? <ActivityIndicator color="#dc2626" /> : availableVehicles.map((vehicle) => renderVehicle(vehicle))}</View>}
    {section === 'sold' && <View style={styles.listSection}><Text style={styles.formTitle}>{isEnglish ? 'Sold vehicles' : 'Vehiculos vendidos'}</Text>{loading ? <ActivityIndicator color="#dc2626" /> : (soldVehicles.length ? soldVehicles.map((vehicle) => renderVehicle(vehicle, true)) : <Text style={styles.hint}>{isEnglish ? 'There are no sold vehicles yet.' : 'Aun no hay vehiculos vendidos.'}</Text>)}</View>}
    {section === 'clients' && <View style={styles.listSection}><Text style={styles.formTitle}>{isEnglish ? 'Customers and sales' : 'Clientes y ventas'}</Text>{clientSales.length ? clientSales.map((sale) => <View key={`sale-${sale.id}`} style={styles.requestRow}><View style={clientStyles.row}><View style={clientStyles.info}><Text style={styles.vehicleTitle}>{sale.nombre} {sale.apellido}</Text><Text style={styles.vehicleMeta}>{sale.vehiculo}</Text><Text style={styles.requestText}>{isEnglish ? 'ID' : 'Cedula'}: {sale.cedula}</Text><Text style={styles.requestText}>{sale.direccion}</Text></View><View style={clientStyles.actions}><TouchableOpacity accessibilityLabel={isEnglish ? 'Edit customer' : 'Editar cliente'} onPress={() => setEditingClient(sale)} style={clientStyles.iconButton}><Text style={clientStyles.editIcon}>✎</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={isEnglish ? 'Delete customer' : 'Eliminar cliente'} onPress={() => deleteClient(sale)} style={clientStyles.iconButton}><Text style={clientStyles.deleteIcon}>🗑</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={isEnglish ? 'Download invoice PDF' : 'Descargar factura PDF'} onPress={() => downloadInvoice(sale)} style={[clientStyles.iconButton, clientStyles.invoiceButton]}><Text style={clientStyles.pdfIcon}>PDF</Text></TouchableOpacity></View></View></View>) : <Text style={styles.hint}>{isEnglish ? 'There are no registered sales yet.' : 'Aun no hay ventas registradas.'}</Text>}</View>}
    <Modal visible={saleCandidate !== null} transparent animationType="fade" onRequestClose={() => !selling && setSaleCandidate(null)}><View style={styles.modalOverlay}><View style={styles.modalPanel}><Text style={styles.formTitle}>{isEnglish ? 'Confirm sale' : 'Confirmar venta'}</Text><Text style={styles.modalText}>{isEnglish ? `Buyer details for ${saleCandidate?.marca} ${saleCandidate?.modelo}` : `Datos del comprador de ${saleCandidate?.marca} ${saleCandidate?.modelo}`}</Text><TextInput style={styles.input} value={buyer.nombre} onChangeText={(nombre) => setBuyer((current) => ({ ...current, nombre }))} placeholder={isEnglish ? 'First name' : 'Nombre'} /><TextInput style={styles.input} value={buyer.apellido} onChangeText={(apellido) => setBuyer((current) => ({ ...current, apellido }))} placeholder={isEnglish ? 'Last name' : 'Apellido'} /><TextInput style={styles.input} value={buyer.cedula} onChangeText={(cedula) => setBuyer((current) => ({ ...current, cedula }))} placeholder={isEnglish ? 'ID number' : 'Cedula'} /><TextInput style={[styles.input, styles.saleAddress]} value={buyer.direccion} onChangeText={(direccion) => setBuyer((current) => ({ ...current, direccion }))} placeholder={isEnglish ? 'Address' : 'Direccion'} /><View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setSaleCandidate(null)} disabled={selling}><Text style={styles.secondaryText}>{isEnglish ? 'No, cancel' : 'No, cancelar'}</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={confirmSale} disabled={selling}>{selling ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isEnglish ? 'Yes, sell' : 'Sí, vender'}</Text>}</TouchableOpacity></View></View></View></Modal>
    <Modal visible={editingClient !== null} transparent animationType="fade" onRequestClose={() => !savingClient && setEditingClient(null)}><View style={styles.modalOverlay}><View style={styles.modalPanel}><Text style={styles.formTitle}>{isEnglish ? 'Edit customer' : 'Editar cliente'}</Text><TextInput style={styles.input} value={editingClient?.nombre || ''} onChangeText={(nombre) => setEditingClient((current) => current ? { ...current, nombre } : current)} placeholder={isEnglish ? 'First name' : 'Nombre'} /><TextInput style={styles.input} value={editingClient?.apellido || ''} onChangeText={(apellido) => setEditingClient((current) => current ? { ...current, apellido } : current)} placeholder={isEnglish ? 'Last name' : 'Apellido'} /><TextInput style={styles.input} value={editingClient?.cedula || ''} onChangeText={(cedula) => setEditingClient((current) => current ? { ...current, cedula } : current)} placeholder={isEnglish ? 'ID number' : 'Cedula'} /><TextInput style={[styles.input, styles.saleAddress]} value={editingClient?.direccion || ''} onChangeText={(direccion) => setEditingClient((current) => current ? { ...current, direccion } : current)} placeholder={isEnglish ? 'Address' : 'Direccion'} /><View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setEditingClient(null)} disabled={savingClient}><Text style={styles.secondaryText}>{isEnglish ? 'Cancel' : 'Cancelar'}</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={saveClient} disabled={savingClient}>{savingClient ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isEnglish ? 'Save changes' : 'Guardar cambios'}</Text>}</TouchableOpacity></View></View></View></Modal>
    <Modal visible={clientToDelete !== null} transparent animationType="fade" onRequestClose={() => !deletingClient && setClientToDelete(null)}><View style={styles.modalOverlay}><View style={styles.modalPanel}><Text style={styles.formTitle}>{isEnglish ? 'Delete customer' : 'Eliminar cliente'}</Text><Text style={styles.modalText}>{isEnglish ? `Do you want to delete ${clientToDelete?.nombre} ${clientToDelete?.apellido}?` : `¿Deseas eliminar a ${clientToDelete?.nombre} ${clientToDelete?.apellido}?`}</Text><Text style={styles.modalHint}>{isEnglish ? 'This only removes the customer record.' : 'Esto solo elimina el registro del cliente.'}</Text><View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setClientToDelete(null)} disabled={deletingClient}><Text style={styles.secondaryText}>{isEnglish ? 'No, cancel' : 'No, cancelar'}</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={confirmDeleteClient} disabled={deletingClient}>{deletingClient ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isEnglish ? 'Yes, delete' : 'Sí, eliminar'}</Text>}</TouchableOpacity></View></View></View></Modal>
    <Modal visible={Boolean(saleError)} transparent animationType="fade" onRequestClose={() => setSaleError('')}><View style={styles.modalOverlay}><View style={styles.modalPanel}><Text style={styles.formTitle}>{isEnglish ? 'Missing information' : 'Faltan datos'}</Text><Text style={styles.modalText}>{saleError}</Text><View style={styles.actions}><TouchableOpacity style={styles.primaryButton} onPress={() => setSaleError('')}><Text style={styles.primaryText}>{isEnglish ? 'Continue' : 'Entendido'}</Text></TouchableOpacity></View></View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  accessWrap: { alignItems: 'center', padding: 32 }, accessPanel: { width: '100%', maxWidth: 440, backgroundColor: '#fff', padding: 24, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }, panel: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 24 }, panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }, headerActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, sectionTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, sectionTab: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, backgroundColor: '#fff' }, sectionTabActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' }, sectionTabText: { color: '#374151', fontWeight: '800' }, sectionTabTextActive: { color: '#fff' }, listSection: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 20 }, title: { color: '#111827', fontSize: 22, fontWeight: '800' }, hint: { color: '#6b7280', marginTop: 4 }, rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }, rememberText: { color: '#374151', fontSize: 14 }, form: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 20, marginBottom: 26 }, formTitle: { color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 16 }, requestTitle: { marginTop: 26 }, soldSectionTitle: { marginTop: 30 }, fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, field: { minWidth: 190, flexGrow: 1, flexBasis: 220, marginBottom: 14 }, wideField: { width: '100%', flexGrow: 0, flexShrink: 0, flexBasis: 'auto', marginBottom: 10 }, label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 6 }, input: { minHeight: 42, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, paddingHorizontal: 10, color: '#111827', backgroundColor: '#fff' }, saleAddress: { marginTop: 10 }, textarea: { height: 92, paddingTop: 10, textAlignVertical: 'top' }, optionRow: { flexDirection: 'row', gap: 8 }, option: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10 }, optionSelected: { borderColor: '#dc2626', backgroundColor: '#fef2f2' }, optionText: { color: '#374151', fontWeight: '700' }, optionTextSelected: { color: '#b91c1c' }, photoSection: { marginBottom: 10 }, photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, thumbnail: { width: 90, height: 68, borderRadius: 4, backgroundColor: '#e5e7eb' }, uploading: { alignSelf: 'flex-start', marginTop: 10 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }, primaryButton: { minWidth: 116, minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#dc2626', borderRadius: 4 }, primaryText: { color: '#fff', fontWeight: '800' }, secondaryButton: { minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 4, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' }, secondaryText: { color: '#374151', fontWeight: '700' }, error: { color: '#b91c1c', marginTop: 10 }, message: { color: '#374151', marginBottom: 12 }, vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, vehicleInfo: { flex: 1 }, vehicleTitle: { color: '#111827', fontWeight: '800' }, vehicleMeta: { color: '#6b7280', marginTop: 2 }, requestRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, requestText: { color: '#4b5563', marginTop: 5 }, clientActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }, invoiceButton: { minHeight: 34, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 4, backgroundColor: '#dc2626' }, invoiceText: { color: '#fff', fontSize: 12, fontWeight: '800' }, soldText: { color: '#b45309', fontSize: 12, fontWeight: '700', marginTop: 4 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }, modalPanel: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 8, padding: 24 }, modalText: { color: '#111827', fontSize: 16, lineHeight: 23 }, modalHint: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginTop: 10 }, editButton: { padding: 9 }, editText: { color: '#b91c1c', fontWeight: '800' }, deleteButton: { padding: 9 }, deleteText: { color: '#991b1b', fontWeight: '800' },
});

const clientStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, backgroundColor: '#fff' },
  invoiceButton: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  editIcon: { color: '#b91c1c', fontSize: 22, lineHeight: 24 },
  deleteIcon: { fontSize: 17, lineHeight: 22 },
  pdfIcon: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
