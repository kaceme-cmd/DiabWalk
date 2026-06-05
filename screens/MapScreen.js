import { StyleSheet, Text, View } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Carte des marcheurs</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>📍</Text>
        <Text style={styles.mapText}>Carte interactive</Text>
        <Text style={styles.mapSub}>Bientôt disponible</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jean-Louis</Text>
        <Text style={styles.cardSub}>📍 1,2 km · Niveau régulier</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sylvie C.</Text>
        <Text style={styles.cardSub}>📍 2,8 km · Niveau débutant</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D7D46',
    marginBottom: 20,
  },
  mapPlaceholder: {
    backgroundColor: '#E8F5EC',
    borderRadius: 16,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mapEmoji: { fontSize: 40, marginBottom: 8 },
  mapText: { fontSize: 16, fontWeight: '600', color: '#2D7D46' },
  mapSub: { fontSize: 13, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardSub: { fontSize: 13, color: '#888', marginTop: 4 },
});
