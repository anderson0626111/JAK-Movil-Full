import React, { useState, useEffect, useRef } from 'react';
import { Image, Platform, StyleSheet, View, ScrollView, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { vehicles } from '../../data/vehicleData';
import { API_URL } from '../../config/api';

const CARD_MARGIN = -30;

interface HeroImageProps {
  onVehiclePress?: (vehicleId: string) => void;
  language?: 'ES' | 'EN';
}

function translateValue(value: string, isEnglish: boolean) {
  if (!isEnglish) return value;
  const translations: Record<string, string> = {
    gasolina: 'Gasoline', automática: 'Automatic', automático: 'Automatic', usado: 'Used', nuevo: 'New',
  };
  return translations[value.trim().toLowerCase()] || value;
}

export function HeroImage({ onVehiclePress, language = 'ES' }: HeroImageProps) {
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 600;
  const isEnglish = language === 'EN';
  const viewportWidth = Math.min(width, 1200);
  const cardMargin = isMobileWeb ? 8 : CARD_MARGIN;
  const cardWidth = isMobileWeb
    ? Math.max(viewportWidth - 24, 280)
    : Math.min(viewportWidth * 0.55, 520);
  const slideInterval = cardWidth + cardMargin * 2;
  const horizontalPadding = Math.max(
    (viewportWidth - cardWidth) / 2 - cardMargin,
    0
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselVehicles, setCarouselVehicles] = useState<any[]>(vehicles);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/vehiculos/carrusel`)
      .then(async (response) => {
        if (!response.ok) throw new Error('No fue posible cargar el carrusel');
        return response.json();
      })
      .then((items) => {
        if (!active || !Array.isArray(items)) return;
        setActiveIndex(0);
        setCarouselVehicles(items.map((item) => ({
          ...item,
          title: `${item.marca} ${item.modelo}`,
          year: item.anio ?? item.año ?? null,
          fuel: item.combustible || '',
          transmission: item.transmision || '',
          imageUrl: item.imagen || '',
          price: item.precio
            ? `${item.moneda === 'DOP' ? 'RD$' : 'US$'} ${Number(item.precio).toLocaleString('en-US')}`
            : (language === 'EN' ? 'Price on request' : 'Consultar precio'),
        })));
      })
      .catch((error) => console.error('Error cargando el carrusel:', error));
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= carouselVehicles.length) {
        nextIndex = 0;
      }
      scrollToIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeIndex, carouselVehicles.length]);

  const scrollToIndex = (index: number) => {
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * slideInterval,
      animated: true,
    });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        x: activeIndex * slideInterval,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [slideInterval]);

  const handleNext = () => {
    if (!carouselVehicles.length) return;
    const nextIndex = (activeIndex + 1) % carouselVehicles.length;
    scrollToIndex(nextIndex);
  };

  const handlePrev = () => {
    if (!carouselVehicles.length) return;
    const prevIndex = (activeIndex - 1 + carouselVehicles.length) % carouselVehicles.length;
    scrollToIndex(prevIndex);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isMobileWeb && styles.containerMobile]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onContentSizeChange={() => {
            requestAnimationFrame(() => {
              scrollViewRef.current?.scrollTo({
                x: activeIndex * slideInterval,
                animated: false,
              });
            });
          }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          {carouselVehicles.map((vehicleItem, index) => {
            const vehicle = vehicleItem as any;
            const isActive = activeIndex === index;
            const isLeft = index < activeIndex;
            const isRight = index > activeIndex;

            let rotateY = '0deg';
            if (isLeft) rotateY = '28deg';
            if (isRight) rotateY = '-28deg';

            const imageSource = vehicle.imageUrl || vehicle.image;

            return (
              <TouchableOpacity
                key={`${vehicle.id || 'vehicle'}-${index}`}
                activeOpacity={0.9}
                onPress={() => onVehiclePress?.(String(vehicle.id))}
                style={[
                  styles.card,
                  { width: cardWidth, marginHorizontal: cardMargin },
                  isMobileWeb && styles.cardMobile,
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
                <View style={[styles.imageContainer, isMobileWeb && styles.imageContainerMobile]}>
                  <Image
                    source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
                    style={styles.imageBackdrop}
                    resizeMode="cover"
                    blurRadius={14}
                  />
                  <View style={styles.imageBackdropOverlay} />
                  <Image
                    source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  {!isActive && <View style={styles.overlay} />}
                </View>

                {/* Banner inferior en blanco */}
                <View style={[styles.infoBanner, isMobileWeb && styles.infoBannerMobile]}>
                  <Text style={[styles.vehicleTitle, isMobileWeb && styles.vehicleTitleMobile]} numberOfLines={1}>
                    {vehicle.title || vehicle.name || (isEnglish ? 'Vehicle' : 'Vehículo')}
                  </Text>
                  
                  <View style={[styles.detailsRow, isMobileWeb && styles.detailsRowMobile]}>
                    <View style={[styles.specsGroup, isMobileWeb && styles.specsGroupMobile]}>
                      <Text style={styles.specText}> {translateValue(vehicle.fuel || vehicle.fuelType || 'Gasolina', isEnglish)}</Text>
                      <Text style={styles.specText}> {translateValue(vehicle.transmission || 'Automática', isEnglish)}</Text>
                      <Text style={styles.specText}> {vehicle.year || '2022'}</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>
                        {vehicle.price}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Botones de navegación */}
        {carouselVehicles.length > 1 && <TouchableOpacity style={[styles.arrowButton, styles.leftArrow, isMobileWeb && styles.leftArrowMobile]} onPress={handlePrev}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>}
        {carouselVehicles.length > 1 && <TouchableOpacity style={[styles.arrowButton, styles.rightArrow, isMobileWeb && styles.rightArrowMobile]} onPress={handleNext}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>}

        {/* Dots */}
        <View style={styles.pagination}>
          {carouselVehicles.map((_, index) => (
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
  containerMobile: {
    height: 340,
  },
  scrollContent: {
    alignItems: 'center',
  },
  card: {
    height: 380,
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
  cardMobile: {
    height: 340,
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
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  imageContainerMobile: {
    height: 205,
  },
  imageBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.42,
  },
  imageBackdropOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  image: {
    width: '100%',
    height: '100%',
    zIndex: 1,
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
  infoBannerMobile: {
    height: 110,
    padding: 10,
  },
  vehicleTitle: {
    color: '#111827', // Texto del título en oscuro para contrastar con blanco
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleTitleMobile: {
    fontSize: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsRowMobile: {
    alignItems: 'flex-end',
    gap: 8,
  },
  specsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  specsGroupMobile: {
    flex: 1,
    flexWrap: 'wrap',
    gap: 5,
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
  leftArrowMobile: {
    left: 8,
  },
  rightArrow: {
    right: 15,
  },
  rightArrowMobile: {
    right: 8,
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
