import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function ParcoursDetailScreen({ route, navigation }) {
  const { parcours } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.retour} onPress={() => navigation.goBack()}>
        <Text style={styles.retourText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.nom}>{parcours.nom}</Text>
      <Text style={styles.ville}>📍 {parcours.ville}</Text>

      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoValeur}>⏱️ {parcours.duree}</Text>
          <Text style={styles.infoLabel}>minutes</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValeur}>📏 {parcours.distance}</Text>
          <Text style={styles.infoLabel}>km</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValeur}>⛰️</Text>
          <Text style={styles.infoLabel}>{parcours.denivele}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitre}>À propos de ce parcours</Text>
      <Text style={styles.description}>{parcours.description}</Text>

      <Text style={styles.sectionTitre}>Équipements</Text>
      <View style={styles.equipList}>
        <Text style={styles.equipItem}>
          {parcours.accessible_pmr ? '✅' : '❌'} Accessible aux personnes à mobilité réduite
        </Text>
        <Text style={styles.equipItem}>
          {parcours.bancs ? '✅' : '❌'} Bancs pour se reposer
        </Text>
        <Text style={styles.equipItem}>
          {parcours.toilettes ? '✅' : '❌'} Toilettes à proximité
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  retour: { marginBottom: 16 },
  retourText: { fontSize: 16, color: '#2D7D46', fontWeight: '600' },
  nom: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  ville: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  infoValeur: { fontSize: 18, fontWeight: 'bold', color: '#2D7D46' },
  infoLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  sectionTitre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 20,
  },
  equipList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  equipItem: { fontSize: 15, color: '#444' },
});