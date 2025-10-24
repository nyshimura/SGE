// src/views/auth.js

/**
 * Renderiza a tela de login.
 * @returns {string} O HTML da tela de login.
 */
export function renderLoginScreen() {
    return `
        <div class="auth-container">
            <h2>Login</h2>
            <form onsubmit="window.AppHandlers.handleLogin(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="auth-button">Entrar</button>
                <p class="error-message" id="login-error" style="margin-top: 1rem;"></p>
            </form>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                 <button class="link-button" onclick="window.AppHandlers.navigateTo('forgotPasswordRequest')">Esqueci minha senha</button>
                 <button class="link-button" onclick="window.AppHandlers.navigateTo('register')">Cadastre-se</button>
            </div>
        </div>
    `;
}

/**
 * Renderiza a tela de cadastro. (Verifique se o onsubmit aqui também está correto)
 * @returns {string} O HTML da tela de cadastro.
 */
export function renderRegisterScreen() {
    return `
         <div class="auth-container">
            <h2>Cadastro</h2>
            <form onsubmit="window.AppHandlers.handleRegister(event)">
                <div class="form-group">
                    <label for="name">Nome</label>
                    <input type="text" id="name" name="name" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="password">Senha (mínimo 6 caracteres)</label>
                    <input type="password" id="password" name="password" required autocomplete="new-password" minlength="6">
                </div>
                <button type="submit" class="auth-button">Cadastrar</button>
                <p class="error-message" id="register-error" style="margin-top: 1rem;"></p>
            </form>
            <p>Já tem uma conta? <button class="link-button" onclick="window.AppHandlers.navigateTo('login')">Faça login</button></p>
        </div>
    `;
}

/**
 * Renderiza a tela de solicitação de redefinição de senha. (Verifique onsubmit e onclick)
 * @returns {string} O HTML da tela.
 */
export function renderForgotPasswordRequestScreen() {
    return `
        <div class="auth-container">
            <h2>Esqueci Minha Senha</h2>
            <p>Digite seu e-mail abaixo. Se ele estiver cadastrado, enviaremos um link para você criar uma nova senha.</p>
            <form onsubmit="window.AppHandlers.handleForgotPasswordRequest(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="email">
                </div>
                <button type="submit" class="auth-button">Enviar Link de Redefinição</button>
                <p class="error-message" id="forgot-password-error" style="margin-top: 1rem;"></p>
            </form>
            <p><button class="link-button" onclick="window.AppHandlers.navigateTo('login')">Voltar para o Login</button></p>
        </div>
    `;
}

/**
 * Renderiza a tela para definir a nova senha. (Verifique onsubmit e onclick)
 * @param {string | null} token O token extraído da URL.
 * @returns {string} O HTML da tela.
 */
export function renderResetPasswordScreen(token) {
    if (!token) {
        return `
            <div class="auth-container">
                <h2>Link Inválido</h2>
                <p>O link para redefinição de senha é inválido ou expirou.</p>
                <p><button class="link-button" onclick="window.AppHandlers.navigateTo('forgotPasswordRequest')">Solicitar novo link</button></p>
                <p><button class="link-button" onclick="window.AppHandlers.navigateTo('login')">Voltar para o Login</button></p>
            </div>
        `;
    }

    return `
        <div class="auth-container">
            <h2>Criar Nova Senha</h2>
            <form onsubmit="window.AppHandlers.handleResetPassword(event)">
                <input type="hidden" name="token" value="${token}">
                <div class="form-group">
                    <label for="newPassword">Nova Senha (mínimo 6 caracteres)</label>
                    <input type="password" id="newPassword" name="newPassword" required autocomplete="new-password" minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Nova Senha</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password" minlength="6">
                </div>
                <button type="submit" class="auth-button">Redefinir Senha</button>
                <p class="error-message" id="reset-password-error" style="margin-top: 1rem;"></p>
            </form>
             <p><button class="link-button" onclick="window.AppHandlers.navigateTo('login')">Voltar para o Login</button></p>
        </div>
    `;
}