import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ParcoursScreen() {
  const [parcours, setParcours] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function renderParcours({ item }) {
    return (
      <TouchableOpacity style={styles.card}>
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
      <Text style={styles.titre}>Parcours validés</Text>
      <Text style={styles.sousTitre}>Des balades adaptées et sécurisées</Text>
      <FlatList
        data={parcours}
        renderItem={renderParcours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F7F2',
  },
  titre: { fontSize: 26, fontWeight: 'bold', color: '#2D7D46' },
  sousTitre: { fontSize: 14, color: '#666', marginBottom: 16 },
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
});