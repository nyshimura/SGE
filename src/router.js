import { apiCall } from './api.js';
import { appState } from './state.js';

// Importação dos componentes e views
import { renderHeader } from './components/header.js';
import { renderPixPaymentModal } from './components/pixModal.js';
import { renderEnrollmentModal } from './components/enrollmentModal.js';
import { renderLoginScreen, renderRegisterScreen } from './views/auth.js';
// Não importamos mais renderDashboard diretamente aqui
import { renderProfileView } from './views/user/profile.js';
import { renderSchoolProfileView } from './views/school/profile.js';
import { renderEditCourseView } from './views/course/edit.js';
import { renderCourseDetailsView } from './views/course/details.js';
import { renderAttendanceManagementView } from './views/course/attendance.js';
import { renderFinancialControlPanelView } from './views/financial/controlPanel.js';
import { renderFinancialDashboardView } from './views/financial/dashboard.js';
import { renderDefaultersReportView } from './views/financial/defaultersReport.js';
import { renderDocumentTemplatesView } from './views/school/documentTemplates.js';
import { applyCardOrder } from './utils/helpers.js';

// Importações movidas para a função renderDashboardHelper
// import { renderStudentView } from './views/dashboard/student.js';
// import { renderAdminView } from './views/dashboard/admin.js';
// import { renderTeacherView } from './views/dashboard/teacher.js';
// import { renderUserManagementView } from './views/user/management.js';
// import { renderSystemSettingsView } from './views/school/settings.js';
// import { renderCreateCourseView } from './views/course/create.js';


const appRoot = document.getElementById('app-root');
const appHeader = document.getElementById('app-header');

/**
 * Função de renderização principal que atua como um roteador.
 */
