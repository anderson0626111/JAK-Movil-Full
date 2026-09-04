import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { API_URL } from '../../config/api';
import { ScrollReveal } from '../animation/ScrollReveal';

interface ApiVehicle {
  id: number; marca: string; modelo: string; año: number; precio: number; moneda: string;
  tipo: string; condicion: string | null; transmision: string; combustible: string;
  imagen: string | null; fotos: string[]; color_exterior: string | null;
  color_interior: string | null; kilometraje: string | null; cilindraje: string | null;
  traccion: string | null; sector: string | null; vendedor: string | null;
  accesorios: string | null; equipamiento: string | null; descripcion: string | null;
}

interface VehicleDetailsProps { vehicleId: string; onBack: () => void; }

function formatPrice(price: number, currency: string) {
  if (!Number(price)) return 'Consultar precio';
  return `${currency === 'DOP' ? 'RD$' : 'US$'} ${Number(price).toLocaleString('en-US')}`;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return <View style={styles.infoItem}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

function FeatureList({ title, value }: { title: string; value?: string | null }) {
  if (!value) return null;
  const items = value.split('\n').map((item) => item.trim()).filter(Boolean);
  return (
    <View style={styles.featureCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.featureGrid}>
        {items.map((item, index) => <View style={styles.featureItem} key={`${item}-${index}`}><Text style={styles.check}>✓</Text><Text style={styles.featureText}>{item}</Text></View>)}
      </View>
    </View>
  );
}

export function VehicleDetails({ vehicleId, onBack }: VehicleDetailsProps) {
  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    async function loadVehicle() {
      try {
        setLoading(true); setError('');
        const response = await fetch(`${API_URL}/api/vehiculos/${vehicleId}`);
        if (!response.ok) throw new Error('No se encontró el vehículo');
        const data: ApiVehicle = await response.json();
        const photos = data.fotos?.length ? data.fotos : data.imagen ? [data.imagen] : [];
        setVehicle({ ...data, fotos: photos });
        setSelectedPhoto(photos[0] || '');
      } catch (requestError) {
        console.error('Error al cargar vehículo:', requestError);
        setError('No fue posible cargar la información del vehículo.');
      } finally { setLoading(false); }
    }
    loadVehicle();
  }, [vehicleId]);

  function showPreviousPhoto() {
    if (!vehicle || vehicle.fotos.length < 2) return;

    const currentIndex = Math.max(vehicle.fotos.indexOf(selectedPhoto), 0);
    const previousIndex =
      (currentIndex - 1 + vehicle.fotos.length) % vehicle.fotos.length;
    setSelectedPhoto(vehicle.fotos[previousIndex]);
  }

  function showNextPhoto() {
    if (!vehicle || vehicle.fotos.length < 2) return;

    const currentIndex = Math.max(vehicle.fotos.indexOf(selectedPhoto), 0);
    const nextIndex = (currentIndex + 1) % vehicle.fotos.length;
    setSelectedPhoto(vehicle.fotos[nextIndex]);
  }

  if (loading) return <View style={styles.statusContainer}><ActivityIndicator size="large" color="#dc2626" /><Text style={styles.statusText}>Cargando vehículo...</Text></View>;
  if (error || !vehicle) return <View style={styles.statusContainer}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.backButton} onPress={onBack}><Text style={styles.backButtonText}>VOLVER A RESULTADOS</Text></TouchableOpacity></View>;

  return (
    <View style={styles.container}>
      <ScrollReveal>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Text style={styles.backButtonText}>← VOLVER</Text></TouchableOpacity>
        <View style={styles.headingRow}>
          <View><Text style={styles.title}>{vehicle.marca} {vehicle.modelo}</Text><Text style={styles.subtitle}>{vehicle.año} · {vehicle.condicion || vehicle.tipo}</Text></View>
          <Text style={styles.price}>{formatPrice(vehicle.precio, vehicle.moneda)}</Text>
        </View>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <View style={styles.galleryCard}>
          <View style={styles.mainImageContainer}>
            {selectedPhoto ? (
              <>
                <Image source={{ uri: selectedPhoto }} style={styles.imageBackdrop} resizeMode="cover" blurRadius={18} />
                <View style={styles.imageBackdropOverlay} />
                <TouchableOpacity
                  activeOpacity={0.94}
                  accessibilityLabel="Ampliar fotografía"
                  style={styles.mainImageTapArea}
                  onPress={() => setLightboxOpen(true)}
                >
                  <Image source={{ uri: selectedPhoto }} style={styles.mainImage} resizeMode="contain" />
                  <View style={styles.zoomHint}>
                    <Text style={styles.zoomHintText}>AMPLIAR ⛶</Text>
                  </View>
                </TouchableOpacity>
                {vehicle.fotos.length > 1 && (
                  <>
                    <TouchableOpacity
                      accessibilityLabel="Foto anterior"
                      style={[styles.galleryArrow, styles.galleryArrowLeft]}
                      onPress={showPreviousPhoto}
                    >
                      <Text style={styles.galleryArrowText}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel="Foto siguiente"
                      style={[styles.galleryArrow, styles.galleryArrowRight]}
                      onPress={showNextPhoto}
                    >
                      <Text style={styles.galleryArrowText}>›</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : <View style={styles.imageFallback}><Text style={styles.fallbackText}>No hay fotografías disponibles</Text></View>}
          </View>
          {vehicle.fotos.length > 1 && <View style={styles.thumbnailRow}>{vehicle.fotos.map((photo, index) => (
            <TouchableOpacity key={photo} activeOpacity={0.8} onPress={() => setSelectedPhoto(photo)} style={[styles.thumbnailButton, selectedPhoto === photo && styles.thumbnailSelected]}>
              <Image source={{ uri: photo }} style={styles.thumbnail} resizeMode="cover" /><Text style={styles.photoNumber}>{index + 1}</Text>
            </TouchableOpacity>
          ))}</View>}
        </View>
      </ScrollReveal>

      <ScrollReveal delay={50}>
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Información del vehículo</Text>
          <View style={styles.infoGrid}>
            <InfoRow label="Marca" value={vehicle.marca} /><InfoRow label="Modelo" value={vehicle.modelo} /><InfoRow label="Año" value={vehicle.año} />
            <InfoRow label="Tipo" value={vehicle.tipo} /><InfoRow label="Condición" value={vehicle.condicion} /><InfoRow label="Transmisión" value={vehicle.transmision} />
            <InfoRow label="Combustible" value={vehicle.combustible} /><InfoRow label="Color exterior" value={vehicle.color_exterior} /><InfoRow label="Color interior" value={vehicle.color_interior} />
            <InfoRow label="Kilometraje" value={vehicle.kilometraje} /><InfoRow label="Cilindraje" value={vehicle.cilindraje} /><InfoRow label="Tracción" value={vehicle.traccion} />
            <InfoRow label="Sector" value={vehicle.sector} /><InfoRow label="Vendedor" value={vehicle.vendedor} />
          </View>
        </View>
      </ScrollReveal>

      {!!vehicle.accesorios && <ScrollReveal><FeatureList title="Accesorios y características" value={vehicle.accesorios} /></ScrollReveal>}
      {!!vehicle.equipamiento && <ScrollReveal><FeatureList title="Equipamiento destacado" value={vehicle.equipamiento} /></ScrollReveal>}
      {!!vehicle.descripcion && <ScrollReveal><View style={styles.descriptionCard}><Text style={styles.sectionTitle}>Descripción</Text><Text style={styles.description}>{vehicle.descripcion}</Text></View></ScrollReveal>}

      <Modal
        visible={lightboxOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxOpen(false)}
      >
        <View style={styles.lightboxOverlay}>
          <View style={styles.lightboxTopBar}>
            <Text style={styles.lightboxCounter}>
              {Math.max(vehicle.fotos.indexOf(selectedPhoto), 0) + 1} / {vehicle.fotos.length}
            </Text>
            <TouchableOpacity
              accessibilityLabel="Cerrar fotografía ampliada"
              style={styles.lightboxClose}
              onPress={() => setLightboxOpen(false)}
            >
              <Text style={styles.lightboxCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lightboxStage}>
            <Image source={{ uri: selectedPhoto }} style={styles.lightboxImage} resizeMode="contain" />
          </View>

          {vehicle.fotos.length > 1 && (
            <>
              <TouchableOpacity
                accessibilityLabel="Fotografía anterior"
                style={[styles.lightboxArrow, styles.lightboxArrowLeft]}
                onPress={showPreviousPhoto}
              >
                <Text style={styles.lightboxArrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Fotografía siguiente"
                style={[styles.lightboxArrow, styles.lightboxArrowRight]}
                onPress={showNextPhoto}
              >
                <Text style={styles.lightboxArrowText}>›</Text>
              </TouchableOpacity>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lightboxThumbnails}
                style={styles.lightboxThumbnailScroll}
              >
                {vehicle.fotos.map((photo, index) => (
                  <TouchableOpacity
                    key={`lightbox-${photo}`}
                    onPress={() => setSelectedPhoto(photo)}
                    style={[
                      styles.lightboxThumbnailButton,
                      selectedPhoto === photo && styles.lightboxThumbnailSelected,
                    ]}
                  >
                    <Image source={{ uri: photo }} style={styles.lightboxThumbnail} resizeMode="cover" />
                    <Text style={styles.lightboxPhotoNumber}>{index + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '92%', maxWidth: 1120, alignSelf: 'center', paddingVertical: 28 },
  statusContainer: { alignItems: 'center', paddingVertical: 80 }, statusText: { color: '#4b5563', marginTop: 12 },
  errorText: { color: '#dc2626', fontSize: 16, marginBottom: 18 },
  backButton: { alignSelf: 'flex-start', backgroundColor: '#262626', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 22 },
  backButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  headingRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 22 },
  title: { color: '#111827', fontSize: 28, fontWeight: 'bold' }, subtitle: { color: '#6b7280', fontSize: 15, marginTop: 5 },
  price: { color: '#dc2626', fontSize: 24, fontWeight: 'bold' },
  galleryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 22, elevation: 2 },
  mainImageContainer: { width: '100%', maxWidth: 720, height: 320, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  imageBackdrop: { position: 'absolute', width: '100%', height: '100%', opacity: 0.45 },
  imageBackdropOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.35)' },
  mainImageTapArea: { width: '100%', height: '100%', zIndex: 1 },
  mainImage: { width: '100%', height: '100%' },
  zoomHint: { position: 'absolute', right: 12, bottom: 10, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.68)' },
  zoomHintText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.6 },
  imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' }, fallbackText: { color: '#6b7280' },
  galleryArrow: { position: 'absolute', top: '50%', marginTop: -23, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  galleryArrowLeft: { left: 14 }, galleryArrowRight: { right: 14 }, galleryArrowText: { color: '#fff', fontSize: 34, fontWeight: 'bold', lineHeight: 38, marginTop: -3 },
  thumbnailRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 14 },
  thumbnailButton: { width: 128, height: 82, borderRadius: 7, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  thumbnailSelected: { borderColor: '#dc2626' }, thumbnail: { width: '100%', height: '100%' },
  photoNumber: { position: 'absolute', right: 5, bottom: 4, color: '#fff', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: 'bold' },
  detailsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 22, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 14 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, infoItem: { width: 245, flexGrow: 1, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingVertical: 11 },
  label: { color: '#6b7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }, value: { color: '#111827', fontSize: 15, fontWeight: '600' },
  featureCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 22, elevation: 2 }, featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: { width: 245, flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f9fafb', borderRadius: 7, padding: 10 }, check: { color: '#dc2626', fontWeight: 'bold', marginRight: 8 }, featureText: { color: '#374151', flex: 1 },
  descriptionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 22, elevation: 2 }, description: { color: '#4b5563', fontSize: 15, lineHeight: 23 },
  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' },
  lightboxTopBar: { position: 'absolute', top: 18, left: 24, right: 24, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lightboxCounter: { color: '#fff', fontSize: 15, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  lightboxClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  lightboxCloseText: { color: '#fff', fontSize: 32, lineHeight: 34, marginTop: -3 },
  lightboxStage: { width: '84%', height: '72%', maxWidth: 1120, alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '100%' },
  lightboxArrow: { position: 'absolute', top: '46%', width: 58, height: 64, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  lightboxArrowLeft: { left: 20, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  lightboxArrowRight: { right: 20, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  lightboxArrowText: { color: '#fff', fontSize: 43, fontWeight: 'bold', lineHeight: 48, marginTop: -5 },
  lightboxThumbnailScroll: { position: 'absolute', left: 0, right: 0, bottom: 16, maxHeight: 86 },
  lightboxThumbnails: { paddingHorizontal: 18, gap: 10, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  lightboxThumbnailButton: { width: 104, height: 68, borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', position: 'relative' },
  lightboxThumbnailSelected: { borderColor: '#dc2626' },
  lightboxThumbnail: { width: '100%', height: '100%' },
  lightboxPhotoNumber: { position: 'absolute', right: 4, bottom: 3, color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 9, paddingHorizontal: 5, paddingVertical: 1, fontSize: 9, fontWeight: 'bold' },
});
