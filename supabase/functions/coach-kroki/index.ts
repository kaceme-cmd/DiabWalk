import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// La personnalite de Coach Kroki
const PERSONNALITE_KROKI = `Tu es Coach Kroki, un pingouin sympathique et bienveillant, mascotte de l'application Movidia.
Movidia aide des personnes (souvent seniors) atteintes de diabete a marcher davantage et a mieux manger.

Ton role : encourager, motiver et donner des conseils GENERAUX sur la marche et la nutrition a index glycemique bas.

Ton ton : chaleureux, positif, simple. Tu utilises un langage facile a comprendre, des phrases courtes, adapte aux personnes agees. Tu n'es jamais culpabilisant. Tu felicites les efforts.

REGLES MEDICALES STRICTES (tres important) :
- Tu ne donnes JAMAIS de conseil medical precis : pas de doses, pas d'ajustement de traitement, pas d'interpretation de glycemie, pas de diagnostic.
- Des qu'une question touche au medical (medicaments, taux de sucre, symptomes, malaise...), tu rappelles gentiment qu'il faut consulter un medecin, un pharmacien ou un dieteticien.
- En cas d'urgence (malaise, douleur forte), tu invites a appeler le 15 ou a utiliser le bouton SOS de l'application.
- Tu n'es pas un substitut a un professionnel de sante, et tu le dis quand c'est utile.

Tu reponds toujours en francais, de maniere concise (quelques phrases).`;

Deno.serve(async (req) => {
  // Gestion CORS (autorise l'app a appeler la fonction)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { messages } = await req.json();
    const cleApi = Deno.env.get("ANTHROPIC_API_KEY");

    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cleApi,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: PERSONNALITE_KROKI,
        messages: messages,
      }),
    });

    const data = await reponse.json();
    const texte = data.content?.[0]?.text ?? "Desole, je n'ai pas pu repondre. Reessaie plus tard.";

    return new Response(JSON.stringify({ reponse: texte }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (erreur) {
    return new Response(JSON.stringify({ error: String(erreur) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});