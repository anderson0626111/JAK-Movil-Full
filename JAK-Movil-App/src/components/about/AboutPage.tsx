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
          <Text style={styles.heroTitle}>{isEnglish ? 'Passion, Hard Work and a Love for Cars' : 'Pasión, Trabajo Duro y Pasión por los Autos'}</Text>
        </View>
      </ScrollReveal>

      <View style={styles.contentContainer}>
        {/* Sección Historia / Biografía */}
        <ScrollReveal>
          <View style={styles.storySection}>
            <View style={styles.textColumn}>
            <Text style={styles.badge}>{isEnglish ? 'OUR FOUNDER' : 'NUESTRO FUNDADOR'}</Text>
            <Text style={styles.sectionTitle}>Bernardo Vásquez Reyes</Text>
            
            <Text style={styles.paragraph}>
              {isEnglish ? 'The story of ' : 'La historia de '}<Text style={styles.boldText}>Rosybel Auto Sales</Text>{isEnglish ? ' began with the hard work, dedication and automotive passion of its founder, ' : ' nace del esfuerzo, la dedicación y la pasión por la automoción de su fundador, '}<Text style={styles.boldText}>Bernardo Vásquez Reyes</Text>.
            </Text>

            <Text style={styles.paragraph}>
              {isEnglish ? 'Bernardo began his career as a specialist in ' : 'Bernardo inició su trayectoria profesional trabajando como especialista en '}<Text style={styles.boldText}>{isEnglish ? 'vehicle body repair and painting' : 'desabolladura y pintura de vehículos'}</Text>{isEnglish ? ' in the Dominican Republic, a trade he continues to master today. His love for cars and technical expertise taught him to understand every detail, structure and true value of a vehicle.' : ' en la República Dominicana, un oficio que hasta el día de hoy sigue ejerciendo con maestría. Su amor por los autos y el dominio técnico le permitieron conocer cada detalle, estructura y valor real de un vehículo.'}
            </Text>

            <Text style={styles.paragraph}>
              {isEnglish ? 'After moving to the United States, his entrepreneurial vision grew stronger. Drawing on his technical experience and market knowledge, he began selecting and exporting quality vehicles to the Dominican Republic.' : 'Tras emigrar a los Estados Unidos, su visión emprendedora tomó más fuerza. Desde allá, aprovechando su experiencia técnica y visión de mercado, comenzó a seleccionar y exportar vehículos de calidad hacia la República Dominicana.'}
            </Text>

            <Text style={styles.paragraph}>
              {isEnglish ? 'Today, with more than ' : 'Hoy, con más de '}<Text style={styles.boldText}>{isEnglish ? '4 years of experience' : '4 años de trayectoria'}</Text>{isEnglish ? ', Rosybel Auto Sales has become a trusted dealership in the Verón–Punta Cana area, offering transparent guidance and vehicles in excellent mechanical and cosmetic condition.' : ', Rosybel Auto Sales se ha consolidado como un dealer de confianza en la zona de Verón - Punta Cana, ofreciendo asesoría transparente y vehículos en óptimas condiciones mecánicas y estéticas.'}
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
            <Text style={styles.statNumber}>4+</Text>
            <Text style={styles.statLabel}>{isEnglish ? 'Years of Experience' : 'Años de Trayectoria'}</Text>
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
  boldText: {
    fontWeight: 'bold',
    color: '#111827',
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
