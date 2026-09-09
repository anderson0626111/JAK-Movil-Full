import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
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
import { AdminLogin, AdminPanel, AdminUser } from './components/admin/AdminAccess';

const ADMIN_SESSION_KEY = 'jak-admin-session';

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
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
  const pageScrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<
    'home' | 'about' | 'contact' | 'results' | 'details' | 'new' | 'used' | 'login' | 'admin'
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
  const [language, setLanguage] = useState<'ES' | 'EN'>('ES');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const isEnglish = language === 'EN';

  function scrollToTop() {
    requestAnimationFrame(() => {
      pageScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }

  function navigateTo(
    page: 'home' | 'about' | 'contact' | 'results' | 'details' | 'new' | 'used' | 'login' | 'admin'
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
      const response = await fetch(`${API_URL}/api/vehiculos?orden=recientes`);

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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const guardada = window.localStorage.getItem(ADMIN_SESSION_KEY);
      if (!guardada) return;
      const sesion = JSON.parse(guardada) as { token?: string };
      if (!sesion.token) throw new Error('Sesion incompleta');

      fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${sesion.token}` } })
        .then(async (response) => {
          if (!response.ok) throw new Error('Sesion vencida');
          const data = await response.json();
          setAdminToken(sesion.token as string);
          setAdminUser(data.usuario);
        })
        .catch(() => window.localStorage.removeItem(ADMIN_SESSION_KEY));
    } catch {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
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
      if (filters.precioDesde) query.append('precioDesde', filters.precioDesde);
      if (filters.precioHasta) query.append('precioHasta', filters.precioHasta);
      if (filters.moneda) query.append('moneda', filters.moneda);

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

  function completeAdminLogin(token: string, user: AdminUser, remember: boolean) {
    setAdminToken(token);
    setAdminUser(user);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (remember) window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token }));
      else window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    navigateTo('admin');
  }

  function logoutAdmin() {
    setAdminToken(null);
    setAdminUser(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    navigateTo('home');
    loadAllVehicles();
  }

  return (
    <ScrollView
      ref={pageScrollRef}
      style={styles.container}
    >
      <StatusBar style="light" />

      <NavBar
        language={language}
        onLanguageChange={setLanguage}
        activePage={activeNavigationPage}
        onHomePress={() => {
          navigateTo('home');
          loadAllVehicles();
        }}
        onNewVehiclesPress={loadNewVehicles}
        onUsedVehiclesPress={loadUsedVehicles}
        onAboutPress={() => navigateTo('about')}
        onContactPress={() => navigateTo('contact')}
        onAccessPress={() => navigateTo('login')}
        onAdminPress={() => adminUser && navigateTo('admin')}
        isAdmin={adminUser?.rol === 'admin'}
      />

      {currentPage === 'admin' && adminToken && adminUser ? (
        <AdminPanel
          token={adminToken}
          user={adminUser}
          onLogout={logoutAdmin}
          onBack={() => {
            navigateTo('home');
            loadAllVehicles();
          }}
        />
      ) : currentPage === 'login' ? (
        <AdminLogin onAuthenticated={completeAdminLogin} onCancel={() => navigateTo('home')} />
      ) : currentPage === 'details' && selectedVehicleId ? (
        <VehicleDetails
          vehicleId={selectedVehicleId}
          onBack={returnToCatalog}
        />
      ) : currentPage === 'results' || currentPage === 'new' || currentPage === 'used' ? (
        <View style={[styles.content, isMobileWeb && styles.contentMobile]}>
          <View style={styles.filterWrapper}>
            <FilterPanel onSearch={handleSearch} language={language} />
          </View>
          <ScrollReveal style={styles.revealSection}>
            <Text style={styles.title}>{currentPage === 'new' ? (isEnglish ? 'New Vehicles' : 'Vehículos Nuevos') : currentPage === 'used' ? (isEnglish ? 'Used Vehicles' : 'Vehículos Usados') : (isEnglish ? 'Search results' : 'Resultados de búsqueda')}</Text>
            {!!searchMessage && <Text style={styles.resultsText}>{searchMessage}</Text>}
          </ScrollReveal>
          {isSearching ? (
            <ScrollReveal>
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.statusText}>{isEnglish ? 'Searching vehicles...' : 'Buscando vehículos...'}</Text>
              </View>
            </ScrollReveal>
          ) : (
            <>
              <View style={styles.catalogContainer}>
                {catalogVehicles.map((vehicle, index) => (
                  <ScrollReveal
                    key={vehicle.id}
                    delay={(index % 3) * 70}
                    style={isMobileWeb ? styles.catalogItemMobile : undefined}
                  >
                    <VehicleCard vehicle={vehicle} onPress={() => openVehicleDetails(vehicle.id)} />
                  </ScrollReveal>
                ))}
              </View>
              {catalogVehicles.length === 0 && <Text style={styles.emptyText}>{isEnglish ? 'No vehicles match these filters.' : 'No encontramos vehículos con esos filtros.'}</Text>}
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
              <View style={[styles.filterWrapper, isMobileWeb && styles.filterWrapperMobile]}>
                <FilterPanel onSearch={handleSearch} language={language} />
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal style={styles.revealSection} delay={80}>
            <HeroImage onVehiclePress={openVehicleDetails} />
          </ScrollReveal>

          <ScrollReveal style={styles.revealSection} delay={60}>
            <View style={[styles.content, isMobileWeb && styles.contentMobile]}>
              <Text style={styles.title}>{isEnglish ? 'Recently added vehicles' : 'Vehículos recién agregados'}</Text>

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
                      <ScrollReveal
                        key={vehicle.id}
                        delay={(index % 3) * 70}
                        style={isMobileWeb ? styles.catalogItemMobile : undefined}
                      >
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
          language={language}
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
  filterWrapperMobile: {
    width: '94%',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  contentMobile: {
    paddingHorizontal: 12,
    paddingVertical: 18,
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
  catalogItemMobile: {
    width: '100%',
    alignItems: 'center',
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
