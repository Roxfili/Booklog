import { createClient } from '@supabase/supabase-js';

const AUTH_URL = import.meta.env.VITE_SUPABASE_URL;
const AUTH_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const sbAuth = createClient(AUTH_URL, AUTH_KEY);

async function verifySession() {
    
    const isLoginPage = window.location.pathname.includes('login.html');
    try {
        const { data: { session }, error } = await sbAuth.auth.getSession();

        if (session && !error) {
            console.log("Sessione valida:", session.user.email);
            
            // Se sono al login ma ho già una sessione, portami alla home
            if (isLoginPage) {
                window.location.replace('home.html');
                return;
            }
            
            document.documentElement.style.display = 'block';
        } else {
            // SE NON C'È SESSIONE:
            // Mi sposto al login SOLO se non sono già lì
            if (!isLoginPage) {
                console.warn("Accesso negato. Torno al login...");
                window.location.replace('index.html');
            } else {
                console.log("Nessuna sessione, ma siamo già al login. Tutto ok.");
                document.documentElement.style.display = 'block';
            }
        }
    } catch (err) {
        console.error("Errore nel controllo auth:", err);
        if (!isLoginPage) window.location.replace('login.html');
    }
}

// Eseguiamo subito
verifySession();