import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { NavBar } from './components/navigation/NavBar';
import { FilterPanel, SearchFilters } from './components/search/FilterPanel';
import { vehicles } from './data/vehicleData';
import { VehicleCard, Vehicle } from './components/catalog/VehicleCard';
import { VehicleDetails } from './components/catalog/VehicleDetails';
import { HeroImage } from './components/images/HeroImage';
import { Footer } from './components/navigation/Footer';
import { ContactPage } from './components/Contact/ContactPage';
import { AboutPage } from './components/about/AboutPage';
import { ScrollReveal } from './components/animation/ScrollReveal';
import { API_URL } from './config/api';

interface ApiVehicle {
  id: number;
  marca: string;
  modelo: string;
  anio?: number;
  año?: number;
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
  const year = vehicle.anio ?? vehicle.año ?? 0;

  return {
    id: String(vehicle.id),
    title: `${vehicle.marca} ${vehicle.modelo}`,
    price: formatPrice(vehicle.precio, vehicle.moneda),
    year,
    mileage: vehicle.tipo,
    transmission: vehicle.transmision,
    fuel: vehicle.combustible,
    imageUrl: vehicle.imagen || '',
  };
}

export default function App() {
  const pageScrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<
    'home' | 'about' | 'contact' | 'results' | 'details' | 'new' | 'used'
  >('home');

  const [catalogVehicles, setCatalogVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [detailsReturnPage, setDetailsReturnPage] = useState<
    'home' | 'results' | 'new' | 'used'
  >('home');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  function scrollToTop() {
    requestAnimationFrame(() => {
      pageScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }

  function navigateTo(
    page: 'home' | 'about' | 'contact' | 'results' | 'details' | 'new' | 'used'
  ) {
    setCurrentPage(page);
    scrollToTop();
  }

  useEffect(() => {
    scrollToTop();
  }, [currentPage, selectedVehicleId]);

  async function loadAllVehicles() {
    try {
      setIsSearching(true);
      setSearchMessage('');
      const response = await fetch(`${API_URL}/api/vehiculos`);

      if (!response.ok) {
        throw new Error('No fue posible cargar el catálogo');
      }

      const data: ApiVehicle[] = await response.json();
      const results = data.map(mapApiVehicle).slice(0, 9);
      setCatalogVehicles(results);
      setSearchMessage('');
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setCatalogVehicles([]);
      setSearchMessage(
        'No fue posible cargar el catálogo. Verifica que MySQL de XAMPP esté activo.'
      );
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    loadAllVehicles();
  }, []);

  async function handleSearch(filters: SearchFilters) {
    try {
      navigateTo('results');
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
    if (
      currentPage === 'results' ||
      currentPage === 'new' ||
      currentPage === 'used'
    ) {
      setDetailsReturnPage(currentPage);
    } else {
      setDetailsReturnPage('home');
    }

    setSelectedVehicleId(vehicleId);
    navigateTo('details');
  }

  function returnToCatalog() {
    setSelectedVehicleId(null);
    navigateTo(detailsReturnPage);
  }

  async function loadNewVehicles() {
    try {
      navigateTo('new');
      setIsSearching(true);
      setSearchMessage('');
      const response = await fetch(`${API_URL}/api/vehiculos?condicion=Nuevo`);

      if (!response.ok) {
        throw new Error('No fue posible cargar los vehículos nuevos');
      }

      const data: ApiVehicle[] = await response.json();
      const results = data.map(mapApiVehicle);
      setCatalogVehicles(results);
      setSearchMessage(
        results.length === 1
          ? 'Mostrando 1 vehículo nuevo'
          : `Mostrando ${results.length} vehículos nuevos`
      );
    } catch (error) {
      console.error('Error cargando vehículos nuevos:', error);
      setCatalogVehicles([]);
      setSearchMessage('No fue posible cargar los vehículos nuevos.');
    } finally {
      setIsSearching(false);
    }
  }

  async function loadUsedVehicles() {
    try {
      navigateTo('used');
      setIsSearching(true);
      setSearchMessage('');
      const response = await fetch(`${API_URL}/api/vehiculos?condicion=Usado`);

      if (!response.ok) {
        throw new Error('No fue posible cargar los vehículos usados');
      }

      const data: ApiVehicle[] = await response.json();
      const results = data.map(mapApiVehicle);
      setCatalogVehicles(results);
      setSearchMessage(
        results.length === 1
          ? 'Mostrando 1 vehículo usado'
          : `Mostrando ${results.length} vehículos usados`
      );
    } catch (error) {
      console.error('Error cargando vehículos usados:', error);
      setCatalogVehicles([]);
      setSearchMessage('No fue posible cargar los vehículos usados.');
    } finally {
      setIsSearching(false);
    }
  }

  const activeNavigationPage =
    currentPage === 'details' || currentPage === 'results'
      ? 'home'
      : currentPage;

  return (
    <ScrollView
      ref={pageScrollRef}
      style={styles.container}
    >
      <StatusBar style="light" />

      <NavBar
        activePage={activeNavigationPage}
        onHomePress={() => {
          navigateTo('home');
          loadAllVehicles();
        }}
        onNewVehiclesPress={loadNewVehicles}
        onUsedVehiclesPress={loadUsedVehicles}
        onAboutPress={() => navigateTo('about')}
        onContactPress={() => navigateTo('contact')}
      />

      {currentPage === 'details' && selectedVehicleId ? (
        <VehicleDetails
          vehicleId={selectedVehicleId}
          onBack={returnToCatalog}
        />
      ) : currentPage === 'results' || currentPage === 'new' || currentPage === 'used' ? (
        <View style={styles.content}>
          <ScrollReveal style={styles.revealSection}>
            <Text style={styles.title}>{currentPage === 'new' ? 'Vehículos Nuevos' : currentPage === 'used' ? 'Vehículos Usados' : 'Resultados de búsqueda'}</Text>
            {!!searchMessage && <Text style={styles.resultsText}>{searchMessage}</Text>}
          </ScrollReveal>
          {isSearching ? (
            <ScrollReveal>
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.statusText}>Buscando vehículos...</Text>
              </View>
            </ScrollReveal>
          ) : (
            <>
              <View style={styles.catalogContainer}>
                {catalogVehicles.map((vehicle, index) => (
                  <ScrollReveal key={vehicle.id} delay={(index % 3) * 70}>
                    <VehicleCard vehicle={vehicle} onPress={() => openVehicleDetails(vehicle.id)} />
                  </ScrollReveal>
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
          <ScrollReveal style={styles.revealSection}>
            <View style={styles.heroSection}>
              <View style={styles.filterWrapper}>
                <FilterPanel onSearch={handleSearch} />
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal style={styles.revealSection} delay={80}>
            <HeroImage onVehiclePress={openVehicleDetails} />
          </ScrollReveal>

          <ScrollReveal style={styles.revealSection} delay={60}>
            <View style={styles.content}>
              <Text style={styles.title}>Vehículos recién agregados</Text>

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
                    {catalogVehicles.map((vehicle, index) => (
                      <ScrollReveal key={vehicle.id} delay={(index % 3) * 70}>
                        <VehicleCard
                          vehicle={vehicle}
                          onPress={() => openVehicleDetails(vehicle.id)}
                        />
                      </ScrollReveal>
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
          </ScrollReveal>
        </>
      )}

      <ScrollReveal style={styles.revealSection}>
        <Footer
          onHomePress={() => {
            navigateTo('home');
            loadAllVehicles();
          }}
          onNewVehiclesPress={loadNewVehicles}
          onUsedVehiclesPress={loadUsedVehicles}
          onContactPress={() => navigateTo('contact')}
          onCatalogPress={() => {
            navigateTo('home');
            loadAllVehicles();
          }}
          onAboutPress={() => navigateTo('about')}
        />
      </ScrollReveal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  revealSection: {
    width: '100%',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsText: {
    width: '100%',
    maxWidth: 1200,
    color: '#4b5563',
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
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
