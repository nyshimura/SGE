import { apiCall } from '../../api.js';
import { appState } from '../../state.js';
import { renderStudentFinancialHistory } from '../financial/history.js';

export async function renderProfileView(userId) {
    const data = await apiCall('getProfileData', { userId }, 'GET');
    const userToView = data.user;

    if (!userToView || !appState.currentUser) {
        window.handleNavigateBackToDashboard();
        return '';
    }

    const isOwner = appState.currentUser.id === userId;
    const isAdminViewer = (appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin') && !isOwner;
    
    const isFieldDisabled = (fieldName) => !isOwner && !isAdminViewer;

    let enrollmentsHtml = '';
    if (isAdminViewer && userToView.role === 'student') {
        const enrollments = data.enrollments;
        enrollmentsHtml = `
            <h3 class="card-title">Matrículas</h3>
            ${enrollments.length === 0 ? '<p>Nenhuma matrícula encontrada.</p>' : `
                <ul class="list">
                    ${enrollments.map((e) => {
                        // Ações foram movidas para a tela de detalhes do curso
                        return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${e.courseName || 'Curso não encontrado'}</span>
                            </div>
                            <div class="list-item-actions">
                                <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>
                            </div>
                        </li>
                        `
                    }).join('')}
                </ul>
            `}
        `;
    }

    const changePasswordForm = isOwner ? `
        <div class="admin-only-section">
            <h3 class="card-title">Alterar Senha</h3>
            <form onsubmit="window.handleChangePassword(event)">
                 <input type="hidden" name="userId" value="${userId}">
                 <div class="form-group">
                    <label for="currentPassword">Senha Atual</label>
                    <input type="password" id="currentPassword" name="currentPassword" required autocomplete="current-password">
                </div>
                <div class="profile-grid">
                    <div class="form-group">
                        <label for="newPassword">Nova Senha</label>
                        <input type="password" id="newPassword" name="newPassword" required autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmar Nova Senha</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password">
                    </div>
                </div>
                <button type="submit" class="action-button secondary">Alterar Senha</button>
            </form>
        </div>
    ` : '';

    return `
        <div class="view-header">
            <h2>Perfil de ${userToView.firstName} ${userToView.lastName || ''}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <form class="profile-form" onsubmit="window.handleUpdateProfile(event)">
                <input type="hidden" name="userId" value="${userId}">
                <div class="profile-pic-container">
                    <img id="profile-pic-preview" class="profile-pic-preview" src="${userToView.profilePicture || 'https://via.placeholder.com/150'}" alt="Foto do Perfil">
                    <div class="form-group">
                        <label for="profilePicture">Alterar Foto de Perfil</label>
                        <input type="file" id="profilePicture" name="profilePicture" accept="image/*" onchange="window.previewProfileImage(event)">
                    </div>
                </div>

                <div class="profile-fields-container">
                    <h3 class="card-title">Dados Pessoais</h3>
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="firstName">Nome</label>
                            <input type="text" id="firstName" name="firstName" value="${userToView.firstName || ''}" ${isFieldDisabled('firstName') ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Sobrenome</label>
                            <input type="text" id="lastName" name="lastName" value="${userToView.lastName || ''}" ${isFieldDisabled('lastName') ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="age">Idade</label>
                            <input type="number" id="age" name="age" value="${userToView.age || ''}" ${isFieldDisabled('age') ? 'disabled' : ''}>
                        </div>
                         <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${userToView.email}" disabled>
                        </div>
                         <div class="form-group">
                            <label for="rg">RG</label>
                            <input type="text" id="rg" name="rg" value="${userToView.rg || ''}" ${isFieldDisabled('rg') ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="cpf">CPF</label>
                            <input type="text" id="cpf" name="cpf" value="${userToView.cpf || ''}" ${isFieldDisabled('cpf') ? 'disabled' : ''}>
                        </div>
                    </div>
                     <div class="form-group">
                        <label for="address">Endereço</label>
                        <textarea id="address" name="address" rows="3" ${isFieldDisabled('address') ? 'disabled' : ''}>${userToView.address || ''}</textarea>
                    </div>

                    <div class="admin-only-section">
                        <h3 class="card-title">Dados do Responsável (se menor de 18)</h3>
                        <div class="profile-grid">
                            <div class="form-group">
                                <label for="guardianName">Nome do Responsável</label>
                                <input type="text" id="guardianName" name="guardianName" value="${userToView.guardianName || ''}" ${isFieldDisabled('guardianName') ? 'disabled' : ''}>
                            </div>
                             <div class="form-group">
                                <label for="guardianEmail">Email do Responsável</label>
                                <input type="email" id="guardianEmail" name="guardianEmail" value="${userToView.guardianEmail || ''}" ${isFieldDisabled('guardianEmail') ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="guardianRG">RG do Responsável</label>
                                <input type="text" id="guardianRG" name="guardianRG" value="${userToView.guardianRG || ''}" ${isFieldDisabled('guardianRG') ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="guardianCPF">CPF do Responsável</label>
                                <input type="text" id="guardianCPF" name="guardianCPF" value="${userToView.guardianCPF || ''}" ${isFieldDisabled('guardianCPF') ? 'disabled' : ''}>
                            </div>
                             <div class="form-group">
                                <label for="guardianPhone">Telefone do Responsável</label>
                                <input type="tel" id="guardianPhone" name="guardianPhone" value="${userToView.guardianPhone || ''}" ${isFieldDisabled('guardianPhone') ? 'disabled' : ''}>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="action-button" style="margin-top: 1.5rem;">Salvar Alterações do Perfil</button>
                </div>
            </form>
            
            <div class="admin-only-section">
                ${enrollmentsHtml}
            </div>
            
            <div class="admin-only-section">
                ${(userToView.role === 'student') ? renderStudentFinancialHistory(userId, data.payments, true, isAdminViewer) : ''}
            </div>

            ${changePasswordForm}
        </div>
    `;
}