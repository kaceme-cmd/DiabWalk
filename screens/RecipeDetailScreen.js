import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RecipeDetailScreen({ route }) {
  // On recupere la recette passee depuis l'ecran liste
  const { recette } = route.params;

  // On decoupe les ingredients et etapes (separes par des ;)
  const listeIngredients = recette.ingredients ? recette.ingredients.split(';') : [];
  const listeEtapes = recette.etapes ? recette.etapes.split(';') : [];

  // États du like
  const [estLikee, setEstLikee] = useState(false);   // est-ce que MOI je l'ai likée ?
  const [nbLikes, setNbLikes] = useState(0);          // nombre total de likes
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    chargerLikes();
  }, []);

  async function chargerLikes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // 1. Compter le nombre total de likes pour cette recette
    const { count } = await supabase
      .from('likes_recettes')
      .select('*', { count: 'exact', head: true })
      .eq('recette_id', recette.id);
    setNbLikes(count || 0);

    // 2. Vérifier si MOI j'ai déjà liké cette recette
    const { data: monLike } = await supabase
      .from('likes_recettes')
      .select('id')
      .eq('recette_id', recette.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setEstLikee(!!monLike);
  }

  // Bascule le like (approche optimiste : on met à jour l'affichage tout de suite)
  async function toggleLike() {
    if (!userId) return;

    if (estLikee) {
      // J'avais liké → je retire mon like
      // Mise à jour optimiste immédiate
      setEstLikee(false);
      setNbLikes(prev => Math.max(0, prev - 1));

      const { error } = await supabase
        .from('likes_recettes')
        .delete()
        .eq('recette_id', recette.id)
        .eq('user_id', userId);

      // Si erreur, on annule la mise à jour optimiste
      if (error) {
        setEstLikee(true);
        setNbLikes(prev => prev + 1);
        Alert.alert('Oups', "Votre action n'a pas pu être enregistrée. Réessayez.");
      }
    } else {
      // Je n'avais pas liké → j'ajoute mon like
      // Mise à jour optimiste immédiate
      setEstLikee(true);
      setNbLikes(prev => prev + 1);

      const { error } = await supabase
        .from('likes_recettes')
        .insert({ recette_id: recette.id, user_id: userId });

      // Si erreur, on annule la mise à jour optimiste
      if (error) {
        setEstLikee(false);
        setNbLikes(prev => Math.max(0, prev - 1));
        Alert.alert('Oups', "Votre action n'a pas pu être enregistrée. Réessayez.");
      }
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {recette.image_url ? (
          // Si la recette a une photo, on l'affiche en grand
          <Image source={{ uri: recette.image_url }} style={styles.photo} />
        ) : (
          // Sinon, on garde l'emoji (secours)
          <Text style={styles.emoji}>{recette.emoji}</Text>
        )}
        <Text style={styles.titre}>{recette.titre}</Text>

        {/* Bouton Like + compteur */}
        <TouchableOpacity style={styles.likeRow} onPress={toggleLike} activeOpacity={0.7}>
          <Text style={styles.likeCoeur}>{estLikee ? '❤️' : '🤍'}</Text>
          <Text style={styles.likeNombre}>
            {nbLikes} {nbLikes > 1 ? "j'aime" : "j'aime"}
          </Text>
        </TouchableOpacity>

        <View style={styles.tagRow}>
          <Text style={styles.tag}>⏱ {recette.duree} min</Text>
          <Text style={styles.tag}>IG {recette.ig}</Text>
          <Text style={styles.tag}>{recette.calories} kcal</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      {listeIngredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.ingredientText}>{ingredient}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Préparation</Text>
      {listeEtapes.map((etape, index) => (
        <View key={index} style={styles.etapeRow}>
          <View style={styles.etapeNum}>
            <Text style={styles.etapeNumText}>{index + 1}</Text>
          </View>
          <Text style={styles.etapeText}>{etape}</Text>
        </View>
      ))}

      <View style={{ height: 40 }} />
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
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: { fontSize: 64, marginBottom: 12 },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  titre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D7D46',
    textAlign: 'center',
    marginBottom: 12,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 1,
  },
  likeCoeur: { fontSize: 22, marginRight: 8 },
  likeNombre: { fontSize: 15, color: '#555', fontWeight: '600' },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    fontSize: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    color: '#2D7D46',
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  etapeRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  etapeNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2D7D46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  etapeNumText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  etapeText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
    lineHeight: 22,
  },
});