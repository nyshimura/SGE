import { apiCall } from '../../api.js';
import { appState } from '../../state.js';
import { render } from '../../router.js';

import { renderStudentView } from './student.js';
import { renderAdminView } from './admin.js';
import { renderTeacherView } from './teacher.js';
import { renderUserManagementView } from '../user/management.js';
import { renderSystemSettingsView } from '../school/settings.js';
import { renderCreateCourseView } from '../course/create.js';

/**
 * Renderiza o dashboard principal com base no perfil do usuário.
 * @param {HTMLElement} rootElement O elemento onde o dashboard será renderizado.
 */
export async function renderDashboard(rootElement) {
    if (!appState.currentUser) {
        appState.currentView = 'login';
        render();
        return;
    }

    let dashboardHtml = '';
    
    // Carrega as configurações do sistema para admins, se ainda não estiverem carregadas
    if (appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin') {
        if (!appState.systemSettings) {
            try {
                const settingsData = await apiCall('getSystemSettings', {}, 'GET');
                appState.systemSettings = settingsData.settings;
            } catch (e) {
                console.error("Falha ao carregar as configurações do sistema para o dashboard do admin.", e);
            }
        }
    }

    // Centraliza a busca de dados para as views do dashboard
    const data = await apiCall('getDashboardData', { userId: appState.currentUser.id, role: appState.currentUser.role }, 'GET');
    
    // Atualiza o estado local com os dados buscados
    appState.courses = data.courses || [];
    appState.enrollments = data.enrollments || [];
    appState.attendance = data.attendance || [];
    appState.payments = data.payments || [];
    appState.users = data.users || [];

    switch (appState.currentUser.role) {
        case 'student':
            dashboardHtml = renderStudentView(appState.currentUser.id, data);
            break;
        case 'admin':
        case 'superadmin':
            if (appState.adminView === 'userManagement') {
                dashboardHtml = await renderUserManagementView(appState.currentUser.id);
            } else if (appState.adminView === 'systemSettings') {
                dashboardHtml = await renderSystemSettingsView();
            } else if (appState.adminView === 'createCourse') {
                dashboardHtml = renderCreateCourseView();
            } else {
                 dashboardHtml = renderAdminView(appState.currentUser.id, data);
            }
            break;
        case 'teacher':
            dashboardHtml = renderTeacherView(appState.currentUser.id, data);
            break;
        default:
            dashboardHtml = `<div class="welcome-message"><h2>Aguardando atribuição</h2><p>Sua conta foi criada. Um administrador precisa atribuir uma função a você.</p></div>`;
            break;
    }
    rootElement.innerHTML = dashboardHtml;
}