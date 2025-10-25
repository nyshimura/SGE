// src/views/user/profile.js
import { apiCall } from '../../api.js'; // Ajuste o caminho se necessário
import { appState } from '../../state.js'; // Ajuste o caminho se necessário
import { renderStudentFinancialHistory } from '../financial/history.js'; // Ajuste o caminho se necessário

// <<< ADICIONADO: Função helper para calcular idade >>>
function calculateAge(birthDateString) {
    if (!birthDateString) return ''; // Retorna vazio se não houver data
    try {
        const birthDate = new Date(birthDateString);
        // Corrige possível problema de fuso horário ao pegar partes da data
        const birthYear = birthDate.getUTCFullYear();
        const birthMonth = birthDate.getUTCMonth();
        const birthDay = birthDate.getUTCDate();

        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();

        let age = todayYear - birthYear;

        // Ajusta a idade se o aniversário ainda não ocorreu este ano
        if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
            age--;
        }
        return age >= 0 ? age : ''; // Retorna a idade ou vazio se data futura/inválida
    } catch (e) {
        console.error("Erro ao calcular idade:", e);
        return ''; // Retorna vazio em caso de erro
    }
}

// <<< ADICIONADO: Expondo a função ao escopo global para o 'onchange' inline >>>
window.calculateAge = calculateAge;


