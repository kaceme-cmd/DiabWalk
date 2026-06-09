import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NutritionScreen() {
  const [aliments, setAliments] = useState([]);

  useEffect(() => {
    getAliments();
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

  // Genere les etoiles selon la note (ex. note 3 -> ⭐⭐⭐)
  function etoiles(note) {
    return '⭐'.repeat(note);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🥗 Bons plans nutrition</Text>

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

      <View style={styles.shopCard}>
        <Text style={styles.shopEmoji}>🏪</Text>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>Bio c'Bon Hayange</Text>
          <Text style={styles.productSub}>📍 800 m · Ouvert jusqu'à 19h</Text>
        </View>
      </View>

    </ScrollView>
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
});