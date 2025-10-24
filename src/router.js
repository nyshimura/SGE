// src/router.js
import { apiCall } from './api.js';
import { appState } from './state.js';

// Importações (garanta que todas estejam aqui)
import { renderHeader } from './components/header.js';
import { renderPixPaymentModal } from './components/pixModal.js';
import { renderEnrollmentModal } from './components/enrollmentModal.js';
import { renderLoginScreen, renderRegisterScreen, renderForgotPasswordRequestScreen, renderResetPasswordScreen } from './views/auth.js';
import { renderProfileView } from './views/user/profile.js';
import { renderSchoolProfileView } from './views/school/profile.js';
import { renderEditCourseView } from './views/course/edit.js';
import { renderCourseDetailsView } from './views/course/details.js';
import { renderAttendanceManagementView } from './views/course/attendance.js';
import { renderFinancialControlPanelView } from './views/financial/controlPanel.js';
import { renderFinancialDashboardView } from './views/financial/dashboard.js';
import { renderDefaultersReportView } from './views/financial/defaultersReport.js';
import { renderDocumentTemplatesView } from './views/school/documentTemplates.js';
import { renderCertificateTemplateView } from './views/school/certificateTemplate.js';
import { renderSystemSettingsView } from './views/school/settings.js';
import { renderUserManagementView } from './views/user/management.js';
import { renderCreateCourseView } from './views/course/create.js';
import { applyCardOrder } from './utils/helpers.js';
// Importa o renderDashboard de main.js
import { renderDashboard } from './views/dashboard/main.js';

const appRoot = document.getElementById('app-root');
const appHeader = document.getElementById('app-header');

/**
 * Função de renderização principal
 */
export async function render() {
    // 1. Carrega perfil da escola (se não carregado)
    if (!appState.schoolProfile) {
        try {
            const data = await apiCall('getSchoolProfile', {}, 'GET');
            if (!data || !data.profile) throw new Error("Resposta inválida da API getSchoolProfile");
            appState.schoolProfile = data.profile;
        } catch (e) {
            if (appRoot) appRoot.innerHTML = `<div class="auth-container"><h2>Erro Escola</h2><p>Verifique conexão.</p></div>`;
            return;
        }
    }

    // 2. Renderiza header
    renderHeader(appHeader, appState);
    if (!appRoot) {
        return;
    }

    // 3. Verifica Hash e ajusta targetView
    let currentHash = window.location.hash; let targetView = appState.currentView; let tokenFromHash = null;
    if (currentHash.startsWith('#resetPassword')) { targetView = 'resetPassword'; tokenFromHash = new URLSearchParams(currentHash.split('?')[1]).get('token'); }
    else if (currentHash === '#forgotPasswordRequest') { targetView = 'forgotPasswordRequest'; }
    else if (!appState.currentUser && currentHash) { targetView = 'login'; history.pushState("", document.title, window.location.pathname + window.location.search); }
    else if (appState.currentUser && (currentHash === '#forgotPasswordRequest' || currentHash.startsWith('#resetPassword'))) { targetView = 'dashboard'; history.pushState("", document.title, window.location.pathname + window.location.search); }
    appState.currentView = targetView;

    // 4. Gerencia Modais
    let shouldClearAppRoot = true;
    const existingPixModal = document.querySelector('.modal-overlay:not(.enrollment-modal)');
    const existingEnrollmentModal = document.querySelector('.enrollment-modal');
    if (!appState.pixModal.isOpen && existingPixModal) existingPixModal.remove();
    if (!appState.enrollmentModalState.isOpen && existingEnrollmentModal) existingEnrollmentModal.remove();
    if (appState.pixModal.isOpen) { if (!existingPixModal) document.body.appendChild(renderPixPaymentModal(appState)); shouldClearAppRoot = false; }
    if (appState.enrollmentModalState.isOpen && appState.enrollmentModalState.data) { if (!existingEnrollmentModal) document.body.appendChild(renderEnrollmentModal(appState.enrollmentModalState.data)); shouldClearAppRoot = false; }

    // 5. Limpa/Loading
    if (shouldClearAppRoot) {
        const authViews = ['login', 'register', 'forgotPasswordRequest', 'resetPassword'];
        if (!authViews.includes(appState.currentView) && !appRoot.innerHTML.includes('loading-placeholder')) { appRoot.innerHTML = '<div class="loading-placeholder">A carregar...</div>'; }
        else if (authViews.includes(appState.currentView)) { appRoot.innerHTML = ''; }
    }

    // 6. Roteamento Principal
    const { currentUser } = appState;

    // ---- Roteamento NÃO LOGADOS ----
    if (!currentUser) {
        if (appState.currentView === 'register') { appRoot.innerHTML = renderRegisterScreen(); }
        else if (appState.currentView === 'forgotPasswordRequest') { appRoot.innerHTML = renderForgotPasswordRequestScreen(); }
        else if (appState.currentView === 'resetPassword') { appRoot.innerHTML = renderResetPasswordScreen(tokenFromHash); }
        else { appState.currentView = 'login'; appRoot.innerHTML = renderLoginScreen(); }
        return;
    }

    // ---- Roteamento LOGADOS ----

    // Lógica Rematrícula Obrigatória
    if (currentUser.role === 'student' && appState.currentView === 'dashboard' && !appState.enrollmentModalState.isOpen && !appState.pixModal.isOpen) {
        let needsReenrollment = false; let reenrollmentCourseId = null; const now = new Date(); const enrollments = appState.enrollments || [];
        for (const enrollment of enrollments) { if (enrollment.status === 'Aprovada' && enrollment.contractAcceptedAt) { try { const acceptedDate = new Date(enrollment.contractAcceptedAt); if (isNaN(acceptedDate.getTime())) continue; const checkDate = new Date(acceptedDate.getTime()); checkDate.setMonth(checkDate.getMonth() + 12); if (now >= checkDate) { needsReenrollment = true; reenrollmentCourseId = enrollment.courseId; break; } } catch (dateError) { continue; } } }
        if (needsReenrollment && reenrollmentCourseId) {
            if (shouldClearAppRoot) appRoot.innerHTML = '<div class="loading-placeholder">Renovação...</div>';
            setTimeout(() => window.AppHandlers.handleInitiateEnrollment(reenrollmentCourseId, true), 50);
            return;
        }
    }

    // Renderização Views Normais
    let viewHtml = '<div class="error-placeholder">View não encontrada (inicial).</div>';
    try {
        viewHtml = await getActiveViewHtml(); // Chama helper

        // --- Verificação Essencial ---
        if (typeof viewHtml !== 'string' || viewHtml.trim() === '') {
            throw new Error("Falha interna ao gerar conteúdo da view.");
        }
        // ----------------------------

        if (shouldClearAppRoot) {
            appRoot.innerHTML = viewHtml;
            if (appState.currentView === 'dashboard' && currentUser.role !== 'unassigned') {
                setTimeout(() => applyCardOrder(appRoot, appState), 50);
            }
        }
    } catch (error) {
        if (shouldClearAppRoot) {
            appRoot.innerHTML = `<div class="error-placeholder">Erro ao carregar view: ${error.message}. <button onclick="window.AppHandlers.handleNavigateBackToDashboard()">Voltar</button></div>`;
        }
    }
}

