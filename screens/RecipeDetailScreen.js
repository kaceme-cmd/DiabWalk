import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function RecipeDetailScreen({ route }) {
  // On recupere la recette passee depuis l'ecran liste
  const { recette } = route.params;

  // On decoupe les ingredients et etapes (separes par des ;)
  const listeIngredients = recette.ingredients ? recette.ingredients.split(';') : [];
  const listeEtapes = recette.etapes ? recette.etapes.split(';') : [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{recette.emoji}</Text>
        <Text style={styles.titre}>{recette.titre}</Text>
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: { fontSize: 64, marginBottom: 12 },
  titre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D7D46',
    textAlign: 'center',
    marginBottom: 12,
  },
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