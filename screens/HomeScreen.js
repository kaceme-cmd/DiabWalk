import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [prenom, setPrenom] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);
  const [pas, setPas] = useState(0);

  useEffect(() => {
    getProfile();
    saveLocation();

    let subscription;

    async function demarrerPodometre() {
      const dispo = await Pedometer.isAvailableAsync();
      if (!dispo) {
        console.log('Podometre non disponible sur cet appareil');
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Permission podometre refusee');
        return;
      }

      subscription = Pedometer.watchStepCount(result => {
        setPas(result.steps);
      });
    }

    demarrerPodometre();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('prenom')
        .eq('id', user.id)
        .single();
      if (data) setPrenom(data.prenom);
    }
  }

  async function saveLocation() {
    try {
      // 1. On s'assure qu'une session est bien active (pas juste un user en cache)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // pas de session prete -> on ne fait rien, sans erreur

      // 2. Permission de localisation
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // 3. Recuperation de la position
      let loc = await Location.getCurrentPositionAsync({});

      // 4. Mise a jour du profil (l'utilisateur est forcement celui de la session)
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
        .eq('id', session.user.id);

      // 5. En cas d'erreur, on log discretement SANS alerter l'utilisateur
      if (error) {
        console.log('Sauvegarde position differee:', error.message);
        return;
      }

      setLocationSaved(true);
    } catch (error) {
      console.log('Erreur position:', error);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnexion',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace('Auth');
          }
        }
      ]
    );
  }

  const distanceKm = (pas * 0.75 / 1000).toFixed(1);

  // Liste des tuiles du menu
  const tuiles = [
    { nom: 'Parcours', emoji: '🚶', ecran: 'Parcours' },
    { nom: 'Mon activité', emoji: '🏆', ecran: 'Activite' },
    { nom: 'Marcher ensemble', emoji: '👥', ecran: 'Buddy' },
    { nom: 'Carte', emoji: '🗺️', ecran: 'Carte' },
    { nom: 'Nutrition', emoji: '🥗', ecran: 'Nutrition' },
    { nom: 'Recettes', emoji: '👨‍🍳', ecran: 'Recettes' },
    { nom: 'Profil', emoji: '👤', ecran: 'Profil' },
    { nom: 'Coach Kroki', image: true, ecran: 'Coach' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Movidia</Text>
        {prenom ? (
          <Text style={styles.welcome}>Bonjour {prenom} !</Text>
        ) : (
          <Text style={styles.subtitle}>Marchons ensemble vers la sante</Text>
        )}
        {locationSaved && (
          <Text style={styles.locationBadge}>Position partagee</Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pas.toLocaleString()}</Text>
          <Text style={styles.statLbl}>pas (depuis ouverture)</Text>
          <Text style={styles.statDistance}>{distanceKm} km</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>3</Text>
          <Text style={styles.statLbl}>marcheurs proches</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {tuiles.map((tuile) => (
          <TouchableOpacity
            key={tuile.ecran}
            style={styles.tuile}
            onPress={() => navigation.navigate(tuile.ecran)}>
            <View style={styles.tuileIcone}>
              {tuile.image ? (
                <Image source={require('../assets/kroki.png')} style={styles.tuileImage} />
              ) : (
                <Text style={styles.tuileEmoji}>{tuile.emoji}</Text>
              )}
            </View>
            <Text style={styles.tuileTexte}>{tuile.nom}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btnSOS}
        onPress={() => navigation.navigate('SOS')}>
        <Text style={styles.btnSOSText}>🆘  SOS Urgence</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Deconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 36, fontWeight: 'bold', color: '#2D7D46', marginBottom: 8 },
  welcome: { fontSize: 18, color: '#2D7D46', fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  locationBadge: {
    fontSize: 12, color: '#2D7D46', marginTop: 8,
    backgroundColor: '#E8F5EC', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20,
  },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
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
  statDistance: { fontSize: 14, color: '#2D7D46', fontWeight: '600', marginTop: 6 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  tuile: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '47%',
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tuileIcone: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tuileEmoji: { fontSize: 44 },
  tuileImage: { width: 65, height: 65, resizeMode: 'contain' },
  tuileTexte: { fontSize: 17, fontWeight: '600', color: '#333' },
  btnSOS: {
    backgroundColor: '#D32F2F',
    borderRadius: 20,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  btnSOSText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { paddingVertical: 16, marginTop: 8 },
  logoutText: { fontSize: 14, color: '#888' },
});