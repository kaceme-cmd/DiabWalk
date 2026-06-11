import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ParcoursScreen({ navigation }) {
  const [parcours, setParcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreDuree, setFiltreDuree] = useState('Tous');
  const [filtrePmr, setFiltrePmr] = useState(false);

  useEffect(() => {
    chargerParcours();
  }, []);

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

  const parcoursFiltres = parcours.filter((p) => {
    const okDuree = filtreDuree === 'Tous' || p.duree === parseInt(filtreDuree);
    const okPmr = !filtrePmr || p.accessible_pmr === true;
    return okDuree && okPmr;
  });

  function renderParcours({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ParcoursDetail', { parcours: item })}>
        <Text style={styles.nom}>{item.nom}</Text>
        <Text style={styles.ville}>📍 {item.ville}</Text>

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

      <FlatList
        data={parcoursFiltres}
        renderItem={renderParcours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.vide}>Aucun parcours ne correspond à ces filtres.</Text>
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
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  equip: { fontSize: 13, color: '#555' },
  vide: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});