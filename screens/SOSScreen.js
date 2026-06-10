import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking, SafeAreaView, Modal } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function SOSScreen() {
  const [contact, setContact] = useState('');
  const [tel, setTel] = useState('');
  const [contact2, setContact2] = useState('');
  const [tel2, setTel2] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    chargerContact();
  }, []);

  async function chargerContact() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('contacts_urgence')
      .select('contact_urgence, tel_urgence, contact_urgence_2, tel_urgence_2')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setContact(data.contact_urgence || '');
      setTel(data.tel_urgence || '');
      setContact2(data.contact_urgence_2 || '');
      setTel2(data.tel_urgence_2 || '');
    }
  }

  async function sauverContact() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('contacts_urgence')
      .upsert({
        user_id: user.id,
        contact_urgence: contact,
        tel_urgence: tel,
        contact_urgence_2: contact2,
        tel_urgence_2: tel2,
      }, { onConflict: 'user_id' });
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Enregistré', 'Contacts d\'urgence sauvegardés.');
    }
  }

  function envoyerSMS(numero) {
    if (!position) return;
    const lien = `https://maps.google.com/?q=${position.latitude},${position.longitude}`;
    const message = `URGENCE Movidia ! J'ai besoin d'aide. Ma position : ${lien}`;
    setModalVisible(false);
    Linking.openURL(`sms:${numero}?body=${encodeURIComponent(message)}`);
  }

  async function declencherSOS() {
    if (!tel && !tel2) {
      Alert.alert('Aucun contact', 'Renseigne d\'abord au moins un numéro d\'urgence.');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'La position GPS est nécessaire pour le SOS.');
      return;
    }

    const pos = await Location.getCurrentPositionAsync({});
    setPosition(pos.coords);

    // Un seul contact : on l'utilise directement
    if (tel && !tel2) {
      const lien = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      const message = `URGENCE Movidia ! J'ai besoin d'aide. Ma position : ${lien}`;
      Linking.openURL(`sms:${tel}?body=${encodeURIComponent(message)}`);
      return;
    }
    if (!tel && tel2) {
      const lien = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      const message = `URGENCE Movidia ! J'ai besoin d'aide. Ma position : ${lien}`;
      Linking.openURL(`sms:${tel2}?body=${encodeURIComponent(message)}`);
      return;
    }

    // Deux contacts : on ouvre la fenêtre de choix
    setModalVisible(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titre}>Premier contact d'urgence</Text>

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

      <Text style={styles.titre}>Deuxième contact d'urgence</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du contact"
        value={contact2}
        onChangeText={setContact2}
      />
      <TextInput
        style={styles.input}
        placeholder="Numéro de téléphone"
        value={tel2}
        onChangeText={setTel2}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.btnSave} onPress={sauverContact}>
        <Text style={styles.btnSaveTxt}>Enregistrer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSOS} onPress={declencherSOS}>
        <Text style={styles.btnSOSTxt}>SOS</Text>
        <Text style={styles.btnSOSSub}>Envoyer ma position</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFond}>
          <View style={styles.modalBoite}>
            <Text style={styles.modalTitre}>Qui prévenir ?</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={() => envoyerSMS(tel)}>
              <Text style={styles.modalBtnTxt}>{contact || 'Contact 1'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalBtn} onPress={() => envoyerSMS(tel2)}>
              <Text style={styles.modalBtnTxt}>{contact2 || 'Contact 2'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalAnnuler} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalAnnulerTxt}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9', padding: 20, paddingTop: 60 },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16, marginTop: 10 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  btnSave: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 30 },
  btnSaveTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnSOS: { backgroundColor: '#D32F2F', borderRadius: 100, width: 180, height: 180, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  btnSOSTxt: { color: '#fff', fontWeight: 'bold', fontSize: 48 },
  btnSOSSub: { color: '#fff', fontSize: 13, marginTop: 4 },
  modalFond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBoite: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' },
  modalTitre: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 24 },
  modalBtn: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 14 },
  modalBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  modalAnnuler: { padding: 14, alignItems: 'center', marginTop: 4 },
  modalAnnulerTxt: { color: '#888', fontSize: 16 },
});