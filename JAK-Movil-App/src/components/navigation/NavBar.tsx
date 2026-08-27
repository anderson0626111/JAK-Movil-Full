import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface NavBarProps {
  onHomePress?: () => void;
  onAboutPress?: () => void;
  onContactPress?: () => void;
  activePage?: 'home' | 'about' | 'contact' | string;
}

export function NavBar({
  onHomePress,
  onAboutPress,
  onContactPress,
  activePage = 'home',
}: NavBarProps) {
  return (
    <View style={styles.headerContainer}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <TouchableOpacity onPress={onHomePress} activeOpacity={0.8}>
          <Image
            source={require('../../assets/images/Logo_Dealer.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
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

          <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
            <Text style={styles.navText}>VEHÍCULOS NUEVOS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
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
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    height: 70,
    width: 220,
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