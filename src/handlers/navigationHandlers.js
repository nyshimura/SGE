// src/handlers/navigationHandlers.js
import { appState } from '../state.js';
import { render } from '../router.js';

// --- FUNÇÃO DE NAVEGAÇÃO GENÉRICA ---
export function navigateTo(view) {
    appState.currentView = view;
    const resetPasswordPattern = /^#resetPassword(\?.*)?$/;
    const currentHash = window.location.hash;

    if (view === 'forgotPasswordRequest') {
        window.location.hash = 'forgotPasswordRequest';
    } else if (view === 'login' || view === 'register') {
        if (currentHash) history.pushState("", document.title, window.location.pathname + window.location.search);
    } else if (!resetPasswordPattern.test(view) && view !== 'forgotPasswordRequest') {
        if (currentHash && !resetPasswordPattern.test(currentHash) && currentHash !== '#forgotPasswordRequest') {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        } else if (currentHash && (resetPasswordPattern.test(currentHash) || currentHash === '#forgotPasswordRequest')) {
             history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    }
    render();
}

// --- FUNÇÕES ESPECÍFICAS DE NAVEGAÇÃO (handleNavigateTo...) ---

export function handleNavigateBackToDashboard() {
    // Reseta flags de visualização específica
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.attendanceState.courseId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.financialState.expandedStudentId = null;
    appState.documentTemplatesState.isVisible = false;
    appState.adminView = 'dashboard'; // Reseta adminView para o padrão
    appState.currentView = 'dashboard'; // Define a view principal
    // Limpa a hash da URL, se houver
    if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    render();
}

export function handleNavigateToAttendance(courseId) {
    appState.viewingCourseId = courseId;
    appState.adminView = 'attendance';
    appState.attendanceState.selectedDate = new Date().toISOString().split('T')[0];
    render();
}

export function handleNavigateToEditCourse(courseId) {
    appState.viewingCourseId = courseId;
    appState.adminView = 'editCourse';
    render();
}

export function handleNavigateToCreateCourse() {
    appState.adminView = 'createCourse';
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    render();
}

export function handleNavigateToCourseDetails(courseId) {
    appState.viewingCourseId = courseId;
    appState.adminView = 'details'; // Ou pode ser 'dashboard' se detalhes for a view padrão
    appState.viewingUserId = null;
    // Reseta outras flags
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToUserManagement() {
    appState.adminView = 'userManagement';
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToSystemSettings() {
    appState.adminView = 'systemSettings';
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToDocumentTemplates() {
    appState.adminView = 'documentTemplates';
    // Reseta outras flags
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = true; // Mantém flag antiga? Ok.
    render();
}

// --- NOVA FUNÇÃO PARA CERTIFICADOS ---
export function handleNavigateToCertificateTemplate() {
    appState.adminView = 'certificateTemplate';
    // Reseta outras flags
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = false;
    render();
}
// ------------------------------------

export function handleNavigateToProfile(userId) {
    appState.viewingUserId = userId;
    appState.viewingCourseId = null;
    appState.adminView = 'dashboard'; // Volta pro dashboard como base
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToSchoolProfile() {
    appState.viewingUserId = -1; // Flag especial
    appState.viewingCourseId = null;
    appState.adminView = 'dashboard';
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToFinancialDashboard() {
    appState.financialState.isDashboardVisible = true;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.financialState.expandedStudentId = null;
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.adminView = 'dashboard';
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToFinancialControlPanel() {
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = true;
    appState.financialState.isDefaultersReportVisible = false;
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.adminView = 'dashboard';
    appState.documentTemplatesState.isVisible = false;
    render();
}

export function handleNavigateToDefaultersReport() {
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = true;
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.adminView = 'dashboard';
    appState.documentTemplatesState.isVisible = false;
    render();
}