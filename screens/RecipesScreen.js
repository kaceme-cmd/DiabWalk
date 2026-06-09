import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RecipesScreen({ navigation }) {
  const [recettes, setRecettes] = useState([]);
  const [categorieActive, setCategorieActive] = useState('Tous');

  const categories = ['Tous', 'Entrées', 'Plats', 'Desserts'];

  useEffect(() => {
    getRecettes();
  }, []);

  async function getRecettes() {
    const { data, error } = await supabase
      .from('recettes')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.log('Erreur chargement recettes:', error);
      return;
    }
    if (data) setRecettes(data);
  }

  // Filtre les recettes selon la categorie active
  const recettesFiltrees = categorieActive === 'Tous'
    ? recettes
    : recettes.filter(r => r.categorie === categorieActive);

  // Couleur de fond de l'image selon la categorie
  function couleurImg(categorie) {
    if (categorie === 'Plats') return styles.recipeImgBlue;
    if (categorie === 'Desserts') return styles.recipeImgOrange;
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👨‍🍳 Recettes adaptées</Text>

      <View style={styles.filterRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filter, categorieActive === cat && styles.filterActive]}
            onPress={() => setCategorieActive(cat)}>
            <Text style={categorieActive === cat ? styles.filterTextActive : styles.filterText}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {recettesFiltrees.map(recette => (
        <TouchableOpacity
          key={recette.id}
          style={styles.recipeCard}
          onPress={() => navigation.navigate('RecipeDetail', { recette })}>
          <View style={[styles.recipeImg, couleurImg(recette.categorie)]}>
            <Text style={styles.recipeEmoji}>{recette.emoji}</Text>
          </View>
          <View style={styles.recipeBody}>
            <Text style={styles.recipeTitle}>{recette.titre}</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>⏱ {recette.duree} min</Text>
              <Text style={styles.tag}>IG {recette.ig}</Text>
              <Text style={styles.tag}>{recette.calories} kcal</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterActive: {
    backgroundColor: '#2D7D46',
    borderColor: '#2D7D46',
  },
  filterText: { fontSize: 13, color: '#888' },
  filterTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  recipeImg: {
    height: 80,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeImgBlue: { backgroundColor: '#E6F1FB' },
  recipeImgOrange: { backgroundColor: '#FEF3E8' },
  recipeEmoji: { fontSize: 36 },
  recipeBody: { padding: 12 },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tag: {
    fontSize: 11,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    color: '#666',
  },
});