export async function render() {
  // Verifica e carrega o perfil da escola se necessário
  if (!appState.schoolProfile) {
    try {
      const data = await apiCall('getSchoolProfile', {}, 'GET');
      appState.schoolProfile = data.profile;
    } catch (e) {
       if (appRoot) appRoot.innerHTML = `<div class="auth-container"><h2>Erro ao carregar dados da escola.</h2><p>Verifique a conexão com o servidor e o banco de dados.</p></div>`;
       return;
    }
  }

  // Renderiza o cabeçalho
  renderHeader(appHeader, appState);
  if (!appRoot) return;

  // Limpa o conteúdo principal ou adiciona/remove modais
  let shouldClearAppRoot = true;

  // --- Gerenciamento de Modais ---
  const existingPixModal = document.querySelector('.modal-overlay:not(.enrollment-modal)');
  const existingEnrollmentModal = document.querySelector('.enrollment-modal');

  if (appState.pixModal.isOpen) {
      if (!existingPixModal) document.body.appendChild(renderPixPaymentModal(appState));
      shouldClearAppRoot = false;
  } else if (existingPixModal) {
      existingPixModal.remove();
  }

  if (appState.enrollmentModalState.isOpen && appState.enrollmentModalState.data) {
      if (!existingEnrollmentModal) document.body.appendChild(renderEnrollmentModal(appState.enrollmentModalState.data));
      shouldClearAppRoot = false;
  } else if (existingEnrollmentModal) {
      existingEnrollmentModal.remove();
  }

  // Limpa appRoot se nenhum modal estiver ativo
  if (shouldClearAppRoot) {
      appRoot.innerHTML = '<div class="loading-placeholder">Carregando...</div>';
  }

  const { currentUser, currentView, financialState, viewingCourseId, viewingUserId, documentTemplatesState } = appState;

  // ------ Lógica de Roteamento ------

  // Views de autenticação
  if (!currentUser) {
    appRoot.innerHTML = (currentView === 'register') ? renderRegisterScreen() : renderLoginScreen();
    return;
  }

  // --- Lógica de Rematrícula Obrigatória (ANTES de renderizar o dashboard) ---
  let needsReenrollment = false;
  let reenrollmentCourseId = null;
  // Só executa se for aluno, estiver navegando para o dashboard E nenhum modal estiver aberto
  if (currentUser.role === 'student' && currentView === 'dashboard' && !appState.enrollmentModalState.isOpen && !appState.pixModal.isOpen) {
        const now = new Date();
        // Garante que enrollments exista e seja um array
        const enrollments = appState.enrollments || [];
        for (const enrollment of enrollments) {
            if (enrollment.status === 'Aprovada' && enrollment.contractAcceptedAt) {
                try {
                    const acceptedDate = new Date(enrollment.contractAcceptedAt);
                     // Verifica se a data é válida
                     if (isNaN(acceptedDate.getTime())) {
                        console.warn(`Data de aceite inválida para matrícula ID ${enrollment.id}: ${enrollment.contractAcceptedAt}`);
                        continue; // Pula esta matrícula
                    }

                    // Cria uma cópia da data para não modificar a original
                    const checkDate = new Date(acceptedDate.getTime());
                    // Adiciona 12 meses à data de aceite
                    checkDate.setMonth(checkDate.getMonth() + 12);

                    // Compara a data atual com a data limite para rematrícula
                    if (now >= checkDate) {
                        needsReenrollment = true;
                        reenrollmentCourseId = enrollment.courseId;
                        console.log(`Rematrícula necessária detectada para curso ${reenrollmentCourseId}. Data aceite: ${acceptedDate.toLocaleDateString()}, Data limite: ${checkDate.toLocaleDateString()}`);
                        break; // Encontrou um curso, interrompe a verificação
                    }
                } catch (dateError) {
                     console.error(`Erro ao processar data para matrícula ID ${enrollment.id}:`, dateError);
                     continue; // Pula esta matrícula em caso de erro
                }
            }
        }

        if (needsReenrollment && reenrollmentCourseId) {
             console.log("Iniciando fluxo de rematrícula obrigatória...");
             // Mostra mensagem no appRoot enquanto o modal carrega
             if (shouldClearAppRoot) { // Só atualiza se nenhum outro modal estiver sendo exibido
                 appRoot.innerHTML = '<div class="loading-placeholder">Sua matrícula precisa ser renovada. Carregando...</div>';
             }
             // Usa setTimeout para garantir que a renderização atual termine antes de iniciar a chamada da API do modal
             setTimeout(() => window.handleInitiateEnrollment(reenrollmentCourseId, true), 50); // Pequeno delay
             return; // Interrompe a renderização normal do dashboard
        }
  }
  // Se não precisa de rematrícula OU já está no modal, continua a renderização normal abaixo


  // --- Renderização das Views Normais (executa apenas se não estiver em fluxo de rematrícula obrigatória) ---
   let viewHtml = '<div class="error-placeholder">View não encontrada ou erro inesperado.</div>'; // Fallback

   try {
        // Usa um helper assíncrono para obter o HTML da view correta
        viewHtml = await getActiveViewHtml();

       // Atualiza o appRoot apenas se nenhum modal estiver sendo exibido
       if (shouldClearAppRoot) {
            appRoot.innerHTML = viewHtml;
            // Aplica a ordem dos cards APÓS renderizar o dashboard
            if (currentView === 'dashboard') {
                applyCardOrder(appRoot, appState);
            }
       }

   } catch (error) {
       console.error("Erro durante a renderização da view:", error);
       if (shouldClearAppRoot) {
            appRoot.innerHTML = `<div class="error-placeholder">Ocorreu um erro ao carregar esta seção: ${error.message}. <button onclick="window.handleNavigateBackToDashboard()">Voltar</button></div>`;
       }
   }
}

// --- Função Helper para obter o HTML da view ativa ---
async function getActiveViewHtml() {
    const { currentUser, currentView, financialState, viewingCourseId, viewingUserId, documentTemplatesState, adminView } = appState;

    if (documentTemplatesState.isVisible) {
        return await renderDocumentTemplatesView();
    } else if (financialState.isDefaultersReportVisible) {
        return await renderDefaultersReportView();
    } else if (financialState.isControlPanelVisible) {
        return await renderFinancialControlPanelView();
    } else if (financialState.isDashboardVisible) {
        return await renderFinancialDashboardView();
    } else if (viewingUserId === -1) {
        return await renderSchoolProfileView();
    } else if (viewingUserId !== null) {
        return await renderProfileView(viewingUserId);
    } else if (viewingCourseId !== null) {
        const course = appState.courses.find(c => c.id === viewingCourseId);
        if (course) {
            if (adminView === 'editCourse') {
                // Precisa dos teachers para editar
                if (!appState.users.some(u => u.role === 'teacher')) { // Otimização: verifica se já tem teachers
                    const teacherData = await apiCall('getTeachers', {}, 'GET');
                    // Adiciona teachers ao estado se não existirem
                    appState.users = [...appState.users, ...(teacherData.teachers || [])];
                }
                return await renderEditCourseView(course);
            } else if (adminView === 'attendance') {
                return await renderAttendanceManagementView(viewingCourseId);
            } else { // Default para detalhes do curso
                return await renderCourseDetailsView(course);
            }
        } else {
             // Curso não encontrado, redireciona
             console.warn(`Curso ID ${viewingCourseId} não encontrado no estado. Redirecionando.`);
             setTimeout(window.handleNavigateBackToDashboard, 50); // Adia o redirecionamento
             return '<div class="loading-placeholder">Curso não encontrado. Redirecionando...</div>';
        }
    } else if (currentView === 'dashboard') {
        // Chama a função helper que busca dados e renderiza o dashboard apropriado
        return await renderDashboardHelper();
    } else {
        // Se nenhuma rota corresponder, redireciona para login (safety net)
        console.warn("Nenhuma rota correspondente encontrada, redirecionando para login.");
        setTimeout(window.handleLogout, 50); // Adia o logout
        return '<div class="loading-placeholder">Redirecionando...</div>';
    }
}


