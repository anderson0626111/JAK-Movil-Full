import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../../config/api';

export interface SearchFilters { marca: string; modelo: string; anioDesde: string; anioHasta: string; precioDesde: string; precioHasta: string; moneda: string; }
interface FilterPanelProps { onSearch: (filters: SearchFilters) => void; language?: 'ES' | 'EN'; }

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear + 2 - 1900 }, (_, index) => currentYear + 1 - index);

export function FilterPanel({ onSearch, language = 'ES' }: FilterPanelProps) {
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
  const isEnglish = language === 'EN';
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [currency, setCurrency] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pricePlaceholder = currency === 'USD' ? 'US$' : currency === 'DOP' ? 'RD$' : 'US$ / RD$';

  async function loadFilters(selectedBrand = '') {
    try {
      setLoading(true);
      const url = selectedBrand ? `${API_URL}/api/vehiculos/filtros?marca=${encodeURIComponent(selectedBrand)}` : `${API_URL}/api/vehiculos/filtros`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudieron cargar los filtros');
      const data = await response.json();
      setBrands(data.marcas || []); setModels(data.modelos || []);
    } catch (error) { console.error('Error cargando filtros:', error); setBrands([]); setModels([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadFilters(); }, []);
  function changeBrand(value: string) { setBrand(value); setModel(''); loadFilters(value); }
  function search() { onSearch({ marca: brand, modelo: model, anioDesde: yearFrom, anioHasta: yearTo, precioDesde: priceFrom, precioHasta: priceTo, moneda: currency }); }

  const pickerGroup = (label: string, value: string, onChange: (value: string) => void, options: { label: string; value: string }[], disabled = false) => <View style={[styles.inputGroup, isMobileWeb && styles.inputGroupMobile]}><Text style={styles.label}>{label}</Text><View style={styles.pickerContainer}><Picker selectedValue={value} onValueChange={onChange} style={styles.picker} enabled={!disabled}>{options.map((option) => <Picker.Item key={option.value || 'all'} label={option.label} value={option.value} />)}</Picker></View></View>;
  const yearOptions = [{ label: isEnglish ? 'Any year' : 'Cualquier a\u00f1o', value: '' }, ...years.map((year) => ({ label: String(year), value: String(year) }))];

  return <View style={[styles.container, isMobileWeb && styles.containerMobile]}>
    <Text style={[styles.headerTitle, isMobileWeb && styles.headerTitleMobile]}>{isEnglish ? 'Find your vehicle' : 'Encuentra tu Veh\u00edculo'}</Text>
    <View style={styles.filterRow}>
      {pickerGroup(isEnglish ? 'BRAND' : 'MARCA', brand, changeBrand, [{ label: isEnglish ? 'All brands' : 'Todas las marcas', value: '' }, ...brands.map((item) => ({ label: item, value: item }))])}
      {pickerGroup(isEnglish ? 'MODEL' : 'MODELO', model, setModel, [{ label: isEnglish ? 'All models' : 'Todos los modelos', value: '' }, ...models.map((item) => ({ label: item, value: item }))], loading)}
      {pickerGroup(isEnglish ? 'YEAR FROM' : 'A\u00d1O DESDE', yearFrom, setYearFrom, yearOptions)}
      {pickerGroup(isEnglish ? 'YEAR TO' : 'A\u00d1O HASTA', yearTo, setYearTo, yearOptions)}
    </View>
    <View style={styles.filterRow}>
      {pickerGroup(isEnglish ? 'CURRENCY' : 'MONEDA', currency, setCurrency, [{ label: isEnglish ? 'US dollars or Dominican pesos' : 'D\u00f3lares o pesos', value: '' }, { label: isEnglish ? 'US dollars (US$)' : 'D\u00f3lares (US$)', value: 'USD' }, { label: isEnglish ? 'Dominican pesos (RD$)' : 'Pesos dominicanos (RD$)', value: 'DOP' }])}
      <View style={[styles.inputGroup, isMobileWeb && styles.inputGroupMobile]}><Text style={styles.label}>{isEnglish ? 'PRICE FROM' : 'PRECIO DESDE'}</Text><View style={styles.pickerContainer}><TextInput value={priceFrom} onChangeText={setPriceFrom} placeholder={pricePlaceholder} keyboardType="default" style={styles.textInput} /></View></View>
      <View style={[styles.inputGroup, isMobileWeb && styles.inputGroupMobile]}><Text style={styles.label}>{isEnglish ? 'PRICE TO' : 'PRECIO HASTA'}</Text><View style={styles.pickerContainer}><TextInput value={priceTo} onChangeText={setPriceTo} placeholder={pricePlaceholder} keyboardType="default" style={styles.textInput} /></View></View>
      <TouchableOpacity style={[styles.button, isMobileWeb && styles.buttonMobile, loading && styles.buttonDisabled]} onPress={search} disabled={loading}>{loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{isEnglish ? 'SEARCH VEHICLES' : 'BUSCAR VEH\u00cdCULOS'}</Text>}</TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)', elevation: 3, width: '100%' }, containerMobile: { padding: 14 }, headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 }, headerTitleMobile: { fontSize: 20 }, filterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }, inputGroup: { width: '24%', flexGrow: 0, flexShrink: 0, minWidth: 0 }, inputGroupMobile: { flexBasis: '100%', minWidth: 0, width: '100%', marginBottom: 12 }, label: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 }, pickerContainer: { borderWidth: 1, borderColor: '#6b7280', borderRadius: 6, backgroundColor: '#ffffff', overflow: 'hidden' }, picker: { height: 42, width: '100%', color: '#1f2937' }, textInput: { height: 42, width: '100%', paddingHorizontal: 10, color: '#1f2937', backgroundColor: '#ffffff' }, button: { width: '24%', flexGrow: 0, flexShrink: 0, minWidth: 0, backgroundColor: '#dc2626', paddingHorizontal: 12, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, buttonMobile: { width: '100%', minWidth: 0, marginTop: 2 }, buttonDisabled: { opacity: 0.65 }, buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
