import { sbAuth } from './auth_check.js';
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            console.log("Tentativo di logout...");

            const { error } = await sbAuth.auth.signOut();

            if (error) {
                console.error("Errore durante il logout:", error.message);
                alert("Errore: " + error.message);
            } else {
                console.log("Logout effettuato con successo!");
                
                localStorage.clear();
                
                window.location.replace('login.html');
            }
        });
    }
});