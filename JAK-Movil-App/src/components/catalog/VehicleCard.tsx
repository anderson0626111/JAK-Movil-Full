import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';

export interface Vehicle {
  id: string;
  title: string;
  price: string;
  year: number;
  mileage: string;
  transmission: string;
  fuel: string;
  imageUrl: any;
  isFeatured?: boolean;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  language?: 'ES' | 'EN';
}

function translateVehicleValue(value: string, isEnglish: boolean) {
  if (!isEnglish) return value;
  const translations: Record<string, string> = {
    nuevo: 'New', usado: 'Used', automática: 'Automatic', automatico: 'Automatic', automático: 'Automatic',
    gasolina: 'Gasoline', eléctrico: 'Electric', electrico: 'Electric', híbrido: 'Hybrid', hibrido: 'Hybrid',
    sedán: 'Sedan', sedan: 'Sedan', camioneta: 'Pickup truck', jeepeta: 'SUV',
  };
  return translations[value.trim().toLowerCase()] || value;
}

export function VehicleCard({ vehicle, onPress, language = 'ES' }: VehicleCardProps) {
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
  const isEnglish = language === 'EN';
  const [previewOpen, setPreviewOpen] = useState(false);
  const imageSource =
    typeof vehicle.imageUrl === 'string' && vehicle.imageUrl.length > 0
      ? { uri: vehicle.imageUrl }
      : vehicle.imageUrl;

  return (
    <>
    <View style={[styles.card, isMobileWeb && styles.cardMobile]}>
      {/* Imagen del vehículo */}
      <TouchableOpacity
        style={styles.imageContainer}
        activeOpacity={0.9}
        accessibilityLabel={`${isEnglish ? 'Enlarge photo of' : 'Ampliar foto de'} ${vehicle.title}`}
        onPress={() => setPreviewOpen(true)}
      >
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{isEnglish && vehicle.price === 'Consultar precio' ? 'Contact for price' : vehicle.price}</Text>
        </View>
      </TouchableOpacity>

      {/* Detalles del vehículo */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {vehicle.title}
        </Text>
        <Text style={styles.yearText}>{isEnglish ? 'Year' : 'Año'}: {vehicle.year}</Text>

        {/* Especificaciones clave */}
        <View style={styles.specsRow}>
          <Text style={styles.specItem}> {translateVehicleValue(vehicle.mileage, isEnglish)}</Text>
          <Text style={styles.specItem}> {translateVehicleValue(vehicle.transmission, isEnglish)}</Text>
          <Text style={styles.specItem}> {translateVehicleValue(vehicle.fuel, isEnglish)}</Text>
        </View>

        {/* Botón de acción */}
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{isEnglish ? 'View Details' : 'Ver Detalles'}</Text>
        </TouchableOpacity>
      </View>
    </View>

    <Modal
      visible={previewOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setPreviewOpen(false)}
    >
      <View style={styles.previewOverlay}>
        <TouchableOpacity
          style={styles.previewClose}
          accessibilityLabel={isEnglish ? 'Close enlarged image' : 'Cerrar imagen ampliada'}
          onPress={() => setPreviewOpen(false)}
        >
          <Text style={styles.previewCloseText}>×</Text>
        </TouchableOpacity>
        <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
    width: 320, // Ancho fijo por tarjeta dentro del grid
    marginHorizontal: 10,
  },
  cardMobile: {
    width: '100%',
    maxWidth: 360,
    marginHorizontal: 0,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#d32f2f',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  priceText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  yearText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginBottom: 14,
  },
  specItem: {
    fontSize: 12,
    color: '#4b5563',
  },
  button: {
    backgroundColor: '#262626',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  previewImage: {
    width: '100%',
    height: '88%',
  },
  previewClose: {
    position: 'absolute',
    top: 20,
    right: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewCloseText: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 35,
    marginTop: -3,
  },
});
