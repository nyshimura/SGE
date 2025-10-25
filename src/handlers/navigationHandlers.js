// src/handlers/navigationHandlers.js
import { appState } from '../state.js';
import { render } from '../router.js';

// --- FUNÇÃO AUXILIAR PARA RESETAR VIEWS ---
// <<<< ADICIONADO/MODIFICADO: Centraliza o reset de estados específicos >>>>
function resetSubViews() {
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.attendanceState = appState.attendanceState || {}; // Garante que attendanceState exista
    appState.attendanceState.courseId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.isDefaultersReportVisible = false;
    appState.financialState.expandedStudentId = null;
    appState.documentTemplatesState = appState.documentTemplatesState || {}; // Garante que documentTemplatesState exista
    appState.documentTemplatesState.isVisible = false; // Usa isVisible se for o caso
    appState.documentTemplatesState.isEditing = false; // Adiciona reset para edição, se aplicável
    appState.adminView = null; // Reseta adminView

    // Limpa a hash da URL, exceto para rotas que dependem dela (como reset de senha)
    const resetPasswordPattern = /^#resetPassword(\?.*)?$/;
    const currentHash = window.location.hash;
    if (currentHash && !resetPasswordPattern.test(currentHash) && currentHash !== '#forgotPasswordRequest') {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
}


// --- FUNÇÃO DE NAVEGAÇÃO GENÉRICA ---
// <<<< MODIFICADO: Simplificado e usa resetSubViews >>>>
export function navigateTo(view) {
    resetSubViews(); // Reseta os estados antes de definir a nova view principal
    appState.currentView = view; // Define a view principal

    // Lógica específica para hash (se necessário, mas geralmente não precisa mais aqui)
    // if (view === 'forgotPasswordRequest') {
    //     window.location.hash = 'forgotPasswordRequest';
    // }

    render(); // Chama a renderização
}

// --- FUNÇÕES ESPECÍFICAS DE NAVEGAÇÃO (handleNavigateTo...) ---

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateBackToDashboard() {
    resetSubViews(); // Limpa tudo
    appState.currentView = 'dashboard'; // Define a view principal
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToAttendance(courseId) {
    resetSubViews();
    appState.viewingCourseId = courseId;
    appState.adminView = 'attendance';
    appState.attendanceState = appState.attendanceState || {}; // Garante que exista
    appState.attendanceState.selectedDate = new Date().toISOString().split('T')[0];
    appState.currentView = 'adminDashboard'; // Ou a view base que contém as adminViews
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToEditCourse(courseId) {
    resetSubViews();
    appState.viewingCourseId = courseId;
    appState.adminView = 'editCourse';
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToCreateCourse() {
    resetSubViews();
    appState.adminView = 'createCourse';
    // appState.viewingCourseId = null; // Já feito por resetSubViews
    // appState.viewingUserId = null;  // Já feito por resetSubViews
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToCourseDetails(courseId) {
    resetSubViews();
    appState.viewingCourseId = courseId;
    // appState.adminView = 'details'; // Não precisa definir adminView se for a view padrão do ID
    // appState.viewingUserId = null; // Já feito
    appState.currentView = 'courseDetails'; // Ou apenas 'dashboard' e deixar o router decidir
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToUserManagement() {
    resetSubViews();
    appState.adminView = 'userManagement';
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToSystemSettings() {
    resetSubViews();
    appState.adminView = 'systemSettings';
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToDocumentTemplates() {
    resetSubViews();
    appState.adminView = 'documentTemplates';
    appState.documentTemplatesState = appState.documentTemplatesState || {};
    appState.documentTemplatesState.isVisible = true; // Se ainda usar essa flag
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToCertificateTemplate() {
    resetSubViews();
    appState.adminView = 'certificateTemplate';
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToProfile(userId) {
    resetSubViews();
    appState.viewingUserId = userId;
    // appState.adminView = 'dashboard'; // adminView é resetado
    appState.currentView = 'profile'; // Ou deixar o router decidir baseado em viewingUserId
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToSchoolProfile() {
    resetSubViews();
    appState.viewingUserId = -1; // Flag especial
    appState.currentView = 'schoolProfile'; // Define explicitamente
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToFinancialDashboard() {
    resetSubViews();
    appState.financialState.isDashboardVisible = true;
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToFinancialControlPanel() {
    resetSubViews();
    appState.financialState.isControlPanelVisible = true;
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// <<<< MODIFICADO: Usa resetSubViews >>>>
export function handleNavigateToDefaultersReport() {
    resetSubViews();
    appState.financialState.isDefaultersReportVisible = true;
    appState.currentView = 'adminDashboard'; // Ou a view base
    render();
}

// --- NOVA FUNÇÃO PARA MEUS CERTIFICADOS ---
// <<<< ADICIONADO: Nova função >>>>
export function handleNavigateToMyCertificates() {
    resetSubViews(); // Limpa outros estados
    appState.currentView = 'myCertificates'; // Define a view alvo
    render(); // Renderiza
}
// ------------------------------------

// <<< ADICIONADO: Exporta todas as funções em um objeto para facilitar o registro >>>
export const navigationHandlers = {
    navigateTo,
    handleNavigateBackToDashboard,
    handleNavigateToAttendance,
    handleNavigateToEditCourse,
    handleNavigateToCreateCourse,
    handleNavigateToCourseDetails,
    handleNavigateToUserManagement,
    handleNavigateToSystemSettings,
    handleNavigateToDocumentTemplates,
    handleNavigateToCertificateTemplate,
    handleNavigateToProfile,
    handleNavigateToSchoolProfile,
    handleNavigateToFinancialDashboard,
    handleNavigateToFinancialControlPanel,
    handleNavigateToDefaultersReport,
    handleNavigateToMyCertificates // <<< Adicionada aqui também
};