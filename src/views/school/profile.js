// src/views/school/profile.js
import { appState } from '../../state.js';
import { apiCall } from '../../api.js';

export async function renderSchoolProfileView() {
    if (!appState.currentUser || !(appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin')) {
        window.AppHandlers.handleNavigateBackToDashboard(); // Usa handler global
        return '';
    }

    if (!appState.schoolProfile) {
        try {
            const data = await apiCall('getSchoolProfile', {}, 'GET');
            appState.schoolProfile = data.profile;
        } catch (e) {
             console.error("Erro ao carregar perfil da escola:", e);
             return `<div class="view-header"><h2>Erro ao carregar</h2><button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button></div><p>Não foi possível carregar os dados.</p>`;
        }
    }
    const profile = appState.schoolProfile;
    if (!profile) return '<h1>Erro ao carregar perfil da escola</h1>'; // Fallback

    const pixKeyTypes = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Aleatória'];

    return `
        <div class="view-header">
            <h2>Dados da Unidade de Ensino</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
             <form class="profile-form" onsubmit="window.AppHandlers.handleUpdateSchoolProfile(event)">
                <div class="profile-pic-container">
                    <img id="school-pic-preview" class="profile-pic-preview" src="${profile.profilePicture || 'https://via.placeholder.com/150'}" alt="Logo da Escola">
                    <div class="form-group">
                        <label for="schoolProfilePicture">Alterar Logo</label>
                        <input type="file" id="schoolProfilePicture" name="schoolProfilePicture" accept="image/*" onchange="window.AppHandlers.previewSchoolImage(event)">
                    </div>
                </div>

                <div class="profile-fields-container">
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="schoolName">Nome da Unidade</label>
                            <input type="text" id="schoolName" name="name" value="${profile.name || ''}" required>
                        </div>
                         <div class="form-group">
                            <label for="cnpj">CNPJ</label>
                            <input type="text" id="cnpj" name="cnpj" value="${profile.cnpj || ''}" required>
                        </div>
                         <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" value="${profile.phone || ''}" required>
                        </div>
                    </div>
                     <div class="form-grid">
                        <div class="form-group">
                           <label for="pixKeyType">Tipo de Chave PIX</label>
                           <select id="pixKeyType" name="pixKeyType">
                             <option value="">Selecione</option>
                             ${pixKeyTypes.map(type => `<option value="${type}" ${profile.pixKeyType === type ? 'selected' : ''}>${type}</option>`).join('')}
                           </select>
                        </div>
                         <div class="form-group">
                            <label for="pixKey">Chave PIX</label>
                            <input type="text" id="pixKey" name="pixKey" value="${profile.pixKey || ''}">
                        </div>
                    </div>
                    <div class="profile-grid" style="grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                       <div class="form-group">
                           <label for="schoolCity">Cidade</label>
                           <input type="text" id="schoolCity" name="schoolCity" value="${profile.schoolCity || ''}">
                       </div>
                       <div class="form-group">
                         <label for="state">Estado (UF)</label>
                         <input type="text" id="state" name="state" value="${profile.state || ''}" maxlength="2">
                       </div>
                    </div>

                    <div class="form-group">
                        <label for="schoolAddress">Endereço da Unidade</label>
                        <textarea id="schoolAddress" name="address" rows="3" required>${profile.address || ''}</textarea>
                    </div>

                    <h3 class="card-title" style="margin-top: 2rem;">Carimbo / Assinatura Digital (para Recibos)</h3>

                    <div class="profile-pic-container" style="align-items: flex-start; border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px;">
                        <div style="width: 100%; text-align: center;">
                             <img id="signature-preview" style="max-width: 150px; max-height: 100px; object-fit: contain;" src="${profile.signatureImage || 'https://via.placeholder.com/150/f3f4f6/4b5563?text=Nenhuma+Assinatura'}" alt="Assinatura Digital">
                        </div>
                        <div class="form-group" style="width: 100%;">
                            <label for="signatureImage">Substituir Carimbo/Assinatura (PNG Transparente recomendado)</label>
                            <input type="file" id="signatureImage" name="signatureImage" accept="image/png, image/jpeg, image/gif" onchange="window.AppHandlers.previewSignatureImage(event)">
                        </div>
                    </div>
                    <p class="error-message" id="school-profile-error"></p>
                    <button type="submit" class="action-button" style="margin-top: 2rem;">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
}