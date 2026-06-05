import { StyleSheet, Text, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const MARCHEURS = [
  { id: 1, nom: 'Jean-Louis', distance: '1,2 km', niveau: 'Régulier', emoji: '🧑' },
  { id: 2, nom: 'Sylvie C.', distance: '2,8 km', niveau: 'Débutant', emoji: '👩' },
  { id: 3, nom: 'Robert P.', distance: '3,5 km', niveau: 'Confirmé', emoji: '👨' },
];

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Carte des marcheurs</Text>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapInner}>
          <View style={styles.pinMe}>
            <Text style={styles.pinMeText}>📍</Text>
            <Text style={styles.pinMeLabel}>Vous</Text>
          </View>
          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>📡 Rayon 5 km</Text>
          </View>
        </View>
      </View>
      <View style={styles.liste}>
        <Text style={styles.listeTitle}>Marcheurs à proximité</Text>
        {MARCHEURS.map(marcheur => (
          <View key={marcheur.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{marcheur.nom.charAt(0)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{marcheur.nom}</Text>
              <Text style={styles.cardSub}>📍 {marcheur.distance} · Niveau {marcheur.niveau}</Text>
            </View>
            <View style={styles.inviterBtn}>
              <Text style={styles.inviterText}>Inviter</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2' },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#2D7D46',
    padding: 24, paddingTop: 60, paddingBottom: 12,
  },
  mapPlaceholder: {
    width: width, height: height * 0.35,
    backgroundColor: '#E8F5EC', overflow: 'hidden',
  },
  mapInner: { flex: 1, position: 'relative' },
  pinMe: {
    position: 'absolute', top: '45%', left: '45%', alignItems: 'center',
  },
  pinMeText: { fontSize: 28 },
  pinMeLabel: {
    fontSize: 11, fontWeight: 'bold', color: '#2D7D46',
    backgroundColor: '#fff', paddingHorizontal: 6,
    borderRadius: 8, marginTop: 2,
  },
  mapLabel: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: '#fff', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  mapLabelText: { fontSize: 11, color: '#555' },
  liste: { padding: 16, flex: 1 },
  listeTitle: {
    fontSize: 12, fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E6F1FB', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#1A5C8A' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  inviterBtn: {
    borderWidth: 1.5, borderColor: '#2D7D46',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  inviterText: { fontSize: 12, color: '#2D7D46', fontWeight: '600' },
});