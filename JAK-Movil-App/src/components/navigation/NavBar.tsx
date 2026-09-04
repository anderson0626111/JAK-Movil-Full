import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  x: 'https://x.com/',
};

interface NavBarProps {
  onHomePress?: () => void;
  onNewVehiclesPress?: () => void;
  onUsedVehiclesPress?: () => void;
  onAboutPress?: () => void;
  onContactPress?: () => void;
  activePage?: 'home' | 'about' | 'contact' | 'new' | 'used' | string;
}

export function NavBar({
  onHomePress,
  onNewVehiclesPress,
  onUsedVehiclesPress,
  onAboutPress,
  onContactPress,
  activePage = 'home',
}: NavBarProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  function openSocialNetwork(url: string) {
    Linking.openURL(url).catch((error) =>
      console.error('No se pudo abrir la red social:', error)
    );
  }

  return (
    <View style={styles.headerContainer}>
      {/* Logo */}
      <View
        style={[
          styles.logoSection,
          isCompact && styles.logoSectionCompact,
        ]}
      >
        <View pointerEvents="none" style={[styles.headerGlow, styles.glowLeft]} />
        <View pointerEvents="none" style={[styles.headerGlow, styles.glowRight]} />

        {!isCompact && (
          <View style={styles.trustSection}>
            <Text style={styles.eyebrow}>TU PRÓXIMO VEHÍCULO</Text>
            <Text style={styles.trustTitle}>Compra con confianza</Text>
            <Text style={styles.trustText}>
              Nuevos y usados · Punta Cana, RD
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={onHomePress} activeOpacity={0.8}>
          <Image
            source={require('../../assets/images/Logo_Dealer.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View
          style={[
            styles.socialSection,
            isCompact && styles.socialSectionCompact,
          ]}
        >
          <Text style={styles.socialLabel}>SÍGUENOS</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Abrir Facebook"
              style={styles.socialButton}
              onPress={() => openSocialNetwork(SOCIAL_LINKS.facebook)}
            >
              <Text style={[styles.socialLetter, styles.facebookLetter]}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Abrir Instagram"
              style={styles.socialButton}
              onPress={() => openSocialNetwork(SOCIAL_LINKS.instagram)}
            >
              <View style={styles.instagramGlyph}>
                <View style={styles.instagramLens} />
                <View style={styles.instagramDot} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Abrir X"
              style={styles.socialButton}
              onPress={() => openSocialNetwork(SOCIAL_LINKS.x)}
            >
              <Text style={[styles.socialLetter, styles.xLetter]}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Menú */}
      <View style={styles.menuBar}>
        <View style={styles.menuContainer}>
          
          <TouchableOpacity
            style={[styles.navItem, activePage === 'home' && styles.activeNavItem]}
            onPress={onHomePress}
          >
            <Text style={styles.navText}>INICIO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activePage === 'new' && styles.activeNavItem]}
            onPress={onNewVehiclesPress}
          >
            <Text style={styles.navText}>VEHÍCULOS NUEVOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activePage === 'used' && styles.activeNavItem]}
            onPress={onUsedVehiclesPress}
          >
            <Text style={styles.navText}>VEHÍCULOS USADOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activePage === 'about' && styles.activeNavItem]}
            onPress={onAboutPress}
          >
            <Text style={styles.navText}>NOSOTROS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activePage === 'contact' && styles.activeNavItem]}
            onPress={onContactPress}
          >
            <Text style={styles.navText}>CONTACTO</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
  },
  logoSection: {
    backgroundColor: '#ffffff',
    minHeight: 140,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    overflow: 'hidden',
  },
  logoSectionCompact: {
    minHeight: 166,
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  logo: {
    height: 92,
    width: 240,
  },
  headerGlow: {
    position: 'absolute',
    width: 310,
    height: 105,
    borderRadius: 80,
    opacity: 0.75,
    transform: [{ rotate: '-8deg' }],
  },
  glowLeft: {
    left: -80,
    top: 16,
    backgroundColor: '#fef2f2',
  },
  glowRight: {
    right: -80,
    bottom: 12,
    backgroundColor: '#f3f4f6',
  },
  trustSection: {
    position: 'absolute',
    left: 36,
    width: 270,
    zIndex: 2,
  },
  eyebrow: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  trustTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  trustText: {
    color: '#6b7280',
    fontSize: 12,
  },
  socialSection: {
    position: 'absolute',
    right: 36,
    width: 270,
    alignItems: 'flex-end',
    zIndex: 2,
  },
  socialSectionCompact: {
    position: 'relative',
    right: 'auto',
    width: 'auto',
    alignItems: 'center',
    marginTop: -6,
  },
  socialLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 9,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  socialLetter: {
    fontSize: 18,
    fontWeight: '900',
  },
  facebookLetter: {
    color: '#1877f2',
    fontFamily: 'Arial',
  },
  xLetter: {
    color: '#111827',
    fontSize: 14,
  },
  instagramGlyph: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramLens: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#e1306c',
  },
  instagramDot: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#e1306c',
  },
  menuBar: {
    backgroundColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavItem: {
    backgroundColor: '#dc2626',
  },
  navText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
