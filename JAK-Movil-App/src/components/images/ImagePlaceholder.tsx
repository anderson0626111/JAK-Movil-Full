import { StyleSheet, Text, View } from 'react-native';

export function ImagePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Imagen aquí</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    minHeight: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  text: {
    color: '#64748b',
    fontSize: 16,
  },
});
