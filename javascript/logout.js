import { sbAuth } from './auth_check.js';
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
        
            const { error } = await sbAuth.auth.signOut();

            if (error) {
                console.error("Error logout:", error.message);
                alert("Error: " + error.message);
            } else {
                console.log("Logout successfull");
                
                localStorage.clear();
                
                window.location.replace('login.html');
            }
        });
    }
});