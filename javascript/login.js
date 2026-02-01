import { sbAuth } from './auth_check.js';
const loginForm = document.querySelector('.login-form');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');
const formTitle = document.getElementById('form-title');
const funnyMessage = document.querySelector('h2');
const submitBtn = document.querySelector('.login-btn');

const emailGroup = document.getElementById('email-group');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const labelUsername = document.getElementById('label-username');

let isLoginMode = true;

if (toggleLink) {
    toggleLink.addEventListener('click', function(e) {
        e.preventDefault(); 
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            formTitle.innerText = "Welcome";
            funnyMessage.innerHTML = "Do I know You???? &#128530;";
            submitBtn.innerText = "Login";
            toggleText.innerText = "Don't have an account yet?";
            toggleLink.innerText = "Register";
            // Nascondi email e cambia label
            emailGroup.style.display = 'none';
            emailInput.required = false;
            labelUsername.innerText = "Username (or email)";
        } else {
            formTitle.innerText = "Join Us";
            funnyMessage.innerHTML = "Nice to meet you! &#128522;";
            submitBtn.innerText = "Create Account";
            toggleText.innerText = "Already one of us?";
            toggleLink.innerText = "Log in";
            // Mostra email e cambia label
            emailGroup.style.display = 'block';
            emailInput.required = true;
            labelUsername.innerText = "Choose Username";
        }
    });
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const identifier = usernameInput.value; // Sarà l'username o l'email
    const password = document.getElementById('password').value;
    const emailValue = emailInput.value; // Usato solo in registrazione

    submitBtn.disabled = true;
    submitBtn.innerText = "Wait...";

    try {
        if (isLoginMode) {
            // --- LOGIN ---
            let finalEmail = identifier;

            // if no @ -> username
            if (!identifier.includes('@')) {
                const { data, error } = await sbAuth
                    .from('Profiles')
                    .select('email')
                    .eq('username', identifier)
                    .maybeSingle();

                if (error || !data) throw new Error("Username not found!");
                finalEmail = data.email;
            }

            const { error } = await sbAuth.auth.signInWithPassword({ 
                email: finalEmail, 
                password 
            });
            if (error) throw error;
            
            window.location.href = 'home.html';
        } else {
            const { data, error } = await sbAuth.auth.signUp({ 
                email: emailValue, 
                password,
                options: {
                    data: { username: identifier } 
                }
            });
            if (error) throw error;
            
            alert("Registration successful! Check your email to confirm.");
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isLoginMode ? "Login" : "Create Account";
    }
});