// --- Função Helper para Renderizar o Dashboard Correto ---
// Busca os dados necessários e chama a view apropriada (student, admin, teacher)
async function renderDashboardHelper() {
    const { currentUser, adminView } = appState;

    // Importações dinâmicas aqui para clareza
     const { renderStudentView } = await import('./views/dashboard/student.js');
     const { renderAdminView } = await import('./views/dashboard/admin.js');
     const { renderTeacherView } = await import('./views/dashboard/teacher.js');
     const { renderUserManagementView } = await import('./views/user/management.js');
     const { renderSystemSettingsView } = await import('./views/school/settings.js');
     const { renderCreateCourseView } = await import('./views/course/create.js');

    // Centraliza a busca de dados do dashboard
    // Considerar cache ou buscar apenas se necessário
    const dashboardData = await apiCall('getDashboardData', { userId: currentUser.id, role: currentUser.role }, 'GET');

    // Atualiza o estado global com os dados mais recentes
    appState.courses = dashboardData.courses || [];
    appState.enrollments = dashboardData.enrollments || [];
    appState.attendance = dashboardData.attendance || [];
    appState.payments = dashboardData.payments || [];
    appState.users = dashboardData.users || []; // Para admin/superadmin
    appState.teachers = dashboardData.teachers || []; // Para students

    // Carrega configs para admin se necessário
    if ((currentUser.role === 'admin' || currentUser.role === 'superadmin') && !appState.systemSettings) {
        try {
            const settingsData = await apiCall('getSystemSettings', {}, 'GET');
            appState.systemSettings = settingsData.settings;
        } catch (e) {
            console.error("Falha ao carregar as configurações do sistema para o dashboard.", e);
        }
    }

    // Decide qual view renderizar
    switch (currentUser.role) {
        case 'student':
            return renderStudentView(currentUser.id, dashboardData);
        case 'admin':
        case 'superadmin':
            // Lógica de subviews do admin
            if (adminView === 'userManagement') {
                // A view de gerenciamento busca seus próprios dados filtrados, mas precisa dos cursos
                 return await renderUserManagementView(currentUser.id); // Passa cursos via appState
            } else if (adminView === 'systemSettings') {
                return await renderSystemSettingsView(); // Usa systemSettings do appState
            } else if (adminView === 'createCourse') {
                 // Busca teachers se não estiverem já em appState.users
                 if (!appState.users.some(u => u.role === 'teacher')) {
                     const teacherData = await apiCall('getTeachers', {}, 'GET');
                     // Adiciona/Atualiza teachers em appState.users
                     const teacherIds = new Set(appState.users.filter(u => u.role === 'teacher').map(t => t.id));
                     (teacherData.teachers || []).forEach(t => {
                         if (!teacherIds.has(t.id)) appState.users.push(t);
                     });
                 }
                return renderCreateCourseView(); // Usa users do appState
            }
            // Adicione outras subviews aqui se necessário (edit, attendance já são tratadas fora)
            else {
                // Renderiza a view principal do admin
                return renderAdminView(currentUser.id, dashboardData);
            }
        case 'teacher':
            return renderTeacherView(currentUser.id, dashboardData);
        default: // 'unassigned' ou outro
            return `<div class="welcome-message"><h2>Aguardando atribuição</h2><p>Sua conta foi criada. Um administrador precisa atribuir uma função a você.</p></div>`;
    }
}