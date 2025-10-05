import { appState } from '../../state.js';
import { apiCall } from '../../api.js';

export async function renderSchoolProfileView() {
    if (!appState.currentUser || !(appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin')) {
        window.handleNavigateBackToDashboard();
        return '';
    }

    if (!appState.schoolProfile) {
        const data = await apiCall('getSchoolProfile', {}, 'GET');
        appState.schoolProfile = data.profile;
    }
    const profile = appState.schoolProfile;
    if (!profile) return '<h1>Erro ao carregar perfil da escola</h1>';

    const pixKeyTypes = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Aleatória'];

    return `
        <div class="view-header">
            <h2>Dados da Unidade de Ensino</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
             <form class="profile-form" onsubmit="window.handleUpdateSchoolProfile(event)">
                <div class="profile-pic-container">
                    <img id="school-pic-preview" class="profile-pic-preview" src="${profile.profilePicture || 'https://via.placeholder.com/150'}" alt="Logo da Escola">
                    <div class="form-group">
                        <label for="schoolProfilePicture">Alterar Logo</label>
                        <input type="file" id="schoolProfilePicture" name="schoolProfilePicture" accept="image/*" onchange="window.previewSchoolImage(event)">
                    </div>
                </div>

                <div class="profile-fields-container">
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="schoolName">Nome da Unidade</label>
                            <input type="text" id="schoolName" name="name" value="${profile.name}" required>
                        </div>
                         <div class="form-group">
                            <label for="cnpj">CNPJ</label>
                            <input type="text" id="cnpj" name="cnpj" value="${profile.cnpj}" required>
                        </div>
                         <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" value="${profile.phone}" required>
                        </div>
                    </div>
                     <div class="form-grid">
                        <div class="form-group">
                           <label for="pixKeyType">Tipo de Chave PIX</label>
                           <select id="pixKeyType" name="pixKeyType">
                             ${pixKeyTypes.map(type => `<option value="${type}" ${profile.pixKeyType === type ? 'selected' : ''}>${type}</option>`).join('')}
                           </select>
                        </div>
                         <div class="form-group">
                            <label for="pixKey">Chave PIX</label>
                            <input type="text" id="pixKey" name="pixKey" value="${profile.pixKey}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="schoolAddress">Endereço da Unidade</label>
                        <textarea id="schoolAddress" name="address" rows="3" required>${profile.address}</textarea>
                    </div>
                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
}
