import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

const brands = [
  'Audi',
  'BMW',
  'Chevrolet',
  'Dodge',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Jeep',
  'Kia',
  'Mazda',
  'Mercedes-Benz',
  'Nissan',
  'Peugeot',
  'Renault',
  'Suzuki',
  'Toyota',
  'Volkswagen',
];

export function SearchBar() {
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return [];
    }

    return brands.filter((brand) => brand.toLowerCase().startsWith(term));
  }, [query]);

  return (
    <View style={styles.searchWrapper}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar vehículos, servicios o financiamiento"
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>{item}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    color: '#0f172a',
    fontSize: 14,
  },
  suggestionsBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  suggestionText: {
    color: '#0f172a',
    fontSize: 14,
  },
});
