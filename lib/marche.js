// lib/marche.js
// Gestion d'une séance de marche : enregistrement dans Supabase + calcul des points

import { supabase } from './supabase';

// Vérifie si l'utilisateur a déjà enregistré 2 marches aujourd'hui
// Renvoie true si la limite est atteinte
export async function limiteAtteinteAujourdhui(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('activites')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today);

  if (error) {
    console.log('Erreur vérification limite:', error.message);
    return false; // en cas d'erreur, on ne bloque pas
  }
  return data && data.length >= 2;
}

// Calcule les points selon la durée (même formule qu'ActivityScreen)
export function calculerPoints(dureeMinutes) {
  return dureeMinutes >= 30 ? 2 : 1;
}

// Enregistre une marche terminée dans Supabase
// Renvoie un objet { ok, points, message }
export async function enregistrerMarche(userId, dureeMinutes, pas) {
  // Vérifier la limite quotidienne
  const limiteAtteinte = await limiteAtteinteAujourdhui(userId);
  if (limiteAtteinte) {
    return {
      ok: false,
      points: 0,
      message: "Vous avez déjà enregistré 2 marches aujourd'hui.",
    };
  }

  const points = calculerPoints(dureeMinutes);

  const { error } = await supabase.from('activites').insert({
    user_id: userId,
    duree_minutes: dureeMinutes,
    pas: pas,
    points: points,
  });

  if (error) {
    console.log('Erreur enregistrement marche:', error.message);
    return {
      ok: false,
      points: 0,
      message: "L'enregistrement a échoué. Réessayez.",
    };
  }

  return {
    ok: true,
    points: points,
    message: `Marche enregistrée ! +${points} point(s).`,
  };
}