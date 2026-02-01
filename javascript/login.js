import { sbAuth } from './auth_check.js';
// 2. Selezione elementi
const loginForm = document.querySelector('.login-form');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');
const formTitle = document.getElementById('form-title');
const funnyMessage = document.querySelector('h2');
const submitBtn = document.querySelector('.login-btn');

let isLoginMode = true;

// 3. Gestione del Toggle (Registrati / Accedi)
if (toggleLink) {
    toggleLink.addEventListener('click', function(e) {
        e.preventDefault(); // BLOCCA IL RICARICAMENTO
        e.stopPropagation(); // BLOCCA ALTRI EVENTI
        
        isLoginMode = !isLoginMode;
        console.log("Modalità Login:", isLoginMode);

        if (isLoginMode) {
            formTitle.innerText = "Welcome";
            funnyMessage.innerHTML = "Do I know You???? &#128530;";
            submitBtn.innerText = "Login";
            toggleText.innerText = "Don't have an account yet?";
            toggleLink.innerText = "Register";
        } else {
            formTitle.innerText = "Join Us";
            funnyMessage.innerHTML = "Nice to meet you! &#128522;";
            submitBtn.innerText = "Create Account";
            toggleText.innerText = "Already one of us?";
            toggleLink.innerText = "Log in";
    
        }
    });
}

// 4. Gestione Invio Form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // BLOCCA IL RICARICAMENTO DEL FORM
    
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.innerText = "Attendere...";

    try {
        if (isLoginMode) {
            const { data, error } = await sbAuth.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            window.location.href = 'home.html';
        } else {
            const { data, error } = await sbAuth.auth.signUp({ email, password });
            if (error) throw error;
            alert("Registrazione effettuata! Controlla l'email.");
            if (data.user && data.session) {
                window.location.href = 'home.html';
            }
        }
    } catch (err) {
        alert("Errore: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isLoginMode ? "Accedi" : "Crea Account";
    }
});