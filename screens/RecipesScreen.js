import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RecipesScreen({ navigation }) {
  const [recettes, setRecettes] = useState([]);
  const [categorieActive, setCategorieActive] = useState('Tous');
  const [userId, setUserId] = useState(null);
  // Likes par recette : { recetteId: { nb: 3, likeeParMoi: true } }
  const [likes, setLikes] = useState({});

  // "Mes favoris" est ajouté en 2e position
  const categories = ['Tous', '❤️ Mes favoris', 'Entrées', 'Plats', 'Desserts'];

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
    await getRecettes();
    if (user) await chargerLikes(user.id);
  }

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

  // Charge tous les likes : compteur par recette + ce que MOI j'ai liké
  async function chargerLikes(monId) {
    const { data, error } = await supabase
      .from('likes_recettes')
      .select('recette_id, user_id');

    if (error || !data) return;

    const compteur = {};
    data.forEach(like => {
      if (!compteur[like.recette_id]) {
        compteur[like.recette_id] = { nb: 0, likeeParMoi: false };
      }
      compteur[like.recette_id].nb += 1;
      if (like.user_id === monId) {
        compteur[like.recette_id].likeeParMoi = true;
      }
    });
    setLikes(compteur);
  }

  // Bascule le like d'une recette (approche optimiste)
  async function toggleLike(recetteId) {
    if (!userId) return;

    const actuel = likes[recetteId] || { nb: 0, likeeParMoi: false };

    if (actuel.likeeParMoi) {
      // Retirer mon like (optimiste)
      setLikes(prev => ({
        ...prev,
        [recetteId]: { nb: Math.max(0, actuel.nb - 1), likeeParMoi: false },
      }));

      const { error } = await supabase
        .from('likes_recettes')
        .delete()
        .eq('recette_id', recetteId)
        .eq('user_id', userId);

      if (error) {
        setLikes(prev => ({
          ...prev,
          [recetteId]: { nb: actuel.nb, likeeParMoi: true },
        }));
        Alert.alert('Oups', "Votre action n'a pas pu être enregistrée. Réessayez.");
      }
    } else {
      // Ajouter mon like (optimiste)
      setLikes(prev => ({
        ...prev,
        [recetteId]: { nb: actuel.nb + 1, likeeParMoi: true },
      }));

      const { error } = await supabase
        .from('likes_recettes')
        .insert({ recette_id: recetteId, user_id: userId });

      if (error) {
        setLikes(prev => ({
          ...prev,
          [recetteId]: { nb: actuel.nb, likeeParMoi: false },
        }));
        Alert.alert('Oups', "Votre action n'a pas pu être enregistrée. Réessayez.");
      }
    }
  }

  // Filtre les recettes selon le filtre actif
  let recettesFiltrees;
  if (categorieActive === 'Tous') {
    recettesFiltrees = recettes;
  } else if (categorieActive === '❤️ Mes favoris') {
    // On ne garde que les recettes que J'AI likées
    recettesFiltrees = recettes.filter(r => likes[r.id] && likes[r.id].likeeParMoi);
  } else {
    recettesFiltrees = recettes.filter(r => r.categorie === categorieActive);
  }

  // Couleur de fond de l'image selon la categorie
  function couleurImg(categorie) {
    if (categorie === 'Plats') return styles.recipeImgBlue;
    if (categorie === 'Desserts') return styles.recipeImgOrange;
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
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
      </ScrollView>

      {recettesFiltrees.length === 0 && categorieActive === '❤️ Mes favoris' ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore de recette favorite.{'\n'}Appuyez sur le ❤️ d'une recette pour l'ajouter ici !
          </Text>
        </View>
      ) : (
        recettesFiltrees.map(recette => {
          const infoLike = likes[recette.id] || { nb: 0, likeeParMoi: false };
          return (
            <View key={recette.id} style={styles.recipeCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('RecipeDetail', { recette })}>
                {recette.image_url ? (
                  <Image source={{ uri: recette.image_url }} style={styles.recipePhoto} />
                ) : (
                  <View style={[styles.recipeImg, couleurImg(recette.categorie)]}>
                    <Text style={styles.recipeEmoji}>{recette.emoji}</Text>
                  </View>
                )}
                <View style={styles.recipeBody}>
                  <Text style={styles.recipeTitle}>{recette.titre}</Text>
                  <View style={styles.tagRow}>
                    <Text style={styles.tag}>⏱ {recette.duree} min</Text>
                    <Text style={styles.tag}>IG {recette.ig}</Text>
                    <Text style={styles.tag}>{recette.calories} kcal</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Ligne Like */}
              <TouchableOpacity
                style={styles.likeRow}
                onPress={() => toggleLike(recette.id)}
                activeOpacity={0.7}>
                <Text style={styles.likeCoeur}>{infoLike.likeeParMoi ? '❤️' : '🤍'}</Text>
                <Text style={styles.likeNombre}>{infoLike.nb} j'aime</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    padding: 24,
    paddingTop: 20,
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
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
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
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
  recipePhoto: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
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
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  likeCoeur: { fontSize: 20, marginRight: 8 },
  likeNombre: { fontSize: 14, color: '#555', fontWeight: '600' },
});