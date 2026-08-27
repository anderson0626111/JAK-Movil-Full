import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, Text } from 'react-native';
import { vehicles } from '../../data/vehicleData';

const { width: screenWidth } = Dimensions.get('window');

const CARD_WIDTH = Math.min(screenWidth * 0.55, 520);
const CARD_MARGIN = -30;
const SLIDE_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

export function HeroImage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= vehicles.length) {
        nextIndex = 0;
      }
      scrollToIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const scrollToIndex = (index: number) => {
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * SLIDE_INTERVAL,
      animated: true,
    });
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % vehicles.length;
    scrollToIndex(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + vehicles.length) % vehicles.length;
    scrollToIndex(prevIndex);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.scrollContent}
        >
          {vehicles.map((vehicleItem, index) => {
            const vehicle = vehicleItem as any;
            const isActive = activeIndex === index;
            const isLeft = index < activeIndex;
            const isRight = index > activeIndex;

            let rotateY = '0deg';
            if (isLeft) rotateY = '28deg';
            if (isRight) rotateY = '-28deg';

            const imageSource = vehicle.imageUrl || vehicle.image;

            return (
              <View
                key={vehicle.id || index}
                style={[
                  styles.card,
                  isActive ? styles.activeCard : styles.inactiveCard,
                  {
                    transform: [
                      { perspective: 800 },
                      { rotateY: rotateY },
                      { scale: isActive ? 1 : 0.82 },
                    ],
                  },
                ]}
              >
                {/* Contenedor e Imagen del vehículo (ajustado para ver el carro completo) */}
                <View style={styles.imageContainer}>
                  <Image
                    source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {!isActive && <View style={styles.overlay} />}
                </View>

                {/* Banner inferior en blanco */}
                <View style={styles.infoBanner}>
                  <Text style={styles.vehicleTitle} numberOfLines={1}>
                    {vehicle.title || vehicle.name || 'Vehículo'}
                  </Text>
                  
                  <View style={styles.detailsRow}>
                    <View style={styles.specsGroup}>
                      <Text style={styles.specText}> {vehicle.fuel || vehicle.fuelType || 'Gasolina'}</Text>
                      <Text style={styles.specText}> {vehicle.transmission || 'Automática'}</Text>
                      <Text style={styles.specText}> {vehicle.year || '2022'}</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>
                        {vehicle.price}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Botones de navegación */}
        <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={handlePrev}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.pagination}>
          {vehicles.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    height: 380,
    position: 'relative',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2 - CARD_MARGIN,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: 380,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff', // Fondo de la tarjeta en blanco
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeCard: {
    zIndex: 10,
  },
  inactiveCard: {
    zIndex: 1,
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#ffffff', // Fondo donde reposa la imagen
    padding: 8, // Margen interno para que la imagen no toque los bordes
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  infoBanner: {
    backgroundColor: '#ffffff', // Banner inferior en blanco
    borderTopWidth: 2,
    borderTopColor: '#dc2626',
    padding: 12,
    height: 100,
    justifyContent: 'space-between',
  },
  vehicleTitle: {
    color: '#111827', // Texto del título en oscuro para contrastar con blanco
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  specText: {
    color: '#4b5563', // Texto secundario en gris oscuro
    fontSize: 12,
  },
  priceBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priceText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  arrowButton: {
    position: 'absolute',
    top: '42%',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  leftArrow: {
    left: 15,
  },
  rightArrow: {
    right: 15,
  },
  arrowText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: -4,
  },
  pagination: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#ef4444',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 6,
  },
});