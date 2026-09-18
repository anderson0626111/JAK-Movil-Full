import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
import { ClientPage } from './components/client/ClientPage';

const ADMIN_SESSION_KEY = 'jak-admin-session-v2';
const LEGACY_ADMIN_SESSION_KEY = 'jak-admin-session';
const ADMIN_CONTEXT_KEY = 'jak-admin-context';
const EMPTY_SEARCH_FILTERS: SearchFilters = {
  marca: '',
  modelo: '',
  anioDesde: '',
  anioHasta: '',
  precioDesde: '',
  precioHasta: '',
  moneda: '',
  orden: 'recientes',
};

interface ApiVehicle {
  id: number;
  marca: string;
  modelo: string;
  anio?: number | null;
  año?: number | null;
  precio: number | null;
  moneda: string;
  tipo: string | null;
  transmision: string | null;
  combustible: string | null;
  imagen: string | null;
}

function formatPrice(price: number | null, currency: string) {
  if (!Number(price)) return 'Consultar precio';
  const symbol = currency === 'DOP' ? 'RD$' : 'US$';

  return `${symbol} ${Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function mapApiVehicle(vehicle: ApiVehicle): Vehicle {
  const year = vehicle.anio ?? vehicle.año ?? null;

  return {
    id: String(vehicle.id),
    title: `${vehicle.marca} ${vehicle.modelo}`,
    price: formatPrice(vehicle.precio, vehicle.moneda),
    year,
    mileage: vehicle.tipo || '',
    transmission: vehicle.transmision || '',
    fuel: vehicle.combustible || '',
    imageUrl: vehicle.imagen || '',
  };
}

export default function App() {
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
  const pageScrollRef = useRef<ScrollView>(null);
  const initialWebPath = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/$/, '')
    : '';
  const startedFromAdmin = Platform.OS === 'web'
    && typeof window !== 'undefined'
    && (initialWebPath === '/admin' || new URLSearchParams(window.location.search).get('admin') === '1');
  const hasStoredAdminContext = Platform.OS === 'web'
    && typeof window !== 'undefined'
    && window.sessionStorage.getItem(ADMIN_CONTEXT_KEY) === '1';
  const startedPage = startedFromAdmin
    ? 'login'
    : initialWebPath === '/contacto'
      ? 'contact'
      : initialWebPath === '/nosotros'
        ? 'about'
        : initialWebPath === '/vehiculos-nuevos'
          ? 'new'
          : initialWebPath === '/vehiculos-usados'
            ? 'used'
            : 'home';
  const [currentPage, setCurrentPage] = useState<
    'home' | 'about' | 'contact' | 'client' | 'results' | 'details' | 'new' | 'used' | 'login' | 'admin'
  >(startedPage);

  const [catalogVehicles, setCatalogVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [detailsReturnPage, setDetailsReturnPage] = useState<
    'home' | 'results' | 'new' | 'used'
  >('home');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [savedFilters, setSavedFilters] = useState<
    Record<'results' | 'new' | 'used', SearchFilters>
  >({
    results: { ...EMPTY_SEARCH_FILTERS },
    new: { ...EMPTY_SEARCH_FILTERS },
    used: { ...EMPTY_SEARCH_FILTERS },
  });
  const [language, setLanguage] = useState<'ES' | 'EN'>('ES');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [showAdminNavigation, setShowAdminNavigation] = useState(startedFromAdmin || hasStoredAdminContext);
  const isEnglish = language === 'EN';

  function scrollToTop() {
    requestAnimationFrame(() => {
      pageScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }

  function navigateTo(
    page: 'home' | 'about' | 'contact' | 'client' | 'results' | 'details' | 'new' | 'used' | 'login' | 'admin'
  ) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (page === 'admin' || page === 'login') {
        window.sessionStorage.setItem(ADMIN_CONTEXT_KEY, '1');
        setShowAdminNavigation(true);
      }
      const destination = page === 'admin' || page === 'login'
        ? '/admin'
        : page === 'contact'
          ? '/contacto'
          : page === 'about'
            ? '/nosotros'
            : page === 'new'
              ? '/vehiculos-nuevos'
              : page === 'used'
                ? '/vehiculos-usados'
                : '/';
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== destination) window.history.pushState({}, '', destination);
    }
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
        isEnglish
          ? 'The catalog could not be loaded. Make sure MySQL in XAMPP is running.'
          : 'No fue posible cargar el catálogo. Verifica que MySQL de XAMPP esté activo.'
      );
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (startedPage === 'new') {
      loadNewVehicles();
    } else if (startedPage === 'used') {
      loadUsedVehicles();
    } else {
      loadAllVehicles();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    window.sessionStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);

    const path = window.location.pathname.replace(/\/$/, '');
    const adminRequested = path === '/admin' || new URLSearchParams(window.location.search).get('admin') === '1';

    if (adminRequested) {
      window.sessionStorage.setItem(ADMIN_CONTEXT_KEY, '1');
      setShowAdminNavigation(true);
      if (adminToken && ['admin', 'empleado'].includes(adminUser?.rol || '')) {
        setCurrentPage('admin');
      } else {
        setCurrentPage('login');
      }
      scrollToTop();
    }
  }, [adminToken, adminUser]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleHistoryNavigation = () => {
      const path = window.location.pathname.replace(/\/$/, '');
      const adminRequested = path === '/admin' || new URLSearchParams(window.location.search).get('admin') === '1';

      if (adminRequested) {
        setCurrentPage(adminToken && ['admin', 'empleado'].includes(adminUser?.rol || '') ? 'admin' : 'login');
      } else if (path === '/contacto') {
        setSelectedVehicleId(null);
        setCurrentPage('contact');
      } else if (path === '/nosotros') {
        setSelectedVehicleId(null);
        setCurrentPage('about');
      } else if (path === '/vehiculos-nuevos') {
        setSelectedVehicleId(null);
        loadNewVehicles();
      } else if (path === '/vehiculos-usados') {
        setSelectedVehicleId(null);
        loadUsedVehicles();
      } else {
        setSelectedVehicleId(null);
        setCurrentPage('home');
      }
      scrollToTop();
    };

    window.addEventListener('popstate', handleHistoryNavigation);
    return () => window.removeEventListener('popstate', handleHistoryNavigation);
  }, [adminToken, adminUser]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const path = window.location.pathname.replace(/\/$/, '');
      const adminRequested = path === '/admin' || new URLSearchParams(window.location.search).get('admin') === '1';

      const sesionTemporal = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
      const almacenamiento = sesionTemporal ? window.sessionStorage : window.localStorage;
      const guardada = sesionTemporal || window.localStorage.getItem(ADMIN_SESSION_KEY);
      if (!guardada) return;
      const sesion = JSON.parse(guardada) as { token?: string; user?: AdminUser };
      if (!sesion.token) throw new Error('Sesion incompleta');

      if (sesion.user && ['admin', 'empleado'].includes(sesion.user.rol)) {
        setAdminToken(sesion.token);
        setAdminUser(sesion.user);
        setShowAdminNavigation(true);
        if (adminRequested) setCurrentPage('admin');
      }

      fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${sesion.token}` } })
        .then(async (response) => {
          if (!response.ok) throw new Error('Sesion vencida');
          const data = await response.json();
          setAdminToken(sesion.token as string);
          setAdminUser(data.usuario);
          setShowAdminNavigation(true);
          almacenamiento.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token: sesion.token, user: data.usuario }));
          if (adminRequested) setCurrentPage('admin');
        })
        .catch(() => {
          setAdminToken(null);
          setAdminUser(null);
          setShowAdminNavigation(window.sessionStorage.getItem(ADMIN_CONTEXT_KEY) === '1');
          window.localStorage.removeItem(ADMIN_SESSION_KEY);
          window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
          if (adminRequested) setCurrentPage('login');
        });
    } catch {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, []);

  function getSearchMessage(count: number, page: 'results' | 'new' | 'used') {
    if (isEnglish) {
      if (page === 'new') return count === 1 ? 'Showing 1 new vehicle' : `Showing ${count} new vehicles`;
      if (page === 'used') return count === 1 ? 'Showing 1 used vehicle' : `Showing ${count} used vehicles`;
      return count === 1 ? 'Showing 1 matching vehicle' : `Showing ${count} matching vehicles`;
    }
    if (page === 'new') return count === 1 ? 'Mostrando 1 vehículo nuevo' : `Mostrando ${count} vehículos nuevos`;
    if (page === 'used') return count === 1 ? 'Mostrando 1 vehículo usado' : `Mostrando ${count} vehículos usados`;
    return count === 1 ? 'Mostrando 1 vehículo encontrado' : `Mostrando ${count} vehículos encontrados`;
  }

  async function handleSearch(filters: SearchFilters) {
    try {
      const searchPage = currentPage === 'new' || currentPage === 'used' ? currentPage : 'results';
      setSavedFilters((current) => ({ ...current, [searchPage]: { ...filters } }));
      navigateTo(searchPage);
      setIsSearching(true);
      setSearchMessage('');

      const query = new URLSearchParams();
      const condicion = searchPage === 'new' ? 'Nuevo' : searchPage === 'used' ? 'Usado' : '';

      if (filters.marca) query.append('marca', filters.marca);
      if (filters.modelo) query.append('modelo', filters.modelo);
      if (filters.anioDesde) query.append('anioDesde', filters.anioDesde);
      if (filters.anioHasta) query.append('anioHasta', filters.anioHasta);
      if (filters.precioDesde) query.append('precioDesde', filters.precioDesde);
      if (filters.precioHasta) query.append('precioHasta', filters.precioHasta);
      if (filters.moneda) query.append('moneda', filters.moneda);
      if (filters.orden) query.append('orden', filters.orden);
      if (condicion) query.append('condicion', condicion);

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
      setSearchMessage(getSearchMessage(results.length, searchPage));
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setCatalogVehicles([]);
      setSearchMessage(
        isEnglish
          ? 'The database could not be reached. Make sure the backend is running.'
          : 'No fue posible conectar con la base de datos. Verifica que el backend esté activo.'
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
      setSavedFilters((current) => ({ ...current, new: { ...EMPTY_SEARCH_FILTERS } }));
      navigateTo('new');
      setIsSearching(true);
      setSearchMessage('');
      const response = await fetch(`${API_URL}/api/vehiculos?condicion=Nuevo&orden=recientes`);

      if (!response.ok) {
        throw new Error('No fue posible cargar los vehículos nuevos');
      }

      const data: ApiVehicle[] = await response.json();
      const results = data.map(mapApiVehicle);
      setCatalogVehicles(results);
      setSearchMessage(
        isEnglish
          ? results.length === 1 ? 'Showing 1 new vehicle' : `Showing ${results.length} new vehicles`
          : results.length === 1 ? 'Mostrando 1 vehículo nuevo' : `Mostrando ${results.length} vehículos nuevos`
      );
    } catch (error) {
      console.error('Error cargando vehículos nuevos:', error);
      setCatalogVehicles([]);
      setSearchMessage(isEnglish ? 'The new vehicles could not be loaded.' : 'No fue posible cargar los vehículos nuevos.');
    } finally {
      setIsSearching(false);
    }
  }

  async function loadUsedVehicles() {
    try {
      setSavedFilters((current) => ({ ...current, used: { ...EMPTY_SEARCH_FILTERS } }));
      navigateTo('used');
      setIsSearching(true);
      setSearchMessage('');
      const response = await fetch(`${API_URL}/api/vehiculos?condicion=Usado&orden=recientes`);

      if (!response.ok) {
        throw new Error('No fue posible cargar los vehículos usados');
      }

      const data: ApiVehicle[] = await response.json();
      const results = data.map(mapApiVehicle);
      setCatalogVehicles(results);
      setSearchMessage(
        isEnglish
          ? results.length === 1 ? 'Showing 1 used vehicle' : `Showing ${results.length} used vehicles`
          : results.length === 1 ? 'Mostrando 1 vehículo usado' : `Mostrando ${results.length} vehículos usados`
      );
    } catch (error) {
      console.error('Error cargando vehículos usados:', error);
      setCatalogVehicles([]);
      setSearchMessage(isEnglish ? 'The used vehicles could not be loaded.' : 'No fue posible cargar los vehículos usados.');
    } finally {
      setIsSearching(false);
    }
  }

  const activeNavigationPage =
    currentPage === 'details' || currentPage === 'results'
      ? 'home'
      : currentPage;

  function openHome() {
    setSavedFilters((current) => ({
      ...current,
      results: { ...EMPTY_SEARCH_FILTERS },
    }));
    setSelectedVehicleId(null);
    navigateTo('home');
    loadAllVehicles();
  }

  function completeAdminLogin(token: string, user: AdminUser) {
    setAdminToken(token);
    setAdminUser(user);
    setShowAdminNavigation(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token, user }));
    }
    navigateTo('admin');
  }

  function updateAdminUser(user: AdminUser) {
    setAdminUser(user);
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    [window.sessionStorage, window.localStorage].forEach((storage) => {
      const saved = storage.getItem(ADMIN_SESSION_KEY);
      if (!saved) return;
      try {
        const session = JSON.parse(saved) as { token?: string };
        if (session.token) storage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token: session.token, user }));
      } catch {
        storage.removeItem(ADMIN_SESSION_KEY);
      }
    });
  }

  function logoutAdmin() {
    setAdminToken(null);
    setAdminUser(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    navigateTo('login');
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
        onHomePress={openHome}
        onNewVehiclesPress={loadNewVehicles}
        onUsedVehiclesPress={loadUsedVehicles}
        onAboutPress={() => navigateTo('about')}
        onContactPress={() => navigateTo('contact')}
        onAdminPress={() => navigateTo(adminToken && adminUser ? 'admin' : 'login')}
        isAdmin={showAdminNavigation || Boolean(adminToken && adminUser && ['admin', 'empleado'].includes(adminUser.rol))}
      />

      {currentPage === 'admin' && adminToken && adminUser ? (
        <AdminPanel
          token={adminToken}
          user={adminUser}
          language={language}
          onUserUpdated={updateAdminUser}
          onLogout={logoutAdmin}
          onBack={openHome}
        />
      ) : currentPage === 'login' ? (
        <AdminLogin language={language} onAuthenticated={completeAdminLogin} />
      ) : currentPage === 'client' ? (
        <ClientPage language={language} />
      ) : currentPage === 'details' && selectedVehicleId ? (
        <VehicleDetails
          vehicleId={selectedVehicleId}
          onBack={returnToCatalog}
          language={language}
        />
      ) : currentPage === 'results' || currentPage === 'new' || currentPage === 'used' ? (
        <View style={[styles.content, isMobileWeb && styles.contentMobile]}>
          {currentPage === 'results' && (
            <TouchableOpacity style={styles.backToHomeButton} onPress={openHome}>
              <Text style={styles.backToHomeText}>← {isEnglish ? 'BACK TO HOME' : 'VOLVER AL INICIO'}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.filterWrapper}>
            <FilterPanel
              onSearch={handleSearch}
              language={language}
              condition={currentPage === 'new' ? 'Nuevo' : currentPage === 'used' ? 'Usado' : undefined}
              compact={currentPage === 'results'}
              initialFilters={savedFilters[currentPage]}
            />
          </View>
          <ScrollReveal style={styles.revealSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.title}>{currentPage === 'new' ? (isEnglish ? 'New Vehicles' : 'Vehículos Nuevos') : currentPage === 'used' ? (isEnglish ? 'Used Vehicles' : 'Vehículos Usados') : (isEnglish ? 'Search results' : 'Resultados de búsqueda')}</Text>
              {!!searchMessage && <Text style={styles.resultsText}>{searchMessage}</Text>}
            </View>
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
                    <VehicleCard vehicle={vehicle} onPress={() => openVehicleDetails(vehicle.id)} language={language} />
                  </ScrollReveal>
                ))}
              </View>
              {catalogVehicles.length === 0 && <Text style={styles.emptyText}>{isEnglish ? 'No vehicles match these filters.' : 'No encontramos vehículos con esos filtros.'}</Text>}
            </>
          )}
        </View>
      ) : currentPage === 'contact' ? (
        <ContactPage language={language} />
      ) : currentPage === 'about' ? (
        <AboutPage language={language} />
      ) : (
        <>
          <ScrollReveal style={styles.revealSection}>
            <View style={styles.heroSection}>
              <View style={[styles.filterWrapper, isMobileWeb && styles.filterWrapperMobile]}>
                <FilterPanel onSearch={handleSearch} language={language} initialFilters={savedFilters.results} />
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal style={styles.revealSection} delay={80}>
            <HeroImage onVehiclePress={openVehicleDetails} language={language} />
          </ScrollReveal>

          <ScrollReveal style={styles.revealSection} delay={60}>
            <View style={[styles.content, isMobileWeb && styles.contentMobile]}>
              <Text style={styles.title}>{isEnglish ? 'Recently added vehicles' : 'Vehículos recién agregados'}</Text>

              {isSearching ? (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="large" color="#dc2626" />
                  <Text style={styles.statusText}>{isEnglish ? 'Loading vehicles...' : 'Buscando vehículos...'}</Text>
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
                          language={language}
                        />
                      </ScrollReveal>
                    ))}
                  </View>

                  {catalogVehicles.length === 0 && (
                    <Text style={styles.emptyText}>
                      {isEnglish ? 'No vehicles match these filters.' : 'No encontramos vehículos con esos filtros.'}
                    </Text>
                  )}
                </>
              )}
            </View>
          </ScrollReveal>
        </>
      )}

      {currentPage !== 'login' && currentPage !== 'admin' && (
        <ScrollReveal style={styles.revealSection}>
          <Footer
            onHomePress={openHome}
            onNewVehiclesPress={loadNewVehicles}
            onUsedVehiclesPress={loadUsedVehicles}
            onContactPress={() => navigateTo('contact')}
            onCatalogPress={openHome}
            onAboutPress={() => navigateTo('about')}
            language={language}
          />
        </ScrollReveal>
      )}
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
  resultsHeader: {
    width: '100%',
    alignItems: 'center',
  },
  backToHomeButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#262626',
  },
  backToHomeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
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
