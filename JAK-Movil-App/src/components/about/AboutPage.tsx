import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export function AboutPage() {
  return (
    <ScrollView style={styles.container}>
      {/* Banner Principal */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroSubtitle}>CONOCE NUESTRA HISTORIA</Text>
        <Text style={styles.heroTitle}>Pasión, Trabajo Duro y Pasión por los Autos</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Sección Historia / Biografía */}
        <View style={styles.storySection}>
          <View style={styles.textColumn}>
            <Text style={styles.badge}>NUESTRO FUNDADOR</Text>
            <Text style={styles.sectionTitle}>Bernardo Vásquez Reyes</Text>
            
            <Text style={styles.paragraph}>
              La historia de <Text style={styles.boldText}>Rosybel Auto Sales</Text> nace del esfuerzo, la dedicación y la pasión por la automoción de su fundador, <Text style={styles.boldText}>Bernardo Vásquez Reyes</Text>.
            </Text>

            <Text style={styles.paragraph}>
              Bernardo inició su trayectoria profesional trabajando como especialista en <Text style={styles.boldText}>desabolladura y pintura de vehículos</Text> en la República Dominicana, un oficio que hasta el día de hoy sigue ejerciendo con maestría. Su amor por los autos y el dominio técnico le permitieron conocer cada detalle, estructura y valor real de un vehículo.
            </Text>

            <Text style={styles.paragraph}>
              Tras emigrar a los Estados Unidos, su visión emprendedora tomó más fuerza. Desde allá, aprovechando su experiencia técnica y visión de mercado, comenzó a seleccionar y exportar vehículos de calidad hacia la República Dominicana.
            </Text>

            <Text style={styles.paragraph}>
              Hoy, con más de <Text style={styles.boldText}>4 años de trayectoria</Text>, Rosybel Auto Sales se ha consolidado como un dealer de confianza en la zona de Verón - Punta Cana, ofreciendo asesoría transparente y vehículos en óptimas condiciones mecánicas y estéticas.
            </Text>
          </View>
        </View>

        {/* Sección Misión, Visión y Valores */}
        <View style={styles.cardsGrid}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}></Text>
            <Text style={styles.cardTitle}>NUESTRA MISIÓN</Text>
            <Text style={styles.cardDescription}>
              Brindar a nuestros clientes en la República Dominicana vehículos de alta calidad, seleccionados e inspeccionados rigurosamente por expertos en la materia.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}></Text>
            <Text style={styles.cardTitle}>NUESTRA VISIÓN</Text>
            <Text style={styles.cardDescription}>
              Ser el dealer líder y más confiable de la región Este del país, reconocido por la honestidad, la excelencia en el servicio y la atención personalizada.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}></Text>
            <Text style={styles.cardTitle}>NUESTROS VALORES</Text>
            <Text style={styles.cardDescription}>
              • Transparencia y Honestidad{'\n'}
              • Trabajo y Esfuerzo Constante{'\n'}
              • Pasión por los Detalles{'\n'}
              • Compromiso con el Cliente
            </Text>
          </View>
        </View>

        {/* Banner de Experiencia */}
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4+</Text>
            <Text style={styles.statLabel}>Años de Trayectoria</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Inspección Técnica Garantizada</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>RD & EE.UU.</Text>
            <Text style={styles.statLabel}>Conexión Directa de Importación</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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