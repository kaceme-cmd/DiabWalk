import { StyleSheet, Text, View, Image } from 'react-native';

export default function EvenementsScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/kroki.png')} style={styles.kroki} />
      <Text style={styles.titre}>Événements à proximité</Text>
      <Text style={styles.bientot}>Bientôt disponible !</Text>
      <Text style={styles.texte}>
        Vous pourrez bientôt découvrir les marches collectives, sorties et rendez-vous organisés près de chez vous, et y participer.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  kroki: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  titre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D7D46',
    marginBottom: 12,
    textAlign: 'center',
  },
  bientot: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E07B2A',
    marginBottom: 16,
  },
  texte: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});