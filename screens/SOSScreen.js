import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function SOSScreen() {
  const [contact, setContact] = useState('');
  const [tel, setTel] = useState('');

  useEffect(() => {
    chargerContact();
  }, []);

  async function chargerContact() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('contact_urgence, tel_urgence')
      .eq('id', user.id)
      .single();
    if (data) {
      setContact(data.contact_urgence || '');
      setTel(data.tel_urgence || '');
    }
  }

  async function sauverContact() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ contact_urgence: contact, tel_urgence: tel })
      .eq('id', user.id);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Enregistré', 'Contact d\'urgence sauvegardé.');
    }
  }

  async function declencherSOS() {
    if (!tel) {
      Alert.alert('Aucun contact', 'Renseigne d\'abord un numéro d\'urgence.');
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'La position GPS est nécessaire pour le SOS.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = pos.coords;
    const lien = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `URGENCE Movidia ! J'ai besoin d'aide. Ma position : ${lien}`;
    Linking.openURL(`sms:${tel}?body=${encodeURIComponent(message)}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titre}>Contact d'urgence</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du contact"
        value={contact}
        onChangeText={setContact}
      />
      <TextInput
        style={styles.input}
        placeholder="Numéro de téléphone"
        value={tel}
        onChangeText={setTel}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.btnSave} onPress={sauverContact}>
        <Text style={styles.btnSaveTxt}>Enregistrer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSOS} onPress={declencherSOS}>
        <Text style={styles.btnSOSTxt}>SOS</Text>
        <Text style={styles.btnSOSSub}>Envoyer ma position</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9', padding: 20, paddingTop: 60 },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16, marginTop: 20 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  btnSave: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 50 },
  btnSaveTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnSOS: { backgroundColor: '#D32F2F', borderRadius: 100, width: 180, height: 180, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  btnSOSTxt: { color: '#fff', fontWeight: 'bold', fontSize: 48 },
  btnSOSSub: { color: '#fff', fontSize: 13, marginTop: 4 },
});