/**
 * Helper para obter o HTML da view ativa (utilizador LOGADO)
 */
async function getActiveViewHtml() {
    const { currentUser, currentView, financialState, viewingCourseId, viewingUserId, documentTemplatesState, adminView } = appState;

    try {
        // Prioridade adminView
        if (adminView === 'certificateTemplate') { return await renderCertificateTemplateView(); }
        if (adminView === 'documentTemplates') { return await renderDocumentTemplatesView(); }
        if (adminView === 'systemSettings') { return await renderSystemSettingsView(); }
        if (adminView === 'userManagement') { return await renderUserManagementView(currentUser.id); }
        if (adminView === 'createCourse') { return await renderCreateCourseView(); }

        // Prioridade financialState flags
        if (financialState.isDefaultersReportVisible) { return await renderDefaultersReportView(); }
        if (financialState.isControlPanelVisible) { return await renderFinancialControlPanelView(); }
        if (financialState.isDashboardVisible) { return await renderFinancialDashboardView(); }

        // Prioridade viewing IDs
        if (viewingUserId === -1) { return await renderSchoolProfileView(); }
        if (viewingUserId !== null) { return await renderProfileView(viewingUserId); }
        if (viewingCourseId !== null) {
            const course = appState.courses.find(c => c.id === viewingCourseId);
            if (course) {
                if (adminView === 'editCourse') { return await renderEditCourseView(course); }
                if (adminView === 'attendance') { return await renderAttendanceManagementView(viewingCourseId); }
                return await renderCourseDetailsView(course); // (Default)
            } else {
                setTimeout(window.AppHandlers.handleNavigateBackToDashboard, 50);
                return '<div class="loading-placeholder">Curso não encontrado...</div>';
            }
        }

        // Default: Dashboard
        if (currentView === 'dashboard' || !currentView) {
            appState.currentView = 'dashboard';
            return await renderDashboard(appRoot); // Chama o renderDashboard de main.js
        }

        // Fallback final
        appState.currentView = 'dashboard';
        return await renderDashboard(appRoot);

    } catch (renderError) {
        // Retorna o erro para ser tratado pela função render() principal
        throw renderError;
    }
}