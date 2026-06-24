// lib/meteo.js
// Vérification météo via Open-Meteo (gratuit, sans clé API)
// Alerte de bon sens en cas de forte chaleur ou de froid intense

// Seuils d'alerte
const SEUIL_CHALEUR = 32; // °C 
const SEUIL_FROID = 0;    // °C

// Récupère la température actuelle à une position donnée.
// Renvoie un objet { ok, temperature } ou { ok: false } en cas d'échec.
export async function getTemperature(latitude, longitude) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m`;

    const reponse = await fetch(url);
    if (!reponse.ok) {
      return { ok: false };
    }

    const data = await reponse.json();
    const temperature = data?.current?.temperature_2m;

    if (temperature === undefined || temperature === null) {
      return { ok: false };
    }

    return { ok: true, temperature };
  } catch (e) {
    console.log('Erreur météo:', e.message);
    return { ok: false };
  }
}

// Vérifie la météo et renvoie un message d'alerte si conditions extrêmes.
// Renvoie une chaîne (le message) ou null si tout va bien / météo indisponible.
export async function verifierMeteo(latitude, longitude) {
  const resultat = await getTemperature(latitude, longitude);
  if (!resultat.ok) {
    return null; // pas d'alerte si on n'a pas pu récupérer la météo
  }

  const temp = Math.round(resultat.temperature);

  if (temp >= SEUIL_CHALEUR) {
    return `🌡️ Forte chaleur aujourd'hui (${temp}°C). Pensez à bien vous hydrater, portez un chapeau et privilégiez l'ombre. Marchez de préférence aux heures fraîches.`;
  }

  if (temp <= SEUIL_FROID) {
    return `🥶 Froid intense aujourd'hui (${temp}°C). Couvrez-vous bien, protégez vos mains et votre visage, et adaptez votre rythme.`;
  }

  return null; // température normale, pas d'alerte
}