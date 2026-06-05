import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🚶</Text>
        <Text style={styles.title}>Movidia</Text>
        <Text style={styles.subtitle}>Marchons ensemble vers la santé</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>8 240</Text>
          <Text style={styles.statLbl}>pas aujourd'hui</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>3</Text>
          <Text style={styles.statLbl}>marcheurs proches</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Carte')}>
        <Text style={styles.buttonText}>🗺️ Trouver des marcheurs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonOutline}
        onPress={() => navigation.navigate('Nutrition')}>
        <Text style={styles.buttonOutlineText}>🥗 Bons plans nutrition</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#2D7D46', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 130,
    elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#2D7D46' },
  statLbl: { fontSize: 12, color: '#888', marginTop: 4 },
  button: {
    backgroundColor: '#2D7D46',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonOutline: {
    borderWidth: 2,
    borderColor: '#2D7D46',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  buttonOutlineText: { color: '#2D7D46', fontSize: 16, fontWeight: '600' },
});
