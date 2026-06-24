import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function ParcoursScreen({ navigation }) {
  const [parcours, setParcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreDuree, setFiltreDuree] = useState('Tous');
  const [filtrePmr, setFiltrePmr] = useState(false);

  // Position de l'utilisateur et rayon de recherche
  const [position, setPosition] = useState(null);
  const [rayon, setRayon] = useState(20); // rayon par défaut : 20 km

  useEffect(() => {
    initialiser();
  }, []);

  // Récupère la position GPS puis charge les parcours
  async function initialiser() {
    // Demander la permission de localisation
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setPosition({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.log('Erreur position', e);
      }
    }
    chargerParcours();
  }

  async function chargerParcours() {
    const { data, error } = await supabase
      .from('parcours')
      .select('*')
      .order('duree', { ascending: true });

    if (error) {
      console.log('Erreur chargement parcours', error);
    } else {
      setParcours(data);
    }
    setLoading(false);
  }

  // Calcule la distance en km entre deux points GPS (formule de Haversine)
  function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Ajoute la distance à chaque parcours (si on connaît la position)
  const parcoursAvecDistance = parcours.map((p) => {
    if (position && p.latitude != null && p.longitude != null) {
      const d = calculerDistance(
        position.latitude,
        position.longitude,
        p.latitude,
        p.longitude
      );
      return { ...p, distanceUtilisateur: d };
    }
    return { ...p, distanceUtilisateur: null };
  });

  // Filtre : durée + PMR + rayon, puis tri par distance
  const parcoursFiltres = parcoursAvecDistance
    .filter((p) => {
      const okDuree = filtreDuree === 'Tous' || p.duree === parseInt(filtreDuree);
      const okPmr = !filtrePmr || p.accessible_pmr === true;
      // Filtre rayon : seulement si on connaît la position ET la distance du parcours
      const okRayon =
        !position ||
        p.distanceUtilisateur == null ||
        p.distanceUtilisateur <= rayon;
      return okDuree && okPmr && okRayon;
    })
    .sort((a, b) => {
      // Trier du plus proche au plus loin (les sans-distance à la fin)
      if (a.distanceUtilisateur == null) return 1;
      if (b.distanceUtilisateur == null) return -1;
      return a.distanceUtilisateur - b.distanceUtilisateur;
    });

  function renderParcours({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ParcoursDetail', { parcours: item })}>
        <Text style={styles.nom}>{item.nom}</Text>
        <Text style={styles.ville}>📍 {item.ville}</Text>

        {/* Distance par rapport à l'utilisateur */}
        {item.distanceUtilisateur != null && (
          <Text style={styles.distance}>
            🚶 à {item.distanceUtilisateur.toFixed(1)} km de vous
          </Text>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoBadge}>⏱️ {item.duree} min</Text>
          <Text style={styles.infoBadge}>📏 {item.distance} km</Text>
          <Text style={styles.infoBadge}>⛰️ {item.denivele}</Text>
        </View>

        <View style={styles.equipRow}>
          {item.accessible_pmr && <Text style={styles.equip}>♿ Accessible</Text>}
          {item.bancs && <Text style={styles.equip}>🪑 Bancs</Text>}
          {item.toilettes && <Text style={styles.equip}>🚻 Toilettes</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D7D46" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sousTitre}>Des balades adaptées et sécurisées</Text>

      {/* Filtres durée + PMR */}
      <View style={styles.filtreRow}>
        {['Tous', '15', '30'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filtreBtn, filtreDuree === option && styles.filtreBtnActif]}
            onPress={() => setFiltreDuree(option)}>
            <Text style={[styles.filtreText, filtreDuree === option && styles.filtreTextActif]}>
              {option === 'Tous' ? 'Tous' : option + ' min'}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.filtreBtn, filtrePmr && styles.filtreBtnActif]}
          onPress={() => setFiltrePmr(!filtrePmr)}>
          <Text style={[styles.filtreText, filtrePmr && styles.filtreTextActif]}>♿ PMR</Text>
        </TouchableOpacity>
      </View>

      {/* Filtre par rayon de distance */}
      <Text style={styles.rayonLabel}>Rayon de recherche :</Text>
      <View style={styles.filtreRow}>
        {[5, 10, 20, 50].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filtreBtn, rayon === option && styles.filtreBtnActif]}
            onPress={() => setRayon(option)}>
            <Text style={[styles.filtreText, rayon === option && styles.filtreTextActif]}>
              {option} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Message si la localisation n'est pas disponible */}
      {!position && (
        <Text style={styles.infoLoc}>
          📍 Activez la localisation pour voir les parcours près de chez vous.
        </Text>
      )}

      <FlatList
        data={parcoursFiltres}
        renderItem={renderParcours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.vide}>
            Aucun parcours dans un rayon de {rayon} km.{'\n'}Essayez d'élargir le rayon de recherche.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F7F2',
  },
  sousTitre: { fontSize: 14, color: '#666', marginBottom: 16, marginTop: 8 },
  filtreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  rayonLabel: { fontSize: 14, color: '#444', fontWeight: '600', marginBottom: 8 },
  filtreBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  filtreBtnActif: { backgroundColor: '#2D7D46', borderColor: '#2D7D46' },
  filtreText: { fontSize: 14, color: '#555', fontWeight: '500' },
  filtreTextActif: { color: '#fff' },
  infoLoc: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  nom: { fontSize: 17, fontWeight: '600', color: '#333' },
  ville: { fontSize: 14, color: '#666', marginTop: 2 },
  distance: { fontSize: 14, color: '#2D7D46', fontWeight: '600', marginTop: 4 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  infoBadge: {
    backgroundColor: '#E8F5EC',
    color: '#2D7D46',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 10 },
  equip: { fontSize: 13, color: '#555' },
  vide: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});