import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

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
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {/* Imagen del vehículo */}
      <View style={styles.imageContainer}>
        <Image
          source={
            typeof vehicle.imageUrl === 'string' && vehicle.imageUrl.length > 0
                ? { uri: vehicle.imageUrl }
                : vehicle.imageUrl
  }
  style={styles.image}
  resizeMode="cover"
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{vehicle.price}</Text>
        </View>
      </View>

      {/* Detalles del vehículo */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {vehicle.title}
        </Text>
        <Text style={styles.yearText}>Año: {vehicle.year}</Text>

        {/* Especificaciones clave */}
        <View style={styles.specsRow}>
          <Text style={styles.specItem}> {vehicle.mileage}</Text>
          <Text style={styles.specItem}> {vehicle.transmission}</Text>
          <Text style={styles.specItem}> {vehicle.fuel}</Text>
        </View>

        {/* Botón de acción */}
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Ver Detalles</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
});