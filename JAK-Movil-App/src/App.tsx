import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { NavBar } from './components/navigation/NavBar';
import { FilterPanel, SearchFilters } from './components/search/FilterPanel';
import { vehicles } from './data/vehicleData';
import { VehicleCard, Vehicle } from './components/catalog/VehicleCard';
import { VehicleDetails } from './components/catalog/VehicleDetails';
import { HeroImage } from './components/images/HeroImage';
import { Footer } from './components/navigation/Footer';
import { ContactPage } from './components/Contact/ContactPage';
import { AboutPage } from './components/about/AboutPage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiVehicle {
  id: number;
  marca: string;
  modelo: string;
  año: number;
  precio: number;
  moneda: string;
  tipo: string;
  transmision: string;
  combustible: string;
  imagen: string | null;
}

function formatPrice(price: number, currency: string) {
  if (!Number(price)) return 'Consultar precio';
  const symbol = currency === 'DOP' ? 'RD$' : 'US$';

  return `${symbol} ${Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function mapApiVehicle(vehicle: ApiVehicle): Vehicle {
  return {
    id: String(vehicle.id),
    title: `${vehicle.marca} ${vehicle.modelo}`,
    price: formatPrice(vehicle.precio, vehicle.moneda),
    year: vehicle.año,
    mileage: vehicle.tipo,
    transmission: vehicle.transmision,
    fuel: vehicle.combustible,
    imageUrl: vehicle.imagen || '',
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    'home' | 'about' | 'contact' | 'results' | 'details'
  >('home');

  const [catalogVehicles, setCatalogVehicles] = useState<Vehicle[]>(vehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  async function handleSearch(filters: SearchFilters) {
    try {
      setCurrentPage('results');
      setIsSearching(true);
      setSearchMessage('');

      const query = new URLSearchParams();

      if (filters.marca) query.append('marca', filters.marca);
      if (filters.modelo) query.append('modelo', filters.modelo);
      if (filters.anioDesde) query.append('anioDesde', filters.anioDesde);
      if (filters.anioHasta) query.append('anioHasta', filters.anioHasta);

      const url = `${API_URL}/api/vehiculos${
        query.toString() ? `?${query}` : ''
      }`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('No fue posible realizar la búsqueda');
      }

      const data: ApiVehicle[] = await response.json();
      const results = data.map(mapApiVehicle);

      setCatalogVehicles(results);
      setSearchMessage(
        results.length === 1
          ? 'Mostrando 1 vehículo encontrado'
          : `Mostrando ${results.length} vehículos encontrados`
      );
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setCatalogVehicles([]);
      setSearchMessage(
        'No fue posible conectar con la base de datos. Verifica que el backend esté activo.'
      );
    } finally {
      setIsSearching(false);
    }
  }

  function openVehicleDetails(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    setCurrentPage('details');
  }

  function returnToCatalog() {
    setSelectedVehicleId(null);
    setCurrentPage('results');
  }

  const activeNavigationPage =
    currentPage === 'details' || currentPage === 'results' ? 'home' : currentPage;

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />

      <NavBar
        activePage={activeNavigationPage}
        onHomePress={() => setCurrentPage('home')}
        onAboutPress={() => setCurrentPage('about')}
        onContactPress={() => setCurrentPage('contact')}
      />

      {currentPage === 'details' && selectedVehicleId ? (
        <VehicleDetails
          vehicleId={selectedVehicleId}
          onBack={returnToCatalog}
        />
      ) : currentPage === 'results' ? (
        <View style={styles.content}>
          <Text style={styles.title}>Resultados de búsqueda</Text>
          {isSearching ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.statusText}>Buscando vehículos...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsText}>{searchMessage}</Text>
              <View style={styles.catalogContainer}>
                {catalogVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} onPress={() => openVehicleDetails(vehicle.id)} />
                ))}
              </View>
              {catalogVehicles.length === 0 && <Text style={styles.emptyText}>No encontramos vehículos con esos filtros.</Text>}
            </>
          )}
        </View>
      ) : currentPage === 'contact' ? (
        <ContactPage />
      ) : currentPage === 'about' ? (
        <AboutPage />
      ) : (
        <>
          <View style={styles.heroSection}>
            <View style={styles.filterWrapper}>
              <FilterPanel onSearch={handleSearch} />
            </View>
          </View>

          <HeroImage />

          <View style={styles.content}>
            <Text style={styles.title}>Catálogo de Vehículos Disponibles</Text>

            {isSearching ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.statusText}>Buscando vehículos...</Text>
              </View>
            ) : (
              <>
                {!!searchMessage && (
                  <Text style={styles.resultsText}>{searchMessage}</Text>
                )}

                <View style={styles.catalogContainer}>
                  {catalogVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onPress={() => openVehicleDetails(vehicle.id)}
                    />
                  ))}
                </View>

                {catalogVehicles.length === 0 && (
                  <Text style={styles.emptyText}>
                    No encontramos vehículos con esos filtros.
                  </Text>
                )}
              </>
            )}
          </View>
        </>
      )}

      <Footer
        onHomePress={() => setCurrentPage('home')}
        onContactPress={() => setCurrentPage('contact')}
        onCatalogPress={() => setCurrentPage('home')}
        onAboutPress={() => setCurrentPage('about')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  filterWrapper: {
    width: '90%',
    maxWidth: 1100,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  resultsText: {
    width: '100%',
    maxWidth: 1200,
    color: '#4b5563',
    fontSize: 15,
    marginBottom: 18,
  },
  catalogContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1200,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statusText: {
    color: '#4b5563',
    marginTop: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    paddingVertical: 32,
  },
});
