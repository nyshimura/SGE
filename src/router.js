import { apiCall } from './api.js';
import { appState } from './state.js';

// Importação dos componentes e views
import { renderHeader } from './components/header.js';
import { renderPixPaymentModal } from './components/pixModal.js';
import { renderLoginScreen, renderRegisterScreen } from './views/auth.js';
import { renderDashboard } from './views/dashboard/main.js';
import { renderProfileView } from './views/user/profile.js';
import { renderSchoolProfileView } from './views/school/profile.js';
import { renderEditCourseView } from './views/course/edit.js';
import { renderCourseDetailsView } from './views/course/details.js';
import { renderAttendanceManagementView } from './views/course/attendance.js';
import { renderFinancialControlPanelView } from './views/financial/controlPanel.js';
import { renderFinancialDashboardView } from './views/financial/dashboard.js';
import { renderDefaultersReportView } from './views/financial/defaultersReport.js';
import { renderDocumentTemplatesView } from './views/school/documentTemplates.js'; // <-- NOVA IMPORTAÇÃO
import { applyCardOrder } from './utils/helpers.js';

const appRoot = document.getElementById('app-root');
const appHeader = document.getElementById('app-header');

/**
 * Função de renderização principal que atua como um roteador.
 */
export async function render() {
  if (!appState.schoolProfile) {
    try {
      const data = await apiCall('getSchoolProfile', {}, 'GET');
      appState.schoolProfile = data.profile;
    } catch (e) {
       appRoot.innerHTML = `<div class="auth-container"><h2>Erro ao carregar dados da escola.</h2><p>Verifique a conexão com o servidor e o banco de dados.</p></div>`;
       return;
    }
  }
  
  renderHeader(appHeader, appState);
  if (!appRoot) return;
  
  appRoot.innerHTML = ''; // Limpa o conteúdo antes de renderizar a nova view
  
  if (appState.pixModal.isOpen) {
      const existingModal = document.querySelector('.modal-overlay');
      if(existingModal) existingModal.remove();
      document.body.appendChild(renderPixPaymentModal(appState));
  }
  
  const { currentUser, currentView, financialState, viewingCourseId, viewingUserId, documentTemplatesState } = appState;

  // Views de autenticação
  if (!currentUser) {
    if (currentView === 'register') {
      appRoot.innerHTML = renderRegisterScreen();
    } else {
      appRoot.innerHTML = renderLoginScreen();
    }
    return;
  }
  
  // Views de usuário logado
  if (documentTemplatesState.isVisible) { // <-- NOVA LÓGICA
      appRoot.innerHTML = await renderDocumentTemplatesView();
  } else if (financialState.isDefaultersReportVisible) {
      appRoot.innerHTML = await renderDefaultersReportView();
  } else if (financialState.isControlPanelVisible) {
      appRoot.innerHTML = await renderFinancialControlPanelView();
  } else if (financialState.isDashboardVisible) {
      appRoot.innerHTML = await renderFinancialDashboardView();
  } else if (viewingUserId === -1) { 
      appRoot.innerHTML = await renderSchoolProfileView();
  } else if (viewingUserId !== null) {
      appRoot.innerHTML = await renderProfileView(viewingUserId);
  } else if (viewingCourseId !== null) {
      const course = appState.courses.find(c => c.id === viewingCourseId);
      if (appState.adminView === 'editCourse' && course) {
          appRoot.innerHTML = await renderEditCourseView(course);
      } else if (appState.adminView === 'attendance' && course) {
          appRoot.innerHTML = await renderAttendanceManagementView(viewingCourseId);
      } else if (course) {
          appRoot.innerHTML = await renderCourseDetailsView(course);
      }
  } else if (currentView === 'dashboard') {
      await renderDashboard(appRoot);
      setTimeout(() => applyCardOrder(appRoot, appState), 0);
  } else {
      appState.currentUser = null;
      render();
  }
}