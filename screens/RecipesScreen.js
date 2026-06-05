import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function RecipesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👨‍🍳 Recettes adaptées</Text>

      <View style={styles.filterRow}>
        <View style={[styles.filter, styles.filterActive]}>
          <Text style={styles.filterTextActive}>Tous</Text>
        </View>
        <View style={styles.filter}>
          <Text style={styles.filterText}>Entrées</Text>
        </View>
        <View style={styles.filter}>
          <Text style={styles.filterText}>Plats</Text>
        </View>
        <View style={styles.filter}>
          <Text style={styles.filterText}>Desserts</Text>
        </View>
      </View>

      <View style={styles.recipeCard}>
        <View style={styles.recipeImg}>
          <Text style={styles.recipeEmoji}>🥗</Text>
        </View>
        <View style={styles.recipeBody}>
          <Text style={styles.recipeTitle}>Salade de lentilles au citron</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>⏱ 20 min</Text>
            <Text style={styles.tag}>IG 28</Text>
            <Text style={styles.tag}>320 kcal</Text>
          </View>
        </View>
      </View>

      <View style={styles.recipeCard}>
        <View style={[styles.recipeImg, styles.recipeImgBlue]}>
          <Text style={styles.recipeEmoji}>🐟</Text>
        </View>
        <View style={styles.recipeBody}>
          <Text style={styles.recipeTitle}>Pavé de saumon & quinoa</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>⏱ 30 min</Text>
            <Text style={styles.tag}>IG 35</Text>
            <Text style={styles.tag}>410 kcal</Text>
          </View>
        </View>
      </View>

      <View style={styles.recipeCard}>
        <View style={[styles.recipeImg, styles.recipeImgOrange]}>
          <Text style={styles.recipeEmoji}>🍎</Text>
        </View>
        <View style={styles.recipeBody}>
          <Text style={styles.recipeTitle}>Compote pomme-cannelle sans sucre</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>⏱ 15 min</Text>
            <Text style={styles.tag}>IG 40</Text>
            <Text style={styles.tag}>85 kcal</Text>
          </View>
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
