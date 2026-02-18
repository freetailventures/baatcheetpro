export function renderLanding(onLoginSuccess) {
    const container = document.getElementById('app');

    container.innerHTML = `
        <div class="landing-container">
            <div class="glass-card auth-box fade-in">
                <div class="logo-icon">🎙️</div>

                <h1>Yaha Baat Karo</h1>
                <p>Private Group Voice Chat</p>

                <form id="login-form">
                    <div class="input-wrapper">
                        <span class="input-icon">🔒</span>
                        <input
                            type="password"
                            id="password-input"
                            placeholder="Enter Password"
                            required
                            autocomplete="current-password"
                        />
                    </div>
                    <button type="submit" class="btn">
                        Enter App <span class="btn-icon">→</span>
                    </button>
                </form>
                <p id="error-msg" style="display: none; margin-top: 12px;"></p>
            </div>
        </div>
    `;

    const form = document.getElementById('login-form');
    const errMsg = document.getElementById('error-msg');

    form.addEventListener('submit', e => {
        e.preventDefault();
        const pass = document.getElementById('password-input').value;

        if (pass === 'jeetdalla') {
            onLoginSuccess();
        } else {
            errMsg.textContent = 'Wrong password, try again';
            errMsg.style.display = 'block';

            // Shake animation
            const authBox = container.querySelector('.auth-box');
            authBox.style.animation = 'none';
            void authBox.offsetWidth;
            authBox.style.animation = 'prankShake 0.4s ease';
            setTimeout(() => (authBox.style.animation = ''), 400);
        }
    });
}
