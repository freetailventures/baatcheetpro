// ============================================
// Landing Page — Password Gate
// ============================================
// This is the first page users see.
// They must enter the correct password to proceed.

import { database, ref, get } from '../firebase.js';

/**
 * Render the landing page
 * @param {Function} onSuccess - Called when password is correct, navigates to lobby
 */
export function renderLanding(onSuccess) {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="landing-page">
      <div class="landing-container">
        <div class="landing-logo">🎙️</div>
        <h1 class="landing-title">Yaha Baat Karo</h1>
        <p class="landing-subtitle">Enter the password to join the conversation</p>
        
        <form class="landing-form" id="passwordForm">
          <div class="password-wrapper">
            <input 
              type="password" 
              class="input-field" 
              id="passwordInput" 
              placeholder="Enter password..." 
              autocomplete="off"
              autofocus
            />
            <button type="button" class="password-toggle" id="togglePassword" aria-label="Toggle password visibility">
              👁️
            </button>
          </div>
          <div class="error-msg" id="errorMsg">
            <span>⚠️</span>
            <span id="errorText">Wrong password. Try again!</span>
          </div>
          <button type="submit" class="btn btn-primary" id="enterBtn">
            Enter the Room →
          </button>
        </form>
        
        <p class="landing-footer">🔒 Password protected group voice chat</p>
      </div>
    </div>
  `;

    // --- Event Listeners ---

    const form = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePassword');
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const enterBtn = document.getElementById('enterBtn');

    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    // Clear error when typing
    passwordInput.addEventListener('input', () => {
        errorMsg.classList.remove('visible');
        passwordInput.classList.remove('error');
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const enteredPassword = passwordInput.value.trim();

        if (!enteredPassword) {
            showError('Please enter a password');
            return;
        }

        // Disable button and show loading state
        enterBtn.disabled = true;
        enterBtn.innerHTML = '<div class="spinner"></div> Checking...';

        try {
            // Check password against Firebase
            const passwordRef = ref(database, 'config/password');
            const snapshot = await get(passwordRef);

            if (snapshot.exists()) {
                const correctPassword = snapshot.val();

                if (enteredPassword === correctPassword) {
                    // ✅ Correct password!
                    sessionStorage.setItem('ybk_authenticated', 'true');
                    onSuccess();
                } else {
                    // ❌ Wrong password
                    showError('Wrong password. Try again!');
                    passwordInput.classList.add('error');
                    document.querySelector('.landing-container').classList.add('animate-shake');
                    setTimeout(() => {
                        document.querySelector('.landing-container')?.classList.remove('animate-shake');
                    }, 500);
                }
            } else {
                // No password set in Firebase yet
                showError('App not configured. Contact the admin.');
            }
        } catch (error) {
            console.error('Error checking password:', error);
            showError('Connection error. Please try again.');
        } finally {
            enterBtn.disabled = false;
            enterBtn.innerHTML = 'Enter the Room →';
        }
    });

    function showError(message) {
        errorText.textContent = message;
        errorMsg.classList.add('visible');
    }
}
