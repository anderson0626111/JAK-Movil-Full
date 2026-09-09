import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../../config/api';

export interface SearchFilters {
  marca: string;
  modelo: string;
  anioDesde: string;
  anioHasta: string;
  precioDesde: string;
  precioHasta: string;
  moneda: string;
}

interface FilterPanelProps {
  onSearch: (filters: SearchFilters) => void;
  language?: 'ES' | 'EN';
}

const currentYear = new Date().getFullYear();
const defaultYears = Array.from(
  { length: currentYear + 1 - 1900 + 1 },
  (_, index) => currentYear + 1 - index
);

export function FilterPanel({ onSearch, language = 'ES' }: FilterPanelProps) {
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
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
  const isEnglish = language === 'EN';

  async function loadFilters(selectedBrand = '') {
    try {
      setLoading(true);

      const url = selectedBrand
        ? `${API_URL}/api/vehiculos/filtros?marca=${encodeURIComponent(selectedBrand)}`
        : `${API_URL}/api/vehiculos/filtros`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('No fue posible cargar los filtros');
      }

      const data = await response.json();

      setBrands(data.marcas || []);
      setModels(data.modelos || []);
    } catch (error) {
      console.error('Error cargando filtros:', error);
      setBrands([]);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFilters();
  }, []);

  function handleBrandChange(value: string) {
    setBrand(value);
    setModel('');
    loadFilters(value);
  }

  function handleSearch() {
    onSearch({
      marca: brand,
      modelo: model,
      anioDesde: yearFrom,
      anioHasta: yearTo,
      precioDesde: priceFrom,
      precioHasta: priceTo,
      moneda: currency,
    });
  }

  return (
    <View style={[styles.container, isMobileWeb && styles.containerMobile]}>
      <Text style={[styles.headerTitle, isMobileWeb && styles.headerTitleMobile]}>
        {isEnglish ? 'Find your vehicle' : 'Encuentra tu Vehículo'}
      </Text>

      <View style={styles.filterRow}>
        <View style={[styles.inputGroup, isMobileWeb && styles.inputGroupMobile]}>
            <Text style={styles.label}>{isEnglish ? 'BRAND' : 'MARCA'}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={brand}
              onValueChange={handleBrandChange}
              style={styles.picker}
            >
              <Picker.Item label={isEnglish ? 'All brands' : 'Todas las marcas'} value="" />
              {brands.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={[styles.inputGroup, isMobileWeb && styles.inputGroupMobile]}>
            <Text style={styles.label}>{isEnglish ? 'MODEL' : 'MODELO'}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={model}
              onValueChange={(value) => setModel(value)}
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item label={isEnglish ? 'All models' : 'Todos los modelos'} value="" />
              {models.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={[styles.yearGroup, isMobileWeb && styles.yearGroupMobile]}>
          <View style={styles.yearInputGroup}>
            <Text style={styles.label}>{isEnglish ? 'YEAR FROM' : 'AÑO DESDE'}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={yearFrom}
                onValueChange={(value) => setYearFrom(value)}
                style={styles.picker}
              >
                <Picker.Item label={isEnglish ? 'Any year' : 'Cualquier año'} value="" />
                {defaultYears.map((year) => (
                  <Picker.Item
                    key={`from-${year}`}
                    label={year.toString()}
                    value={year.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.yearInputGroup}>
            <Text style={styles.label}>{isEnglish ? 'YEAR TO' : 'AÑO HASTA'}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={yearTo}
                onValueChange={(value) => setYearTo(value)}
                style={styles.picker}
              >
                <Picker.Item label={isEnglish ? 'Any year' : 'Cualquier año'} value="" />
                {defaultYears.map((year) => (
                  <Picker.Item
                    key={`to-${year}`}
                    label={year.toString()}
                    value={year.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={[styles.yearGroup, isMobileWeb && styles.yearGroupMobile]}>
          <View style={styles.yearInputGroup}>
            <Text style={styles.label}>{isEnglish ? 'PRICE FROM' : 'PRECIO DESDE'}</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                value={priceFrom}
                onChangeText={setPriceFrom}
                placeholder={pricePlaceholder}
                keyboardType="default"
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.yearInputGroup}>
            <Text style={styles.label}>{isEnglish ? 'PRICE TO' : 'PRECIO HASTA'}</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                value={priceTo}
                onChangeText={setPriceTo}
                placeholder={pricePlaceholder}
                keyboardType="default"
                style={styles.textInput}
              />
            </View>
          </View>
        </View>

        <View style={[styles.inputGroup, isMobileWeb && styles.inputGroupMobile]}>
          <Text style={styles.label}>{isEnglish ? 'CURRENCY' : 'MONEDA'}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currency}
              onValueChange={setCurrency}
              style={styles.picker}
            >
              <Picker.Item label={isEnglish ? 'US dollars or Dominican pesos' : 'Dólares o pesos'} value="" />
              <Picker.Item label={isEnglish ? 'US dollars (US$)' : 'Dólares (US$)'} value="USD" />
              <Picker.Item label={isEnglish ? 'Dominican pesos (RD$)' : 'Pesos dominicanos (RD$)'} value="DOP" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            isMobileWeb && styles.buttonMobile,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{isEnglish ? 'SEARCH VEHICLES' : 'BUSCAR VEHÍCULOS'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
    elevation: 3,
    width: '100%',
  },
  containerMobile: {
    padding: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  headerTitleMobile: {
    fontSize: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    minWidth: 160,
  },
  inputGroupMobile: {
    flexBasis: '100%',
    minWidth: 0,
    width: '100%',
  },
  yearGroup: {
    flex: 2,
    minWidth: 320,
    flexDirection: 'row',
    gap: 12,
  },
  yearGroupMobile: {
    flexBasis: '100%',
    minWidth: 0,
    width: '100%',
  },
  yearInputGroup: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  picker: {
    height: 42,
    width: '100%',
    color: '#1f2937',
  },
  textInput: {
    height: 42,
    width: '100%',
    paddingHorizontal: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 180,
  },
  buttonMobile: {
    width: '100%',
    minWidth: 0,
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
