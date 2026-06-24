import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function NutritionScreen() {
  const [aliments, setAliments] = useState([]);
  const [commerces, setCommerces] = useState([]);
  const [ongletActif, setOngletActif] = useState('Aliments');
  const [recherche, setRecherche] = useState('');

  // Onglet Produits (Open Food Facts)
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [produits, setProduits] = useState([]);
  const [chargementProduits, setChargementProduits] = useState(false);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);

  const onglets = ['Aliments', 'Produits', 'Commerces'];

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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission localisation refusée');
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    const maLat = position.coords.latitude;
    const maLon = position.coords.longitude;

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

  function etoiles(note) {
    return '⭐'.repeat(note);
  }

  function normaliser(texte) {
    return (texte || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  const alimentsFiltres = aliments.filter(aliment => {
    if (!recherche.trim()) return true;
    const texteRecherche = normaliser(recherche);
    const nom = normaliser(aliment.nom);
    const description = normaliser(aliment.description);
    return nom.includes(texteRecherche) || description.includes(texteRecherche);
  });

  // Recherche de produits via l'API Open Food Facts
  async function rechercherProduits() {
    if (!rechercheProduit.trim()) return;

    setChargementProduits(true);
    setRechercheEffectuee(true);
    setProduits([]);

    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(rechercheProduit)}&json=1&page_size=20&fields=product_name,brands,nutriscore_grade,image_small_url`;
      const reponse = await fetch(url);
      const data = await reponse.json();

      if (data && data.products) {
        // On ne garde que les produits qui ont au moins un nom
        const produitsValides = data.products.filter(p => p.product_name && p.product_name.trim().length > 0);
        setProduits(produitsValides);
      } else {
        setProduits([]);
      }
    } catch (e) {
      console.log('Erreur Open Food Facts:', e);
      setProduits([]);
    } finally {
      setChargementProduits(false);
    }
  }

  // Couleur du badge Nutri-Score selon la note
  function couleurNutriscore(grade) {
    switch ((grade || '').toLowerCase()) {
      case 'a': return '#1E8F4E';
      case 'b': return '#7DC243';
      case 'c': return '#F0C30F';
      case 'd': return '#E8851A';
      case 'e': return '#E2231A';
      default: return '#BBBBBB';
    }
  }

  return (
    <View style={styles.container}>
      {/* Barre d'onglets */}
      <View style={styles.tabsRow}>
        {onglets.map(onglet => (
          <TouchableOpacity
            key={onglet}
            style={[styles.tab, ongletActif === onglet && styles.tabActive]}
            onPress={() => setOngletActif(onglet)}>
            <Text style={[styles.tabText, ongletActif === onglet && styles.tabTextActive]}>
              {onglet}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ONGLET ALIMENTS */}
        {ongletActif === 'Aliments' && (
          <>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un aliment..."
                placeholderTextColor="#999"
                value={recherche}
                onChangeText={setRecherche}
              />
              {recherche.length > 0 && (
                <TouchableOpacity onPress={() => setRecherche('')}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionLabel}>Produits à IG bas recommandés</Text>

            {alimentsFiltres.length === 0 ? (
              <Text style={styles.emptyText}>
                Aucun aliment ne correspond à votre recherche.
              </Text>
            ) : (
              alimentsFiltres.map(aliment => (
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
              ))
            )}
          </>
        )}

        {/* ONGLET PRODUITS (Open Food Facts) */}
        {ongletActif === 'Produits' && (
          <>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Nom d'un produit (ex: yaourt nature)"
                placeholderTextColor="#999"
                value={rechercheProduit}
                onChangeText={setRechercheProduit}
                onSubmitEditing={rechercherProduits}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity style={styles.searchBtn} onPress={rechercherProduits}>
              <Text style={styles.searchBtnText}>Rechercher</Text>
            </TouchableOpacity>

            {chargementProduits && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2D7D46" />
                <Text style={styles.loadingText}>Recherche en cours...</Text>
              </View>
            )}

            {!chargementProduits && rechercheEffectuee && produits.length === 0 && (
              <Text style={styles.emptyText}>
                Aucun produit trouvé. Vérifiez l'orthographe ou essayez un autre nom.
              </Text>
            )}

            {!chargementProduits && produits.map((produit, index) => (
              <View key={index} style={styles.produitCard}>
                {produit.image_small_url ? (
                  <Image source={{ uri: produit.image_small_url }} style={styles.produitImg} />
                ) : (
                  <View style={styles.produitImgVide}>
                    <Text style={styles.produitImgVideText}>🛒</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{produit.product_name}</Text>
                  {produit.brands ? (
                    <Text style={styles.productSub}>{produit.brands}</Text>
                  ) : null}
                </View>
                <View style={[styles.nutriBadge, { backgroundColor: couleurNutriscore(produit.nutriscore_grade) }]}>
                  <Text style={styles.nutriText}>
                    {produit.nutriscore_grade ? produit.nutriscore_grade.toUpperCase() : '?'}
                  </Text>
                </View>
              </View>
            ))}

            {/* Mention indicative */}
            {rechercheEffectuee && produits.length > 0 && (
              <Text style={styles.mention}>
                Le Nutri-Score est un indicateur nutritionnel général. Il ne reflète pas l'index glycémique ni l'impact sur votre glycémie. Demandez conseil à votre médecin ou diététicien.
              </Text>
            )}

            <Text style={styles.creditsOff}>Données : Open Food Facts</Text>
          </>
        )}

        {/* ONGLET COMMERCES */}
        {ongletActif === 'Commerces' && (
          <>
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
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2D7D46',
  },
  tabText: { fontSize: 13, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
    elevation: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 10,
  },
  searchClear: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
  searchBtn: {
    backgroundColor: '#2D7D46',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  loadingBox: { alignItems: 'center', padding: 30 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 12 },
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
  produitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  produitImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  produitImgVide: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  produitImgVideText: { fontSize: 20 },
  nutriBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  nutriText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mention: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  creditsOff: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 8,
  },
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
  bientotBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    marginTop: 20,
  },
  bientotEmoji: { fontSize: 40, marginBottom: 12 },
  bientotTitre: { fontSize: 18, fontWeight: 'bold', color: '#2D7D46', marginBottom: 8 },
  bientotTexte: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});