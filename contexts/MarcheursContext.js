import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const MarcheursContext = createContext();

export function MarcheursProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [marcheurs, setMarcheurs] = useState([]);
  const [chargement, setChargement] = useState(true);

  const chargerTout = async () => {
    setChargement(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setChargement(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      const { data, error } = await supabase.rpc('get_nearby_walkers', {
        ma_lat: loc.coords.latitude,
        ma_lon: loc.coords.longitude,
      });
      if (!error && data) setMarcheurs(data);
    } catch (e) {
      console.log('Erreur préchargement :', e.message);
    }
    setChargement(false);
  };

  useEffect(() => {
    chargerTout();
  }, []);

  return (
    <MarcheursContext.Provider
      value={{ location, marcheurs, chargement, rechargerTout: chargerTout }}>
      {children}
    </MarcheursContext.Provider>
  );
}

export function useMarcheurs() {
  return useContext(MarcheursContext);
}