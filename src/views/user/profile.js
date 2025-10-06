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
    
    const canEditField = (fieldName) => {
        if (isOwner) return true;
        if (isAdminViewer) {
            const value = userToView[fieldName];
            return value === undefined || value === null || value === '';
        }
        return false;
    };
    const isFieldDisabled = (fieldName) => !canEditField(fieldName);

    let enrollmentsHtml = '';
    if (isAdminViewer && userToView.role === 'student') {
        const enrollments = data.enrollments;
        enrollmentsHtml = `
            <h3 class="card-title">Matrículas</h3>
            ${enrollments.length === 0 ? '<p>Nenhuma matrícula encontrada.</p>' : `
                <ul class="list">
                    ${enrollments.map((e) => {
                        let actionButton = '';
                        if (e.status === 'Aprovada') {
                            actionButton = `<button class="action-button danger" onclick="window.handleCancelEnrollment(${userId}, ${e.courseId})">Trancar</button>`;
                        } else if (e.status === 'Cancelada') {
                            actionButton = `<button class="action-button" onclick="window.handleReactivateEnrollment(${userId}, ${e.courseId})">Reativar</button>`;
                        }

                        return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${e.courseName || 'Curso não encontrado'}</span>
                            </div>
                            <div class="list-item-actions">
                                <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>
                                ${actionButton}
                            </div>
                        </li>
                    `}).join('')}
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
                        <input type="file" id="profilePicture" name="profilePicture" accept="image/*" onchange="window.previewProfileImage(event)" ${isFieldDisabled('profilePicture') ? 'disabled' : ''}>
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
                    </div>
                     <div class="form-group">
                        <label for="address">Endereço</label>
                        <textarea id="address" name="address" rows="3" ${isFieldDisabled('address') ? 'disabled' : ''}>${userToView.address || ''}</textarea>
                    </div>

                    ${isOwner ? `<button type="submit" class="action-button">Salvar Alterações</button>`: ''}

                    <div class="admin-only-section">
                       ${enrollmentsHtml}
                       ${(userToView.role === 'student') ? renderStudentFinancialHistory(userId, data.payments, true, isAdminViewer) : ''}
                    </div>
                </div>
            </form>
            ${changePasswordForm}
        </div>
    `;
}