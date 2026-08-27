import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export interface SearchFilters {
  marca: string;
  modelo: string;
  anioDesde: string;
  anioHasta: string;
}

interface FilterPanelProps {
  onSearch: (filters: SearchFilters) => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export function FilterPanel({ onSearch }: FilterPanelProps) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1999 },
    (_, index) => currentYear - index
  );

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
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Encuentra tu Vehículo</Text>

      <View style={styles.filterRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>MARCA</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={brand}
              onValueChange={handleBrandChange}
              style={styles.picker}
            >
              <Picker.Item label="Todas las marcas" value="" />
              {brands.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MODELO</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={model}
              onValueChange={(value) => setModel(value)}
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item label="Todos los modelos" value="" />
              {models.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>AÑO DESDE</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={yearFrom}
              onValueChange={(value) => setYearFrom(value)}
              style={styles.picker}
            >
              <Picker.Item label="Cualquier año" value="" />
              {years.map((year) => (
                <Picker.Item
                  key={`from-${year}`}
                  label={year.toString()}
                  value={year.toString()}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>AÑO HASTA</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={yearTo}
              onValueChange={(value) => setYearTo(value)}
              style={styles.picker}
            >
              <Picker.Item label="Cualquier año" value="" />
              {years.map((year) => (
                <Picker.Item
                  key={`to-${year}`}
                  label={year.toString()}
                  value={year.toString()}
                />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>BUSCAR VEHÍCULOS</Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  picker: {
    height: 42,
    width: '100%',
    color: '#1f2937',
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
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});