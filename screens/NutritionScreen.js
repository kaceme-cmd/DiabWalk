import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function NutritionScreen() {
  const [aliments, setAliments] = useState([]);
  const [commerces, setCommerces] = useState([]);

  useEffect(() => {
    getAliments();
    getCommerces();
  }, []);

  async function getAliments() {
    const { data, error } = await supabase
      .from('aliments')
      .select('*')
      .order('ig', { ascending: true });
    if (error) {
      console.log('Erreur chargement aliments:', error);
      return;
    }
    if (data) setAliments(data);
  }

  async function getCommerces() {
    // 1. Demander la permission de localisation
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission localisation refusée');
      return;
    }

    // 2. Récupérer la position de l'utilisateur
    const position = await Location.getCurrentPositionAsync({});
    const maLat = position.coords.latitude;
    const maLon = position.coords.longitude;

    // 3. Appeler la fonction qui renvoie les commerces triés par distance
    const { data, error } = await supabase.rpc('get_commerces_proches', {
      ma_lat: maLat,
      ma_lon: maLon,
    });
    if (error) {
      console.log('Erreur chargement commerces:', error);
      return;
    }
    if (data) setCommerces(data);
  }

  // Genere les etoiles selon la note (ex. note 3 -> ⭐⭐⭐)
  function etoiles(note) {
    return '⭐'.repeat(note);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Produits à IG bas recommandés</Text>

      {aliments.map(aliment => (
        <View key={aliment.id} style={styles.productCard}>
          <View style={[styles.igBadge, aliment.ig > 50 && styles.igMed]}>
            <Text style={styles.igNum}>{aliment.ig}</Text>
            <Text style={styles.igLbl}>IG</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{aliment.nom}</Text>
            <Text style={styles.productSub}>{aliment.description}</Text>
          </View>
          <Text style={styles.stars}>{etoiles(aliment.note)}</Text>
        </View>
      ))}

      <Text style={styles.sectionLabel}>Commerces près de vous</Text>

      {commerces.length === 0 ? (
        <Text style={styles.emptyText}>
          Aucun commerce à proximité pour le moment.
        </Text>
      ) : (
        commerces.map(commerce => (
          <View key={commerce.id} style={styles.shopCard}>
            <Text style={styles.shopEmoji}>🏪</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {commerce.nom}
                {commerce.sponsorise && (
                  <Text style={styles.partenaire}> · Partenaire</Text>
                )}
              </Text>
              <Text style={styles.productSub}>
                📍 {commerce.distance_km} km
                {commerce.horaires ? ` · ${commerce.horaires}` : ''}
              </Text>
            </View>
          </View>
        ))
      )}

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
    paddingTop: 20,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  igBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  igMed: { backgroundColor: '#FEF3E8' },
  igNum: { fontSize: 14, fontWeight: 'bold', color: '#2D7D46' },
  igLbl: { fontSize: 9, color: '#2D7D46' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333' },
  productSub: { fontSize: 12, color: '#888', marginTop: 2 },
  stars: { fontSize: 12 },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  shopEmoji: { fontSize: 28, marginRight: 12 },
  emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic' },
  partenaire: { fontSize: 12, color: '#2D7D46', fontWeight: '600' },
});