import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function NutritionScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🥗 Bons plans nutrition</Text>

      <Text style={styles.sectionLabel}>Produits à IG bas recommandés</Text>

      <View style={styles.productCard}>
        <View style={styles.igBadge}>
          <Text style={styles.igNum}>25</Text>
          <Text style={styles.igLbl}>IG</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>Lentilles vertes</Text>
          <Text style={styles.productSub}>IG bas · Riche en fibres</Text>
        </View>
        <Text style={styles.stars}>⭐⭐⭐</Text>
      </View>

      <View style={styles.productCard}>
        <View style={styles.igBadge}>
          <Text style={styles.igNum}>35</Text>
          <Text style={styles.igLbl}>IG</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>Pois chiches</Text>
          <Text style={styles.productSub}>IG bas · Protéines végétales</Text>
        </View>
        <Text style={styles.stars}>⭐⭐⭐</Text>
      </View>

      <View style={styles.productCard}>
        <View style={[styles.igBadge, styles.igMed]}>
          <Text style={styles.igNum}>52</Text>
          <Text style={styles.igLbl}>IG</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>Flocons d'avoine</Text>
          <Text style={styles.productSub}>IG modéré · Rassasiant</Text>
        </View>
        <Text style={styles.stars}>⭐⭐</Text>
      </View>

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
