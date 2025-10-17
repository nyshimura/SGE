/**
 * Renderiza a tela de login.
 * @returns {string} O HTML da tela de login.
 */
export function renderLoginScreen() {
    return `
        <div class="auth-container">
            <h2>Login</h2>
            <form onsubmit="window.handleLogin(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="auth-button">Entrar</button>
            </form>
            <p>Não tem uma conta? <button class="link-button" onclick="window.navigateTo('register')">Cadastre-se</button></p>
        </div>
    `;
}

/**
 * Renderiza a tela de cadastro.
 * @returns {string} O HTML da tela de cadastro.
 */
export function renderRegisterScreen() {
    return `
         <div class="auth-container">
            <h2>Cadastro</h2>
            <form onsubmit="window.handleRegister(event)">
                <div class="form-group">
                    <label for="name">Nome</label>
                    <input type="text" id="name" name="name" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required autocomplete="new-password">
                </div>
                <button type="submit" class="auth-button">Cadastrar</button>
            </form>
            <p>Já tem uma conta? <button class="link-button" onclick="window.navigateTo('login')">Faça login</button></p>
        </div>
    `;
}
