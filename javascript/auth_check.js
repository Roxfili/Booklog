import { createClient } from '@supabase/supabase-js';

const AUTH_URL = import.meta.env.VITE_SUPABASE_URL;
const AUTH_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const sbAuth = createClient(AUTH_URL, AUTH_KEY);

async function verifySession() {
    
    const isLoginPage = window.location.pathname.includes('index.html');
    try {
        const { data: { session }, error } = await sbAuth.auth.getSession();

        if (session && !error) {
            //console.log("Valid session:", session.user.email);
            
            if (isLoginPage) { //if already in login page -> home page
                window.location.replace('home.html');
                return;
            }
            
            document.documentElement.style.display = 'block';
        } else {
            
            if (!isLoginPage) {
                //console.warn("No access, back to login");
                window.location.replace('index.html');
            } else {
                //console.log("NO session but already in login page"); //otherwise goes into loop
                document.documentElement.style.display = 'block';
            }
        }
    } catch (err) {
        console.error("Authentication error", err);
        if (!isLoginPage) window.location.replace('index.html');
    }
}

verifySession();