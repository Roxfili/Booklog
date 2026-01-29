console.log("1. Lo script auth-check.js è stato caricato correttamente");
const AUTH_URL = "https://aiobatomkcovcgbcjuef.supabase.co";
const AUTH_KEY = "sb_publishable_qSEddXtkWGocCmpvVVFbHA_iHWIQynQ";
const sbAuth = supabase.createClient(AUTH_URL, AUTH_KEY);

async function verifySession() {
    console.log("2. Inizio verifica sessione...");
    try {
        const { data: { session }, error } = await sbAuth.auth.getSession();

        if (session && !error) {
            console.log("Sessione valida:", session.user.email);
            // Sblocchiamo la visibilità della pagina
            document.documentElement.style.display = 'block';
        } else {
            console.warn("Accesso negato. Torno al login...");
            window.location.replace('login.html');
        }
    } catch (err) {
        console.error("Errore nel controllo auth:", err);
        window.location.replace('login.html');
    }
}

// Eseguiamo subito
verifySession();