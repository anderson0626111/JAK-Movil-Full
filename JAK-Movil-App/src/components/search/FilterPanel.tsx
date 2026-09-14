import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../../config/api';

export interface SearchFilters { marca: string; modelo: string; anioDesde: string; anioHasta: string; precioDesde: string; precioHasta: string; moneda: string; orden: string; }
interface FilterPanelProps { onSearch: (filters: SearchFilters) => void; language?: 'ES' | 'EN'; condition?: 'Nuevo' | 'Usado'; initialFilters?: Partial<SearchFilters>; }

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear + 2 - 1900 }, (_, index) => currentYear + 1 - index);
const DOP_PRICE_STEP = 25_000;
const DOP_MAX_PRICE = 5_000_000;
const DOP_PER_USD = 60;
const dopPrices = Array.from({ length: DOP_MAX_PRICE / DOP_PRICE_STEP + 1 }, (_, index) => index * DOP_PRICE_STEP);

export function FilterPanel({ onSearch, language = 'ES', condition, initialFilters = {} }: FilterPanelProps) {
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
  const isEnglish = language === 'EN';
  const [brand, setBrand] = useState(initialFilters.marca || '');
  const [model, setModel] = useState(initialFilters.modelo || '');
  const [yearFrom, setYearFrom] = useState(initialFilters.anioDesde || '');
  const [yearTo, setYearTo] = useState(initialFilters.anioHasta || '');
  const [priceFrom, setPriceFrom] = useState(initialFilters.precioDesde || '');
  const [priceTo, setPriceTo] = useState(initialFilters.precioHasta || '');
  const [currency, setCurrency] = useState(initialFilters.moneda || '');
  const [order, setOrder] = useState(initialFilters.orden || 'recientes');
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const isSectionFilter = Boolean(condition);

  async function loadFilters(selectedBrand = '') {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedBrand) query.append('marca', selectedBrand);
      if (condition) query.append('condicion', condition);
      const url = `${API_URL}/api/vehiculos/filtros${query.toString() ? `?${query}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudieron cargar los filtros');
      const data = await response.json();
      setBrands(data.marcas || []); setModels(data.modelos || []);
    } catch (error) { console.error('Error cargando filtros:', error); setBrands([]); setModels([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    setBrand(initialFilters.marca || '');
    setModel(initialFilters.modelo || '');
    setYearFrom(initialFilters.anioDesde || '');
    setYearTo(initialFilters.anioHasta || '');
    setPriceFrom(initialFilters.precioDesde || '');
    setPriceTo(initialFilters.precioHasta || '');
    setCurrency(initialFilters.moneda || '');
    setOrder(initialFilters.orden || 'recientes');
    loadFilters(initialFilters.marca || '');
  }, [condition, initialFilters.marca, initialFilters.modelo, initialFilters.anioDesde, initialFilters.anioHasta, initialFilters.precioDesde, initialFilters.precioHasta, initialFilters.moneda, initialFilters.orden]);
  function changeBrand(value: string) { setBrand(value); setModel(''); loadFilters(value); }
  function changeCurrency(value: string) { setCurrency(value); setPriceFrom(''); setPriceTo(''); }
  function search() {
    if (yearFrom && yearTo && Number(yearFrom) > Number(yearTo)) {
      setValidationError(isEnglish ? 'The starting year cannot exceed the ending year.' : 'El año desde no puede ser mayor que el año hasta.');
      return;
    }
    if (priceFrom && priceTo && Number(priceFrom) > Number(priceTo)) {
      setValidationError(isEnglish ? 'The starting price cannot exceed the ending price.' : 'El precio desde no puede ser mayor que el precio hasta.');
      return;
    }

    setValidationError('');
    const selectedCurrency = !isSectionFilter && (priceFrom || priceTo) ? currency || 'DOP' : currency;
    onSearch({
      marca: brand,
      modelo: model,
      anioDesde: yearFrom,
      anioHasta: yearTo,
      precioDesde: isSectionFilter ? '' : priceFrom,
      precioHasta: isSectionFilter ? '' : priceTo,
      moneda: isSectionFilter ? '' : selectedCurrency,
      orden: isSectionFilter ? order : 'recientes',
    });
  }

  const pickerGroup = (label: string, value: string, onChange: (value: string) => void, options: { label: string; value: string }[], disabled = false) => <View style={[styles.inputGroup, isSectionFilter && styles.sectionInputGroup, isMobileWeb && styles.inputGroupMobile]}><Text style={styles.label}>{label}</Text><View style={styles.pickerContainer}><Picker selectedValue={value} onValueChange={onChange} style={styles.picker} enabled={!disabled}>{options.map((option) => <Picker.Item key={option.value || 'all'} label={option.label} value={option.value} />)}</Picker></View></View>;
  const yearOptions = [{ label: isEnglish ? 'Any year' : 'Cualquier a\u00f1o', value: '' }, ...years.map((year) => ({ label: String(year), value: String(year) }))];
  const priceValues = currency === 'USD'
    ? dopPrices.map((price) => Math.round(price / DOP_PER_USD))
    : dopPrices;
  const priceOptions = [
    { label: isEnglish ? 'Any price' : 'Cualquier precio', value: '' },
    ...priceValues.map((price) => ({
      label: `${currency === 'USD' ? 'US$' : 'RD$'} ${price.toLocaleString('en-US')}`,
      value: String(price),
    })),
  ];
  const orderOptions = [
    { label: isEnglish ? 'Recently added' : 'Agregados recientemente', value: 'recientes' },
    { label: isEnglish ? 'Price: low to high' : 'Precio: menor a mayor', value: 'precio_asc' },
    { label: isEnglish ? 'Price: high to low' : 'Precio: mayor a menor', value: 'precio_desc' },
    { label: isEnglish ? 'Year: newest first' : 'A\u00f1o: m\u00e1s reciente', value: 'anio_desc' },
    { label: isEnglish ? 'Year: oldest first' : 'A\u00f1o: m\u00e1s antiguo', value: 'anio_asc' },
  ];

  return <View style={[styles.container, isSectionFilter && styles.sectionContainer, isMobileWeb && styles.containerMobile]}>
    <Text style={[styles.headerTitle, isSectionFilter && styles.sectionHeaderTitle, isMobileWeb && styles.headerTitleMobile]}>{isEnglish ? 'Find your vehicle' : 'Encuentra tu Veh\u00edculo'}</Text>
    {isSectionFilter ? <>
      <View style={[styles.filterRow, styles.sectionFilterRow]}>
        {pickerGroup(isEnglish ? 'BRAND' : 'MARCA', brand, changeBrand, [{ label: isEnglish ? 'All brands' : 'Todas las marcas', value: '' }, ...brands.map((item) => ({ label: item, value: item }))])}
        {pickerGroup(isEnglish ? 'MODEL' : 'MODELO', model, setModel, [{ label: isEnglish ? 'All models' : 'Todos los modelos', value: '' }, ...models.map((item) => ({ label: item, value: item }))], loading)}
        {pickerGroup(isEnglish ? 'YEAR FROM' : 'A\u00d1O DESDE', yearFrom, setYearFrom, yearOptions)}
        {pickerGroup(isEnglish ? 'YEAR TO' : 'A\u00d1O HASTA', yearTo, setYearTo, yearOptions)}
        {pickerGroup(isEnglish ? 'DISPLAY ORDER' : 'ORDEN DE RESULTADOS', order, setOrder, orderOptions)}
        <TouchableOpacity style={[styles.button, styles.sectionButton, isMobileWeb && styles.buttonMobile, loading && styles.buttonDisabled]} onPress={search} disabled={loading}>{loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{isEnglish ? 'SEARCH VEHICLES' : 'BUSCAR VEH\u00cdCULOS'}</Text>}</TouchableOpacity>
      </View>
    </> : <>
      <View style={styles.filterRow}>
        {pickerGroup(isEnglish ? 'BRAND' : 'MARCA', brand, changeBrand, [{ label: isEnglish ? 'All brands' : 'Todas las marcas', value: '' }, ...brands.map((item) => ({ label: item, value: item }))])}
        {pickerGroup(isEnglish ? 'MODEL' : 'MODELO', model, setModel, [{ label: isEnglish ? 'All models' : 'Todos los modelos', value: '' }, ...models.map((item) => ({ label: item, value: item }))], loading)}
        {pickerGroup(isEnglish ? 'YEAR FROM' : 'A\u00d1O DESDE', yearFrom, setYearFrom, yearOptions)}
        {pickerGroup(isEnglish ? 'YEAR TO' : 'A\u00d1O HASTA', yearTo, setYearTo, yearOptions)}
      </View>
      <View style={styles.filterRow}>
        {pickerGroup(isEnglish ? 'CURRENCY' : 'MONEDA', currency, changeCurrency, [{ label: isEnglish ? 'All currencies (prices in DOP)' : 'Todas las monedas (precios en RD$)', value: '' }, { label: isEnglish ? 'US dollars (US$)' : 'D\u00f3lares (US$)', value: 'USD' }, { label: isEnglish ? 'Dominican pesos (RD$)' : 'Pesos dominicanos (RD$)', value: 'DOP' }])}
        {pickerGroup(isEnglish ? 'PRICE FROM' : 'PRECIO DESDE', priceFrom, setPriceFrom, priceOptions)}
        {pickerGroup(isEnglish ? 'PRICE TO' : 'PRECIO HASTA', priceTo, setPriceTo, priceOptions)}
        <TouchableOpacity style={[styles.button, isMobileWeb && styles.buttonMobile, loading && styles.buttonDisabled]} onPress={search} disabled={loading}>{loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{isEnglish ? 'SEARCH VEHICLES' : 'BUSCAR VEH\u00cdCULOS'}</Text>}</TouchableOpacity>
      </View>
    </>}
    {!!validationError && <Text style={styles.validationError}>{validationError}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)', elevation: 3, width: '100%' }, sectionContainer: { width: 1240, maxWidth: '100%', alignSelf: 'center', padding: 16 }, containerMobile: { padding: 14 }, headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 }, sectionHeaderTitle: { fontSize: 20, marginBottom: 12 }, headerTitleMobile: { fontSize: 20 }, filterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }, sectionFilterRow: { justifyContent: 'center', columnGap: 12, rowGap: 12, marginBottom: 0 }, inputGroup: { width: '24%', flexGrow: 0, flexShrink: 0, minWidth: 0 }, sectionInputGroup: { width: 'auto', minWidth: 145, flexBasis: 145, flexGrow: 1 }, inputGroupMobile: { flexBasis: '100%', minWidth: 0, width: '100%', marginBottom: 12 }, label: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 }, pickerContainer: { borderWidth: 1, borderColor: '#6b7280', borderRadius: 6, backgroundColor: '#ffffff', overflow: 'hidden' }, picker: { height: 42, width: '100%', color: '#1f2937' }, button: { width: '24%', flexGrow: 0, flexShrink: 0, minWidth: 0, backgroundColor: '#dc2626', paddingHorizontal: 12, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, sectionButton: { width: 190 }, buttonMobile: { width: '100%', minWidth: 0, marginTop: 2 }, buttonDisabled: { opacity: 0.65 }, buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }, validationError: { color: '#b91c1c', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