export async function renderProfileView(userId) {
     let data;
     try {
         data = await apiCall('getProfileData', { userId }, 'GET');
         if (!data || !data.user) throw new Error("Dados do usuário não encontrados.");
     } catch(e) { /* ... tratamento de erro ... */ }

    const userToView = data.user;
    if (!userToView) { /* ... tratamento de erro ... */ }

    const isOwner = appState.currentUser.id === userId;
    const isAdminViewer = (appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin') && !isOwner;
    const today = new Date().toISOString().split('T')[0];

    const isFieldDisabled = (fieldName) => !isOwner && !isAdminViewer;

    // <<< ADICIONADO: Calcula a idade aqui >>>
    // (Usando 'birthDate' que é o nome do campo no seu 1º arquivo)
    const calculatedAge = calculateAge(userToView.birthDate); 

    // --- HTML para Matrículas (Admin View) ---
    let enrollmentsHtml = '';
    // ... (código das matrículas inalterado, copiado do seu 1º arquivo) ...
    if (isAdminViewer && userToView.role === 'student') {
        const enrollments = data.enrollments || [];
        enrollmentsHtml = `<h3 class="card-title">Matrículas</h3> ${enrollments.length === 0 ? '<p>Nenhuma matrícula.</p>' : `<ul class="list">${enrollments.map((e) => { let actionButton = ''; if (e.status === 'Aprovada') { actionButton = `<button type="button" class="action-button danger" onclick="window.AppHandlers.handleCancelEnrollment(${userId}, ${e.courseId})">Trancar</button>`; } else if (e.status === 'Cancelada') { actionButton = `<button type="button" class="action-button" onclick="window.AppHandlers.handleReactivateEnrollment(${userId}, ${e.courseId})">Reativar</button>`; } else if (e.status === 'Pendente') { actionButton = `<form class="enrollment-approval-form" onsubmit="window.AppHandlers.handleApproveEnrollment(event)" data-student-id="${userId}" data-course-id="${e.courseId}" style="display:inline-flex; gap: 0.5rem; align-items:center;"> <select name="billingStart" required style="padding: 0.4rem;"> <option value="this_month">Mês Atual</option> <option value="next_month">Próx. Mês</option> </select> <input type="number" step="0.01" name="overrideFee" placeholder="Mensalidade (opc.)" style="width: 100px; padding: 0.4rem;" value="${e.customMonthlyFee !== null ? e.customMonthlyFee : ''}"> <button type="submit" class="action-button">Aprovar</button> </form>`; } let certificateForm = ''; if (e.status === 'Aprovada') { const course = appState.courses.find(c => c.id === e.courseId); const defaultCarga = course?.carga_horaria || ''; certificateForm = `<div class="admin-only-section" style="padding-top: 1rem; margin-top: 1rem; border-top: 1px dashed var(--border-color);"><h4 style="margin-top:0; margin-bottom: 1rem;">Gerar Certificado Individual</h4><form onsubmit="window.AppHandlers.handleGenerateCertificate(event, ${userId}, ${e.courseId})"><div class="profile-grid" style="gap: 0.5rem 1rem;"><div class="form-group"> <label for="completionDate-${e.courseId}">Data Conclusão</label> <input type="date" id="completionDate-${e.courseId}" name="completionDate" value="${today}" required> </div><div class="form-group"> <label for="overrideCarga-${e.courseId}">Carga Horária (Opc.)</label> <input type="text" id="overrideCarga-${e.courseId}" name="overrideCargaHoraria" placeholder="Padrão: ${defaultCarga || 'N/A'}"> </div></div><button type="submit" class="action-button secondary" style="margin-top: 0.5rem;">Gerar PDF</button></form></div>`; } return `<li class="list-item"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 1rem;"><span class="list-item-title">${e.courseName || 'Curso?'}</span><div class="list-item-actions"> <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span> ${actionButton} </div></div><div class="profile-grid"><div class="form-group"> <label for="scholarship-${e.courseId}">Bolsa (%)</label> <input type="number" id="scholarship-${e.courseId}" name="scholarshipPercentage" min="0" max="100" step="0.01" value="${e.scholarshipPercentage || '0'}"> </div><div class="form-group"> <label for="customFee-${e.courseId}">Mensalidade (R$)</label> <input type="number" id="customFee-${e.courseId}" name="customMonthlyFee" min="0" step="0.01" placeholder="Padrão" value="${e.customMonthlyFee !== null ? e.customMonthlyFee : ''}"> </div></div><button type="button" class="action-button secondary" onclick="window.AppHandlers.handleUpdateEnrollmentDetails(event, ${userId}, ${e.courseId})">Salvar Matrícula</button><p class="error-message" id="enrollment-details-error-${e.courseId}"></p>${certificateForm}</li>` }).join('')}</ul>` }`;
    }

    // --- HTML para Alterar Senha (Owner View) ---
    const changePasswordForm = isOwner ? `
        <div class="admin-only-section">
            
            <h3 class="card-title">Alterar Senha</h3><form onsubmit="window.AppHandlers.handleChangePassword(event)"><input type="hidden" name="userId" value="${userId}"><div class="form-group"><label for="currentPassword">Senha Atual</label><input type="password" id="currentPassword" name="currentPassword" required autocomplete="current-password"></div><div class="profile-grid"><div class="form-group"><label for="newPassword">Nova Senha</label><input type="password" id="newPassword" name="newPassword" required autocomplete="new-password" minlength="6"></div><div class="form-group"><label for="confirmPassword">Confirmar Nova Senha</label><input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password" minlength="6"></div></div><p class="error-message" id="change-password-error" style="text-align: left;"></p><button type="submit" class="action-button secondary">Alterar Senha</button></form>
        </div>
    ` : '';

    // --- HTML Principal da View ---
    return `
        <div class="view-header">
            <h2>Perfil de ${userToView.firstName} ${userToView.lastName || ''}</h2>
            <button class="action-button secondary back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="card full-width profile-card">
            <form class="profile-form" onsubmit="window.AppHandlers.handleUpdateProfile(event)">
                <input type="hidden" name="userId" value="${userId}">
                <input type="hidden" id="removeProfilePicture" name="removeProfilePicture" value="false">

                <div class="profile-main-section">
                    <div class="profile-pic-container">
                        <img id="profile-pic-preview" class="profile-pic-preview" src="${userToView.profilePicture || 'assets/default-user.png'}" alt="Foto de Perfil">
                        ${isOwner || isAdminViewer ? `
                            <div class="form-group">
                                <label for="profilePictureInput" class="action-button file-label">Alterar Foto</label>
                                <input type="file" id="profilePictureInput" name="profilePicture" accept="image/*" onchange="window.AppHandlers.previewImage(event, 'profile-pic-preview')" style="display: none;">
                            </div>
                            <button type="button" class="action-button secondary remove-pic-button" onclick="window.AppHandlers.removeProfileImage()">Remover Foto</button>
                        ` : ''}
                    </div>

                    <div class="profile-fields-container">
                        <h3 class="card-title">Dados Pessoais</h3>

                        
                        <div class="profile-grid">
                            <div class="form-group">
                                <label for="firstName">Nome</label>
                                <input type="text" id="firstName" name="firstName" value="${userToView.firstName || ''}" ${isFieldDisabled('firstName') ? 'disabled' : ''} required>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Sobrenome</label>
                                <input type="text" id="lastName" name="lastName" value="${userToView.lastName || ''}" ${isFieldDisabled('lastName') ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" name="email" value="${userToView.email || ''}" disabled>
                            </div>
                            <div class="form-group">
                                <label for="cpf">CPF</label>
                                <input type="text" id="cpf" name="cpf" value="${userToView.cpf || ''}" ${isFieldDisabled('cpf') ? 'disabled' : ''}>
                            </div>

                            
                            <div class="form-group">
                                <label for="birthDate">Data de Nascimento</label>
                                <input 
                                    type="date" 
                                    id="birthDate" 
                                    name="birthDate" 
                                    value="${userToView.birthDate || ''}" 
                                    ${isFieldDisabled('birthDate') ? 'disabled' : ''}
                                    onchange="document.getElementById('age').value = window.calculateAge(this.value)"
                                >
                            </div>
                            <div class="form-group">
                                <label for="age">Idade</label>
                                <input 
                                    type="number" 
                                    id="age" 
                                    name="age" 
                                    value="${calculatedAge}" 
                                    readonly 
                                    tabindex="-1"
                                    style="background-color: var(--input-background); cursor: not-allowed;"
                                >
                            </div>
                            
                            
                            <div class="form-group">
                                <label for="rg">RG</label>
                                <input type="text" id="rg" name="rg" value="${userToView.rg || ''}" ${isFieldDisabled('rg') ? 'disabled' : ''}>
                            </div>
                        </div>
                        

                        <div class="form-group">
                            <label for="address">Endereço</label>
                            <textarea id="address" name="address" rows="3" ${isFieldDisabled('address') ? 'disabled' : ''}>${userToView.address || ''}</textarea>
                        </div>

                        
                        ${(userToView.role === 'student') ? `
                            <div class="guardian-section">
                                <h3 class="card-title">Dados do Responsável</h3>
                                <div class="profile-grid">
                                    
                                    <div class="form-group"><label for="guardianName">Nome Responsável</label><input type="text" id="guardianName" name="guardianName" value="${userToView.guardianName || ''}" ${isFieldDisabled('guardianName') ? 'disabled' : ''}></div>
                                    <div class="form-group"><label for="guardianEmail">Email Responsável</label><input type="email" id="guardianEmail" name="guardianEmail" value="${userToView.guardianEmail || ''}" ${isFieldDisabled('guardianEmail') ? 'disabled' : ''}></div>
                                    <div class="form-group"><label for="guardianRG">RG Responsável</label><input type="text" id="guardianRG" name="guardianRG" value="${userToView.guardianRG || ''}" ${isFieldDisabled('guardianRG') ? 'disabled' : ''}></div>
                                    <div class="form-group"><label for="guardianCPF">CPF Responsável</label><input type="text" id="guardianCPF" name="guardianCPF" value="${userToView.guardianCPF || ''}" ${isFieldDisabled('guardianCPF') ? 'disabled' : ''}></div>
                                    <div class="form-group"><label for="guardianPhone">Telefone Responsável</label><input type="tel" id="guardianPhone" name="guardianPhone" value="${userToView.guardianPhone || ''}" ${isFieldDisabled('guardianPhone') ? 'disabled' : ''}></div>
                                </div>
                            </div>
                        ` : ''}

                        <p class="error-message" id="profile-update-error" style="text-align: left; margin-top: 1rem; color: var(--danger-color); font-weight: bold;"></p>
                        <p class="success-message" id="profile-update-success" style="text-align: left; margin-top: 1rem; color: var(--success-color); font-weight: bold;"></p>
                        ${isOwner || isAdminViewer ? `<button type="submit" class="action-button primary" style="margin-top: 1.5rem;">Salvar Alterações</button>` : ''}
                    </div>
                </div>
            </form>

            
            ${(isAdminViewer && userToView.role === 'student') ? `<div class="admin-only-section enrollment-section"> ${enrollmentsHtml} </div>` : ''}
            ${(isAdminViewer && userToView.role === 'student') ? `<div class="admin-only-section financial-history-section"> ${renderStudentFinancialHistory(userId, data.payments || [], true, true)} </div>` : ''}
            ${(isOwner && userToView.role === 'student') ? `<div class="financial-history-section"> ${renderStudentFinancialHistory(userId, data.payments || [], false, false)} </div>` : ''}
            ${changePasswordForm}
        </div>
    `;
}