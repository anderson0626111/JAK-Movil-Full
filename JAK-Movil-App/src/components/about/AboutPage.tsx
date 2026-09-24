import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollReveal } from '../animation/ScrollReveal';

export function AboutPage({ language = 'ES' }: { language?: 'ES' | 'EN' }) {
  const isEnglish = language === 'EN';
  return (
    <View style={styles.container}>
      {/* Banner Principal */}
      <ScrollReveal>
        <View style={styles.heroBanner}>
          <Text style={styles.heroSubtitle}>{isEnglish ? 'DISCOVER OUR STORY' : 'CONOCE NUESTRA HISTORIA'}</Text>
          <Text style={styles.heroTitle}>{isEnglish ? 'A dealership built on trust and automotive experience' : 'Un dealer construido sobre confianza y experiencia automotriz'}</Text>
        </View>
      </ScrollReveal>

      <View style={styles.contentContainer}>
        {/* Historia del dealer */}
        <ScrollReveal>
          <View style={styles.storySection}>
            <View style={styles.textColumn}>
            <Text style={styles.badge}>{isEnglish ? 'ROSYBEL AUTO SALES' : 'ROSYBEL AUTO SALES'}</Text>
            <Text style={styles.sectionTitle}>{isEnglish ? 'Our dealership history' : 'La historia de nuestro dealer'}</Text>
            
            <Text style={styles.paragraph}>
              {isEnglish ? 'Rosybel Auto Sales was founded in 2021 by Bernardo Vasquez Reyes, building on years of technical automotive experience, hard work and a clear purpose: to help each customer choose a vehicle with confidence.' : 'Rosybel Auto Sales fue fundada en 2021 por Bernardo Vasquez Reyes, a partir de años de experiencia técnica en el sector automotriz, trabajo constante y un propósito claro: ayudar a cada cliente a elegir su vehículo con confianza.'}
            </Text>

            <Text style={styles.paragraph}>
              {isEnglish ? 'The dealership began with a small, carefully selected inventory and a commitment to offering clear information and personal guidance. As customer trust grew, the variety of vehicles and available services expanded.' : 'El dealer inició con un inventario reducido y cuidadosamente seleccionado, acompañado de un compromiso con la información clara y la atención personalizada. A medida que creció la confianza de sus clientes, también se amplió la variedad de vehículos y servicios disponibles.'}
            </Text>

            <Text style={styles.paragraph}>
              {isEnglish ? 'The business later strengthened its connection with the United States, expanding its ability to identify, select and import quality vehicles for customers in the Dominican Republic.' : 'Más adelante, el negocio fortaleció su conexión con los Estados Unidos, ampliando su capacidad para identificar, seleccionar e importar vehículos de calidad destinados a clientes de la República Dominicana.'}
            </Text>

            <Text style={styles.paragraph}>
              {isEnglish ? 'Today, with a history built since 2021, Rosybel Auto Sales serves the Verón–Punta Cana area with personalized guidance, transparent information and vehicles selected according to mechanical and cosmetic quality standards.' : 'Actualmente, con una trayectoria construida desde 2021, Rosybel Auto Sales atiende la zona de Verón–Punta Cana con asesoría personalizada, información transparente y vehículos seleccionados bajo criterios de calidad mecánica y estética.'}
            </Text>
            </View>
          </View>
        </ScrollReveal>

        {/* Sección Misión, Visión y Valores */}
        <ScrollReveal delay={70}>
          <View style={styles.cardsGrid}>
            <View style={styles.card}>
            <Text style={styles.cardIcon}></Text>
            <Text style={styles.cardTitle}>{isEnglish ? 'OUR MISSION' : 'NUESTRA MISIÓN'}</Text>
            <Text style={styles.cardDescription}>
              {isEnglish ? 'To provide our customers in the Dominican Republic with high-quality vehicles carefully selected and thoroughly inspected by industry experts.' : 'Brindar a nuestros clientes en la República Dominicana vehículos de alta calidad, seleccionados e inspeccionados rigurosamente por expertos en la materia.'}
            </Text>
            </View>

            <View style={styles.card}>
            <Text style={styles.cardIcon}></Text>
            <Text style={styles.cardTitle}>{isEnglish ? 'OUR VISION' : 'NUESTRA VISIÓN'}</Text>
            <Text style={styles.cardDescription}>
              {isEnglish ? 'To be the leading and most trusted dealership in the eastern region of the country, recognized for honesty, service excellence and personalized attention.' : 'Ser el dealer líder y más confiable de la región Este del país, reconocido por la honestidad, la excelencia en el servicio y la atención personalizada.'}
            </Text>
            </View>

            <View style={styles.card}>
            <Text style={styles.cardIcon}></Text>
            <Text style={styles.cardTitle}>{isEnglish ? 'OUR VALUES' : 'NUESTROS VALORES'}</Text>
            <Text style={styles.cardDescription}>
              {isEnglish ? '• Transparency and Honesty\n• Consistent Work and Dedication\n• Attention to Detail\n• Commitment to Our Customers' : '• Transparencia y Honestidad\n• Trabajo y Esfuerzo Constante\n• Pasión por los Detalles\n• Compromiso con el Cliente'}
            </Text>
            </View>
          </View>
        </ScrollReveal>

        {/* Banner de Experiencia */}
        <ScrollReveal delay={90}>
          <View style={styles.statsBanner}>
            <View style={styles.statItem}>
            <Text style={styles.statNumber}>2021</Text>
            <Text style={styles.statLabel}>{isEnglish ? 'Year Founded' : 'Año de Fundación'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>{isEnglish ? 'Guaranteed Technical Inspection' : 'Inspección Técnica Garantizada'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
            <Text style={styles.statNumber}>{isEnglish ? 'DR & USA' : 'RD & EE.UU.'}</Text>
            <Text style={styles.statLabel}>{isEnglish ? 'Direct Import Connection' : 'Conexión Directa de Importación'}</Text>
            </View>
          </View>
        </ScrollReveal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  heroBanner: {
    backgroundColor: '#111827',
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#dc2626',
  },
  heroSubtitle: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    maxWidth: 800,
  },
  contentContainer: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  storySection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  textColumn: {
    flex: 1,
  },
  badge: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderTopWidth: 4,
    borderTopColor: '#dc2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  statsBanner: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 150,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#d1d5db',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
});
