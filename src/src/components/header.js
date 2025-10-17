/**
 * Renderiza o cabeçalho da aplicação.
 * @param {HTMLElement} headerElement O elemento do cabeçalho.
 * @param {object} appState O estado global da aplicação.
 */
export function renderHeader(headerElement, appState) {
    if (!headerElement || !appState.schoolProfile) return;
    
    const logoHtml = appState.schoolProfile.profilePicture
        ? `<img src="${appState.schoolProfile.profilePicture}" alt="Logo da Escola" class="header-logo">`
        : `<span class="logo-icon">🎨</span>`;

    let headerContent = `
        <div class="header-content">
            <h1>${logoHtml} ${appState.schoolProfile.name}</h1>
        </div>`;

    if (appState.currentUser) {
        const { currentUser } = appState;
        const isSuperAdmin = currentUser.role === 'superadmin';
        const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
        headerContent = `
            <div class="header-content">
                <h1>${logoHtml} ${appState.schoolProfile.name}</h1>
                <div class="user-info">
                    <span>Olá, ${currentUser.firstName}!</span>
                    <button class="action-button secondary" onclick="window.handleNavigateToProfile(${currentUser.id})">Meu Perfil</button>
                    ${isAdmin ? `<button class="action-button secondary" onclick="window.handleNavigateToSchoolProfile()">Dados da UE</button>` : ''}
                    ${isSuperAdmin ? `<button class="action-button secondary" onclick="window.handleNavigateToSystemSettings()">Configurações</button>` : ''}
                    <button onclick="window.handleLogout()" class="logout-button">Sair</button>
                </div>
            </div>
        `;
    }
    headerElement.innerHTML = headerContent;
}