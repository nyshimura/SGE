/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

// --- API HELPER ---
const API_URL = 'api/index.php';

async function apiCall(action, data = {}, method = 'POST') {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        let url = `${API_URL}?action=${action}`;

        if (method === 'POST') {
            options.body = JSON.stringify(data);
        } else if (Object.keys(data).length) {
            url += '&' + new URLSearchParams(data).toString();
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        if (result.success === false) {
            // Use result.data if message is nested there, otherwise use result.message
            const errorMessage = result.data?.message || result.message || 'API call failed';
            throw new Error(errorMessage);
        }
        return result;
    } catch (error) {
        console.error(`API call failed for action "${action}":`, error);
        alert(`Ocorreu um erro de comunicação com o servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        throw error;
    }
}


// --- APP STATE ---
const appState = {
    currentUser: null,
    currentView: 'login',
    
    // Data fetched from API
    users: [],
    courses: [],
    enrollments: [],
    attendance: [],
    payments: [],
    schoolProfile: null,
    systemSettings: null,

    // UI State
    adminView: 'dashboard',
    viewingCourseId: null,
    viewingUserId: null,
    
    // View-specific state
    userFilters: {
        name: '',
        role: 'all',
        courseId: 'all',
        enrollmentStatus: 'all',
    },
    attendanceState: {
        courseId: null,
        selectedDate: new Date().toISOString().split('T')[0],
        students: [],
        history: {},
    },
    financialState: {
        isDashboardVisible: false,
        isControlPanelVisible: false,
        selectedDate: new Date().toISOString().slice(0, 7),
        expandedStudentId: null,
    },
    pixModal: {
        isOpen: false,
        paymentIds: [],
        content: null,
    }
};

// --- DOM Elements ---
const appRoot = document.getElementById('app-root');
const appHeader = document.getElementById('app-header');


// --- RENDER FUNCTIONS ---

async function render() {
  if (!appState.schoolProfile) {
    try {
      const data = await apiCall('getSchoolProfile', {}, 'GET');
      appState.schoolProfile = data.data.profile;
    } catch (e) {
       appRoot.innerHTML = `<div class="auth-container"><h2>Erro ao carregar dados da escola.</h2><p>Verifique a conexão com o servidor e o banco de dados.</p></div>`;
       return;
    }
  }
  
  renderHeader();
  if (!appRoot) return;
  
  // Clear root before rendering new content
  appRoot.innerHTML = '';
  
  if (appState.pixModal.isOpen) {
      document.body.appendChild(renderPixPaymentModal());
  }
  
  const { currentUser, currentView } = appState;

  if (!currentUser) {
    if (currentView === 'register') {
      appRoot.innerHTML = renderRegisterScreen();
    } else {
      appRoot.innerHTML = renderLoginScreen();
    }
    return;
  }
  
  // Logged-in views
  const { financialState, viewingCourseId, viewingUserId, adminView } = appState;

  if (financialState.isControlPanelVisible) {
      appRoot.innerHTML = await renderFinancialControlPanelView();
      return;
  }
  if (financialState.isDashboardVisible) {
      appRoot.innerHTML = await renderFinancialDashboardView();
      return;
  }
  if (viewingUserId !== null) {
      appRoot.innerHTML = await renderProfileView(viewingUserId);
      return;
  }
  if (viewingCourseId !== null) {
      const course = appState.courses.find(c => c.id === viewingCourseId);
      if (adminView === 'editCourse' && course) {
          appRoot.innerHTML = await renderEditCourseView(course);
      } else if (adminView === 'attendance' && course) {
          appRoot.innerHTML = await renderAttendanceManagementView(viewingCourseId);
      } else if (course) {
          appRoot.innerHTML = await renderCourseDetailsView(course);
      }
      return;
  }

  switch (currentView) {
    case 'dashboard':
        await renderDashboard();
        break;
    default:
        appState.currentUser = null;
        render(); // Should redirect to login
        break;
  }
}

function renderHeader() {
    if (!appHeader || !appState.schoolProfile) return;
    const logoHtml = appState.schoolProfile.profilePicture
        ? `<img src="${appState.schoolProfile.profilePicture}" alt="Logo da Escola" class="header-logo">`
        : `<span class="logo-icon">🎨</span>`;

    let headerContent = `<h1>${logoHtml} ${appState.schoolProfile.name}</h1>`;
    if (appState.currentUser) {
        const { currentUser } = appState;
        const isSuperAdmin = currentUser.role === 'superadmin';
        const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
        headerContent = `
            <div class="header-content">
                <h1>${logoHtml} ${appState.schoolProfile.name}</h1>
                <div class="user-info">
                    <span>Olá, ${currentUser.firstName}! (${currentUser.role})</span>
                    <button class="action-button secondary" onclick="window.handleNavigateToProfile(${currentUser.id})">Meu Perfil</button>
                    ${isAdmin ? `<button class="action-button secondary" onclick="window.handleNavigateToSchoolProfile()">Dados da UE</button>` : ''}
                    ${isSuperAdmin ? `<button class="action-button secondary" onclick="window.handleNavigateToSystemSettings()">Configurações</button>` : ''}
                    <button onclick="window.handleLogout()" class="logout-button">Sair</button>
                </div>
            </div>
        `;
    }
    appHeader.innerHTML = headerContent;
}


function renderLoginScreen() {
    return `
        <div class="auth-container">
            <h2>Login</h2>
            <form onsubmit="window.handleLogin(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="auth-button">Entrar</button>
            </form>
            <p>Não tem uma conta? <button class="link-button" onclick="window.navigateTo('register')">Cadastre-se</button></p>
        </div>
    `;
}

function renderRegisterScreen() {
    return `
         <div class="auth-container">
            <h2>Cadastro</h2>
            <form onsubmit="window.handleRegister(event)">
                <div class="form-group">
                    <label for="name">Nome</label>
                    <input type="text" id="name" name="name" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required autocomplete="new-password">
                </div>
                <button type="submit" class="auth-button">Cadastrar</button>
            </form>
            <p>Já tem uma conta? <button class="link-button" onclick="window.navigateTo('login')">Faça login</button></p>
        </div>
    `;
}

async function renderDashboard() {
    if (!appState.currentUser) {
        appState.currentView = 'login';
        render();
        return;
    }

    let dashboardHtml = '';
    // Centralized data fetching for dashboard views
    const { data } = await apiCall('getDashboardData', { userId: appState.currentUser.id, role: appState.currentUser.role }, 'GET');
    
    // Update local state with fetched data
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
    appRoot.innerHTML = dashboardHtml;
    
    setTimeout(applyCardOrder, 0);
}

function renderStudentView(studentId, data) {
  const student = appState.currentUser;
  if (!student) return '';

  const myEnrollments = data.enrollments || [];
  const myAttendance = data.attendance || [];
  const openCourses = data.courses || [];

  const cards = [
    {
      id: 'student-courses',
      html: `
        <div class="card" id="student-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📚 Meus Cursos e Matrículas</h3>
            <ul class="list">
                ${myEnrollments.map((enrollment) => {
                    const course = openCourses.find((c) => c.id === enrollment.courseId);
                    if (!course) return '';
                    const teacher = data.teachers.find((t) => t.id === course.teacherId);
                    
                    let actionHtml = `<span class="status-badge status-${enrollment.status.toLowerCase()}">${enrollment.status}</span>`;

                    return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${course.name}</span>
                                <span class="list-item-subtitle">Professor: ${teacher?.firstName} ${teacher?.lastName || ''}</span>
                            </div>
                            <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                                ${actionHtml}
                            </div>
                        </li>
                    `;
                }).join('') || '<li>Nenhuma matrícula encontrada.</li>'}
            </ul>
        </div>
      `
    },
     {
      id: 'student-available-courses',
      html: `
        <div class="card" id="student-available-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">🏫 Cursos Disponíveis para Inscrição</h3>
            <ul class="list">
                ${openCourses.map((course) => {
                    const enrollment = myEnrollments.find((e) => e.courseId === course.id);
                    if (enrollment && (enrollment.status === 'Aprovada' || enrollment.status === 'Pendente')) {
                        return '';
                    }

                    const teacher = data.teachers.find((t) => t.id === course.teacherId);
                    return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${course.name}</span>
                                <span class="list-item-subtitle">Professor: ${teacher?.firstName} ${teacher?.lastName || ''}</span>
                            </div>
                            <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                                <button class="action-button" data-course-id="${course.id}" onclick="window.handleEnroll(event)">Inscreva-se Agora</button>
                            </div>
                        </li>
                    `;
                }).join('') || '<li>Nenhum novo curso disponível no momento.</li>'}
            </ul>
        </div>
      `
    },
    {
      id: 'student-attendance',
      html: `
        <div class="card" id="student-attendance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📊 Meu Relatório de Frequência</h3>
             ${myAttendance.length === 0 ? '<p>Nenhum registro de frequência ainda.</p>' : `
                <div class="table-wrapper">
                <table>
                    <thead><tr><th>Curso</th><th>Data</th><th>Status</th></tr></thead>
                    <tbody>
                        ${myAttendance.map((record) => {
                            const course = openCourses.find((c) => c.id === record.courseId);
                            const formattedDate = new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR');
                            return `
                                <tr>
                                    <td>${course?.name || 'Curso não encontrado'}</td>
                                    <td>${formattedDate}</td>
                                    <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
                                </tr>
                            `
                        }).join('')}
                    </tbody>
                </table>
                </div>
             `}
        </div>
      `
    },
    {
      id: 'student-finance',
      html: `
        <div class="card full-width" id="student-finance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            ${renderStudentFinancialHistory(studentId, data.payments)}
        </div>
      `
    }
  ];

  return `
    <div class="welcome-message">
        <h2>Olá, ${student.firstName}!</h2>
        <p>Veja os cursos disponíveis e o status da sua matrícula.</p>
    </div>
    <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
        ${cards.map(c => c.html).join('')}
    </div>
  `;
}

function renderAdminView(adminId, data) {
    const admin = appState.currentUser;
    if (!admin) return '';

    const pendingEnrollments = data.enrollments.filter((e) => e.status === 'Pendente');
    const allCourses = data.courses || [];
    const openCourses = allCourses.filter((c) => c.status === 'Aberto');
    
    const cards = [
        {
          id: 'admin-finance',
          html: `
            <div class="card" id="admin-finance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">💰 Controle Financeiro</h3>
                <p>Acesse o dashboard financeiro para visualizar a receita e a inadimplência.</p>
                <button class="action-button" onclick="window.handleNavigateToFinancialDashboard()">Acessar Dashboard</button>
            </div>
          `
        },
        ...(admin.role === 'superadmin' ? [{
          id: 'admin-users',
          html: `
            <div class="card" id="admin-users" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">👥 Gerenciamento de Usuários</h3>
                <p>Filtre, visualize e altere as funções dos usuários do sistema.</p>
                <button class="action-button" onclick="window.handleNavigateToUserManagement()">Acessar Gerenciamento</button>
            </div>
          `
        }] : []),
        {
          id: 'admin-create-course',
          html: `
            <div class="card" id="admin-create-course" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">➕ Criar Novo Curso</h3>
                <p>Adicione um novo curso ao catálogo da escola.</p>
                <button class="action-button" onclick="window.handleNavigateToCreateCourse()">Criar Curso</button>
            </div>
          `
        },
        {
          id: 'admin-manage-courses',
          html: `
            <div class="card" id="admin-manage-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">⚙️ Gerenciar Cursos</h3>
                <ul class="list">
                    ${allCourses.map((course) => `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${course.name}</span>
                                <span class="status-badge status-${course.status.toLowerCase()}">${course.status}</span>
                            </div>
                             <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                                <button class="action-button" onclick="window.handleNavigateToEditCourse(${course.id})">Editar</button>
                                ${course.status === 'Aberto' ? `<button class="action-button danger" onclick="window.handleEndCourse(${course.id})">Encerrar</button>` : ''}
                                ${course.status === 'Encerrado' && admin.role === 'superadmin' ? `<button class="action-button" onclick="window.handleReopenCourse(${course.id})">Reabrir</button>` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
          `
        },
        {
          id: 'admin-pending-enrollments',
          html: `
            <div class="card" id="admin-pending-enrollments" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">📬 Matrículas Pendentes (${pendingEnrollments.length})</h3>
                <ul class="list">
                    ${pendingEnrollments.length === 0 ? '<li>Nenhuma matrícula pendente.</li>' : pendingEnrollments.map((enrollment) => {
                        const student = data.users.find((s) => s.id === enrollment.studentId);
                        const course = allCourses.find((c) => c.id === enrollment.courseId);
                        if (!student || !course) return '';
                        const enrolledCount = data.enrollments.filter((e) => e.courseId === course.id && e.status === 'Aprovada').length;
                        
                        const vacancies = course.totalSlots === null
                            ? 'Ilimitadas'
                            : Math.max(0, course.totalSlots - enrolledCount);
                        
                        return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${student.firstName} ${student.lastName || ''} - ${course.name}</span>
                                <span class="list-item-subtitle">Vagas restantes: ${vacancies}</span>
                            </div>
                            <form class="enrollment-approval-form" onsubmit="window.handleApprove(event)" data-student-id="${student.id}" data-course-id="${course.id}">
                                <div class="form-group-inline">
                                    <select name="billingStart" required>
                                        <option value="this_month">Cobrar este mês</option>
                                        <option value="next_month">Cobrar próximo mês</option>
                                    </select>
                                    <button type="submit" class="action-button">Aprovar</button>
                                </div>
                            </form>
                        </li>`
                    }).join('')}
                </ul>
            </div>
          `
        },
        {
          id: 'admin-attendance',
          html: `
            <div class="card" id="admin-attendance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">📋 Controle de Frequência</h3>
                <ul class="list">
                    ${openCourses.length === 0 ? '<li>Nenhum curso aberto.</li>' : openCourses.map((course) => `
                        <li class="list-item">
                             <div class="list-item-content">
                                <span class="list-item-title">${course.name}</span>
                            </div>
                            <button class="action-button" onclick="window.handleNavigateToAttendance(${course.id})">Lançar Frequência</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
          `
        }
    ];
    
    return `
        <div class="welcome-message">
            <h2>Painel do Administrador - ${admin.firstName}</h2>
            <p>Gerencie usuários, cursos, matrículas e relatórios.</p>
        </div>
        <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
            ${cards.map(c => c.html).join('')}
        </div>
    `;
}

function renderCreateCourseView() {
    const teachers = appState.users.filter(u => u.role === 'teacher');
    return `
        <div class="view-header">
            <h2>Criar Novo Curso</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar ao Painel</button>
        </div>
        <div class="card full-width">
            <form id="create-course-form" onsubmit="window.handleCreateCourse(event)">
                <div class="form-group">
                    <label for="courseName">Nome do Curso</label>
                    <input type="text" id="courseName" name="courseName" required>
                </div>
                <div class="form-group">
                    <div class="form-group-header">
                        <label for="courseDescription">Descrição</label>
                        <button type="button" class="action-button secondary generate-ai-button" onclick="window.handleGenerateDescription('create-course-form')">Gerar com IA ✨</button>
                    </div>
                    <textarea id="courseDescription" name="courseDescription" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="teacherId">Professor</label>
                    <select id="teacherId" name="teacherId" required>
                        <option value="">Selecione um professor</option>
                        ${teachers.map(t => `<option value="${t.id}">${t.firstName} ${t.lastName || ''}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="totalSlots">Número de Vagas</label>
                    <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Deixe em branco para ilimitado">
                </div>
                <div class="form-group">
                    <label for="monthlyFee">Valor da Mensalidade (R$)</label>
                    <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" placeholder="Ex: 150.00" required>
                </div>
                <div class="form-group">
                    <label>Estrutura de Pagamento</label>
                    <div class="radio-group">
                        <label><input type="radio" name="paymentType" value="recorrente" checked onchange="document.getElementById('installments-group').style.display='none'"> Recorrente</label>
                        <label><input type="radio" name="paymentType" value="parcelado" onchange="document.getElementById('installments-group').style.display='block'"> Parcelado</label>
                    </div>
                </div>
                <div class="form-group" id="installments-group" style="display: none;">
                    <label for="installments">Número de Parcelas</label>
                    <input type="number" id="installments" name="installments" min="1" placeholder="Ex: 12">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="dayOfWeek">Dia da Semana</label>
                        <select id="dayOfWeek" name="dayOfWeek">
                            <option value="">Nenhum</option>
                            <option value="Domingo">Domingo</option>
                            <option value="Segunda-feira">Segunda-feira</option>
                            <option value="Terça-feira">Terça-feira</option>
                            <option value="Quarta-feira">Quarta-feira</option>
                            <option value="Quinta-feira">Quinta-feira</option>
                            <option value="Sexta-feira">Sexta-feira</option>
                            <option value="Sábado">Sábado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Horário de Início</label>
                        <input type="time" id="startTime" name="startTime">
                    </div>
                    <div class="form-group">
                        <label for="endTime">Horário de Fim</label>
                        <input type="time" id="endTime" name="endTime">
                    </div>
                </div>
                <button type="submit" class="action-button">Criar Curso</button>
            </form>
        </div>
    `;
}

async function renderUserManagementView(adminId) {
    const { data } = await apiCall('getFilteredUsers', appState.userFilters, 'POST');
    appState.users = data.users;
    appState.courses = data.courses;
    
    const filteredUsers = appState.users.filter(u => u.id !== adminId);

    return `
        <div class="view-header">
            <h2>Gerenciamento de Usuários</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar ao Painel</button>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Filtros</h3>
            <div class="filter-container">
                 <div class="filter-group">
                    <label for="filter-name">Nome</label>
                    <input type="text" id="filter-name" name="name" oninput="window.handleUserFilterChange(event)" value="${appState.userFilters.name}">
                </div>
                <div class="filter-group">
                    <label for="filter-role">Função</label>
                    <select id="filter-role" name="role" onchange="window.handleUserFilterChange(event)">
                        <option value="all" ${appState.userFilters.role === 'all' ? 'selected' : ''}>Todas</option>
                        <option value="unassigned" ${appState.userFilters.role === 'unassigned' ? 'selected' : ''}>Não atribuído</option>
                        <option value="student" ${appState.userFilters.role === 'student' ? 'selected' : ''}>Aluno</option>
                        <option value="teacher" ${appState.userFilters.role === 'teacher' ? 'selected' : ''}>Professor</option>
                        <option value="admin" ${appState.userFilters.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-course">Curso</label>
                    <select id="filter-course" name="courseId" onchange="window.handleUserFilterChange(event)">
                        <option value="all">Todos</option>
                        ${appState.courses.map(c => `<option value="${c.id}" ${appState.userFilters.courseId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-status">Status da Matrícula</label>
                    <select id="filter-status" name="enrollmentStatus" onchange="window.handleUserFilterChange(event)" ${appState.userFilters.courseId === 'all' ? 'disabled' : ''}>
                        <option value="all">Todos</option>
                        <option value="Pendente" ${appState.userFilters.enrollmentStatus === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Aprovada" ${appState.userFilters.enrollmentStatus === 'Aprovada' ? 'selected' : ''}>Aprovada</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Usuários Encontrados (${filteredUsers.length})</h3>
            <div class="table-wrapper">
            <table>
                <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Ações</th></tr></thead>
                <tbody>
                    ${filteredUsers.map(user => `
                        <tr>
                            <td>${user.firstName} ${user.lastName || ''}</td>
                            <td>${user.email}</td>
                            <td>
                                <select onchange="window.handleRoleChange(event, ${user.id})">
                                    <option value="unassigned" ${user.role === 'unassigned' ? 'selected' : ''}>Não atribuído</option>
                                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Aluno</option>
                                    <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Professor</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </td>
                            <td>
                                <button class="action-button" onclick="window.handleNavigateToProfile(${user.id})">Ver Perfil</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
}

function renderTeacherView(teacherId, data) {
    const teacher = appState.currentUser;
    if (!teacher) return '';

    const myOpenCourses = data.courses || [];

    const cards = myOpenCourses.map((course) => ({
        id: `teacher-course-${course.id}`,
        html: `
            <div class="card" id="teacher-course-${course.id}" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">Turma: ${course.name}</h3>
                 <div class="list-item-actions">
                     <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                     <button class="action-button" onclick="window.handleNavigateToAttendance(${course.id})">Lançar Frequência</button>
                 </div>
            </div>
        `
    }));

    return `
        <div class="welcome-message">
            <h2>Área do Professor - ${teacher.firstName} ${teacher.lastName || ''}</h2>
            <p>Selecione uma turma para gerenciar a frequência.</p>
        </div>
        <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
            ${cards.length === 0 ? '<div class="card"><p>Nenhum curso aberto atribuído a você.</p></div>' : cards.map((c) => c.html).join('')}
        </div>
    `;
}

async function renderAttendanceManagementView(courseId) {
    const { data } = await apiCall('getAttendanceData', { courseId, date: appState.attendanceState.selectedDate }, 'GET');
    const course = data.course;
    if (!course) return '';
    
    const { selectedDate } = appState.attendanceState;
    const today = new Date().toISOString().split('T')[0];
    
    const selectedDateObj = new Date(selectedDate + 'T12:00:00Z');
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const selectedDayOfWeek = weekDays[selectedDateObj.getUTCDay()];
    const isCorrectDayOfWeek = course.dayOfWeek === selectedDayOfWeek;

    const existingRecordsForDate = data.recordsForDate;
    const isEditing = existingRecordsForDate.length > 0;
    
    const attendanceHistory = data.history;

    return `
        <div class="view-header">
            <h2>Controle de Frequência: ${course.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="attendance-controls">
                    <label for="attendance-date">Data da Chamada:</label>
                    <input type="date" id="attendance-date" value="${selectedDate}" max="${today}" onchange="window.handleAttendanceDateChange(event)">
                </div>

                ${isEditing ? `<div class="notice">Você está editando a frequência de uma data já registrada.</div>` : ''}
                ${!isCorrectDayOfWeek && course.dayOfWeek ? `<div class="notice">Atenção: Este curso ocorre às ${course.dayOfWeek}s. A data selecionada é uma ${selectedDayOfWeek}.</div>` : ''}

                 ${data.students.length === 0 ? '<p>Nenhum aluno matriculado nesta turma ainda.</p>' : `
                    <form onsubmit="window.handleSaveAttendance(event)" data-course-id="${course.id}">
                        <input type="hidden" name="attendanceDate" value="${selectedDate}">
                        <table>
                            <thead><tr><th>Aluno</th><th>Faltou?</th></tr></thead>
                            <tbody>
                            ${data.students.map((student) => {
                                const existingRecord = existingRecordsForDate.find((r) => r.studentId === student.id);
                                const isAbsent = existingRecord ? existingRecord.status === 'Falta' : false;
                                return `
                                    <tr>
                                        <td>${student.firstName} ${student.lastName || ''}</td>
                                        <td>
                                            <div class="attendance-checkbox">
                                             <input type="checkbox" id="student-${student.id}" name="absent" value="${student.id}" ${isAbsent ? 'checked' : ''}>
                                            </div>
                                        </td>
                                    </tr>
                                `
                            }).join('')}
                            </tbody>
                        </table>
                        <button type="submit" class="action-button" style="margin-top: 1rem;" ${!isCorrectDayOfWeek && course.dayOfWeek ? 'disabled' : ''}>${isEditing ? 'Atualizar Frequência' : 'Salvar Frequência'}</button>
                    </form>
                    `}
            </div>
             <div class="card">
                <h3 class="card-title">Histórico de Frequência</h3>
                ${Object.keys(attendanceHistory).length === 0 ? '<p>Nenhum histórico de frequência.</p>' : `
                 <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Data</th><th>Presentes</th><th>Faltas</th></tr></thead>
                        <tbody>
                            ${Object.entries(attendanceHistory).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)).map(([date, summary]) => {
                                const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
                                return `
                                    <tr>
                                        <td>${formattedDate}</td>
                                        <td>${summary.presentes}</td>
                                        <td>${summary.faltas}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                 </div>
                `}
            </div>
        </div>
    `;
}

async function renderEditCourseView(course) {
    const { data } = await apiCall('getTeachers', {}, 'GET');
    const teachers = data.teachers;

    return `
        <div class="view-header">
            <h2>Editando Curso: ${course.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">Cancelar</button>
        </div>
        <div class="card full-width">
             <form id="edit-course-form" onsubmit="window.handleUpdateCourse(event)">
                <input type="hidden" name="courseId" value="${course.id}">
                <div class="form-group">
                    <label for="editCourseName">Nome do Curso</label>
                    <input type="text" id="editCourseName" name="courseName" value="${course.name}" required>
                </div>
                <div class="form-group">
                    <div class="form-group-header">
                        <label for="editCourseDescription">Descrição</label>
                        <button type="button" class="action-button secondary generate-ai-button" onclick="window.handleGenerateDescription('edit-course-form')">Gerar com IA ✨</button>
                    </div>
                    <textarea id="editCourseDescription" name="courseDescription" rows="4" required>${course.description}</textarea>
                </div>
                 <div class="form-group">
                    <label for="editTeacherId">Professor</label>
                    <select id="editTeacherId" name="teacherId" required>
                        ${teachers.map((t) => `<option value="${t.id}" ${t.id === course.teacherId ? 'selected' : ''}>${t.firstName} ${t.lastName || ''}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="totalSlots">Número de Vagas</label>
                    <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Deixe em branco para ilimitado" value="${course.totalSlots || ''}">
                </div>
                <div class="form-group">
                    <label for="monthlyFee">Valor da Mensalidade (R$)</label>
                    <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" value="${course.monthlyFee || ''}" required>
                </div>
                <div class="form-group">
                    <label>Estrutura de Pagamento</label>
                    <div class="radio-group">
                        <label><input type="radio" name="paymentType" value="recorrente" ${course.paymentType === 'recorrente' ? 'checked' : ''} onchange="document.getElementById('edit-installments-group').style.display='none'"> Recorrente</label>
                        <label><input type="radio" name="paymentType" value="parcelado" ${course.paymentType === 'parcelado' ? 'checked' : ''} onchange="document.getElementById('edit-installments-group').style.display='block'"> Parcelado</label>
                    </div>
                </div>
                <div class="form-group" id="edit-installments-group" style="${course.paymentType === 'parcelado' ? 'display: block;' : 'display: none;'}">
                    <label for="edit-installments">Número de Parcelas</label>
                    <input type="number" id="edit-installments" name="installments" min="1" value="${course.installments || ''}">
                </div>
                 <div class="form-grid">
                    <div class="form-group">
                        <label for="dayOfWeek">Dia da Semana</label>
                        <select id="dayOfWeek" name="dayOfWeek">
                            <option value="" ${!course.dayOfWeek ? 'selected' : ''}>Nenhum</option>
                            <option value="Domingo" ${course.dayOfWeek === 'Domingo' ? 'selected' : ''}>Domingo</option>
                            <option value="Segunda-feira" ${course.dayOfWeek === 'Segunda-feira' ? 'selected' : ''}>Segunda-feira</option>
                            <option value="Terça-feira" ${course.dayOfWeek === 'Terça-feira' ? 'selected' : ''}>Terça-feira</option>
                            <option value="Quarta-feira" ${course.dayOfWeek === 'Quarta-feira' ? 'selected' : ''}>Quarta-feira</option>
                            <option value="Quinta-feira" ${course.dayOfWeek === 'Quinta-feira' ? 'selected' : ''}>Quinta-feira</option>
                            <option value="Sexta-feira" ${course.dayOfWeek === 'Sexta-feira' ? 'selected' : ''}>Sexta-feira</option>
                            <option value="Sábado" ${course.dayOfWeek === 'Sábado' ? 'selected' : ''}>Sábado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Horário de Início</label>
                        <input type="time" id="startTime" name="startTime" value="${course.startTime || ''}">
                    </div>
                    <div class="form-group">
                        <label for="endTime">Horário de Fim</label>
                        <input type="time" id="endTime" name="endTime" value="${course.endTime || ''}">
                    </div>
                </div>
                <button type="submit" class="action-button">Salvar Alterações</button>
            </form>
        </div>
    `;
}

async function renderCourseDetailsView(course) {
    const { data } = await apiCall('getCourseDetails', { courseId: course.id }, 'GET');
    const { teacher, students, admin } = data;
    
    const enrolledCount = students.length;
    const vacancies = course.totalSlots === null ? 'Ilimitadas' : Math.max(0, course.totalSlots - enrolledCount);

    let paymentInfo = course.paymentType === 'parcelado'
        ? `${course.installments} parcelas`
        : 'Recorrente';

    let auditInfo = '';
    if (course.status === 'Encerrado' && course.closed_by_admin_id && admin) {
        const date = new Date(course.closed_date).toLocaleString('pt-BR');
        auditInfo = `
            <div class="audit-info">
                <strong>Encerrado por:</strong> ${admin?.firstName || 'Admin desconhecido'} em ${date}
            </div>
        `;
    }

    return `
        <div class="view-header">
            <h2>Detalhes do Curso: ${course.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <div class="course-details-grid">
                <div><strong>Professor:</strong></div>
                <div>${teacher?.firstName} ${teacher?.lastName || ''}</div>

                <div><strong>Status:</strong></div>
                <div><span class="status-badge status-${course.status.toLowerCase()}">${course.status}</span></div>

                <div><strong>Vagas:</strong></div>
                <div>${enrolledCount} / ${course.totalSlots === null ? '∞' : course.totalSlots} (Restantes: ${vacancies})</div>
                
                <div><strong>Mensalidade:</strong></div>
                <div>${course.monthlyFee ? `R$ ${Number(course.monthlyFee).toFixed(2).replace('.', ',')} (${paymentInfo})` : 'Não definido'}</div>

                <div><strong>Agenda:</strong></div>
                <div>${course.dayOfWeek && course.startTime && course.endTime ? `${course.dayOfWeek}, das ${course.startTime} às ${course.endTime}` : 'Não definida'}</div>
            </div>
            ${auditInfo}
            <div class="course-description">
                <strong>Descrição:</strong><br>
                ${course.description.replace(/\n/g, '<br>')}
            </div>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Alunos Matriculados (${students.length})</h3>
            ${students.length > 0 ? `
                <ul class="list">
                    ${students.map((student) => `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${student.firstName} ${student.lastName || ''}</span>
                                <span class="list-item-subtitle">${student.email}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>Nenhum aluno com matrícula aprovada neste curso.</p>'}
        </div>
    `;
}

async function renderProfileView(userId) {
    const { data } = await apiCall('getProfileData', { userId }, 'GET');
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
                    ${enrollments.map((e) => `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${e.courseName || 'Curso não encontrado'}</span>
                            </div>
                            <div class="list-item-actions">
                                <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `}
        `;
    }

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

                    <div class="admin-only-section">
                       ${enrollmentsHtml}
                       ${(userToView.role === 'student') ? renderStudentFinancialHistory(userId, data.payments, true, isAdminViewer) : ''}
                    </div>

                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
}

async function renderSchoolProfileView() {
    if (!appState.currentUser || !(appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin')) {
        window.handleNavigateBackToDashboard();
        return '';
    }

    if (!appState.schoolProfile) {
        const { data } = await apiCall('getSchoolProfile', {}, 'GET');
        appState.schoolProfile = data.profile;
    }
    const profile = appState.schoolProfile;
    if (!profile) return '<h1>Erro ao carregar perfil da escola</h1>';


    const pixKeyTypes = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Aleatória'];

    return `
        <div class="view-header">
            <h2>Dados da Unidade de Ensino</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
             <form class="profile-form" onsubmit="window.handleUpdateSchoolProfile(event)">
                <div class="profile-pic-container">
                    <img id="school-pic-preview" class="profile-pic-preview" src="${profile.profilePicture || 'https://via.placeholder.com/150'}" alt="Logo da Escola">
                    <div class="form-group">
                        <label for="schoolProfilePicture">Alterar Logo</label>
                        <input type="file" id="schoolProfilePicture" name="schoolProfilePicture" accept="image/*" onchange="window.previewSchoolImage(event)">
                    </div>
                </div>

                <div class="profile-fields-container">
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="schoolName">Nome da Unidade</label>
                            <input type="text" id="schoolName" name="name" value="${profile.name}" required>
                        </div>
                         <div class="form-group">
                            <label for="cnpj">CNPJ</label>
                            <input type="text" id="cnpj" name="cnpj" value="${profile.cnpj}" required>
                        </div>
                         <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" value="${profile.phone}" required>
                        </div>
                    </div>
                     <div class="form-grid">
                        <div class="form-group">
                           <label for="pixKeyType">Tipo de Chave PIX</label>
                           <select id="pixKeyType" name="pixKeyType">
                             ${pixKeyTypes.map(type => `<option value="${type}" ${profile.pixKeyType === type ? 'selected' : ''}>${type}</option>`).join('')}
                           </select>
                        </div>
                         <div class="form-group">
                            <label for="pixKey">Chave PIX</label>
                            <input type="text" id="pixKey" name="pixKey" value="${profile.pixKey}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="schoolAddress">Endereço da Unidade</label>
                        <textarea id="schoolAddress" name="address" rows="3" required>${profile.address}</textarea>
                    </div>
                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
}

async function renderFinancialDashboardView() {
    const selectedDate = appState.financialState.selectedDate;
    const { data } = await apiCall('getFinancialDashboardData', { month: selectedDate }, 'GET');
    
    const { expectedRevenue, collectedRevenue, outstandingRevenue, evolutionData, revenueByCourseData } = data;
    const progress = (expectedRevenue > 0) ? (collectedRevenue / expectedRevenue) * 100 : (collectedRevenue > 0 ? 100 : 0);

    const monthlyStatusData = {
        'Pago': collectedRevenue,
        'Em Aberto': outstandingRevenue,
    };

    return `
        <div class="view-header">
            <h2>Dashboard Financeiro</h2>
            <div class="dashboard-controls">
                <label for="month-selector">Selecionar Mês:</label>
                <input type="month" id="month-selector" name="month" value="${selectedDate}" onchange="window.handleDashboardDateChange(event)">
            </div>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="card full-width">
            <div class="financial-summary-grid">
                <div class="summary-card">
                    <h3>Receita Prevista</h3>
                    <p>R$ ${Number(expectedRevenue).toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="summary-card">
                    <h3>Receita Arrecadada</h3>
                    <p>R$ ${Number(collectedRevenue).toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="summary-card">
                    <h3>Inadimplência</h3>
                    <p>R$ ${Number(outstandingRevenue).toFixed(2).replace('.', ',')}</p>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <p style="text-align: center; margin-top: 0.5rem; font-weight: 500;">${progress.toFixed(0)}% da meta arrecadada</p>
        </div>
        
         <div class="card full-width">
            <h3 class="card-title">Ações</h3>
            <button class="action-button" onclick="window.handleNavigateToFinancialControlPanel()">Gerenciar Pagamentos dos Alunos</button>
        </div>

        <div class="charts-grid three-cols">
            <div class="card chart-container">
                <h3 class="card-title">Pago vs. Em Aberto (Mês)</h3>
                ${generatePaidVsOutstandingBarChartSVG(monthlyStatusData)}
            </div>
            <div class="card chart-container">
                <h3 class="card-title">Receita por Curso (Mês)</h3>
                ${generateRevenueByCourseChartSVG(revenueByCourseData)}
            </div>
             <div class="card chart-container">
                <h3 class="card-title">Evolução da Receita (6 Meses)</h3>
                ${generateRevenueEvolutionChartSVG(evolutionData)}
            </div>
        </div>
    `;
}

async function renderFinancialControlPanelView() {
    const { data } = await apiCall('getActiveStudents', {}, 'GET');
    const activeStudents = data.students;

    return `
        <div class="view-header">
            <h2>Gerenciar Pagamentos</h2>
            <button class="back-button" onclick="window.handleNavigateToFinancialDashboard()">← Voltar ao Dashboard</button>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Alunos com Matrículas (${activeStudents.length})</h3>
            ${activeStudents.length === 0 ? '<p>Nenhum aluno ativo para gerenciar.</p>' : `
            <ul class="list finance-student-list">
                ${activeStudents.map((student) => `
                    <li class="list-item clickable" onclick="window.handleToggleFinanceStudent(${student.id})">
                        <div class="list-item-content">
                            <span class="list-item-title">${student.firstName} ${student.lastName || ''}</span>
                            <span class="list-item-subtitle">${student.email}</span>
                        </div>
                        <span class="expand-icon">${appState.financialState.expandedStudentId === student.id ? '▼' : '▶'}</span>
                    </li>
                    ${appState.financialState.expandedStudentId === student.id ? `
                        <li class="student-payment-details">
                            ${renderStudentFinancialHistory(student.id, appState.payments.filter(p => p.studentId === student.id), true, true)}
                        </li>
                    ` : ''}
                `).join('')}
            </ul>
            `}
        </div>
    `;
}

function renderStudentFinancialHistory(studentId, studentPayments, isAdminView = false, allowActions = false) {
    studentPayments.sort((a, b) => b.referenceDate.localeCompare(a.referenceDate));
        
    const title = isAdminView ? "Histórico Financeiro" : "Meu Histórico Financeiro";

    const pendingPayments = studentPayments.filter(p => p.status === 'Pendente' || p.status === 'Atrasado');
    
    let bulkPayButton = '';
    if (!isAdminView && pendingPayments.length > 1) {
        const pendingIds = pendingPayments.map(p => p.id).join(',');
        bulkPayButton = `<div style="margin-bottom: 1rem;"><button class="action-button" onclick="window.handleInitiatePixPayment([${pendingIds}])">Pagar todas as pendências com PIX</button></div>`;
    }
    
    return `
        <h4 class="card-title">${title}</h4>
        ${bulkPayButton}
        ${studentPayments.length === 0 ? '<p>Nenhum histórico de pagamento encontrado.</p>' : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Mês de Referência</th>
                            <th>Curso</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                       ${studentPayments.map(p => {
                           const course = appState.courses.find(c => c.id === p.courseId);
                           const refDate = new Date(p.referenceDate + 'T00:00:00');
                           const dueDate = new Date(p.dueDate + 'T00:00:00');
                           let actionHtml = '<td>-</td>';
                           
                           if (allowActions) {
                               actionHtml = `<td>
                                 <select class="payment-status-select" onchange="window.handlePaymentStatusChange(event, ${p.id})">
                                    <option value="Pendente" ${p.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="Pago" ${p.status === 'Pago' ? 'selected' : ''}>Pago</option>
                                    <option value="Atrasado" ${p.status === 'Atrasado' ? 'selected' : ''}>Atrasado</option>
                                    <option value="Cancelado" ${p.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                 </select>
                               </td>`;
                           } else if ((p.status === 'Pendente' || p.status === 'Atrasado')) {
                               actionHtml = `<td><button class="action-button" onclick="window.handleInitiatePixPayment([${p.id}])">Pagar com PIX</button></td>`;
                           }


                           return `
                            <tr class="${p.status === 'Cancelado' ? 'text-strikethrough' : ''}">
                                <td>${refDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td>
                                <td>${course?.name || 'N/A'}</td>
                                <td>R$ ${Number(p.amount).toFixed(2).replace('.', ',')}</td>
                                <td>${dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                                ${actionHtml}
                            </tr>
                           `
                       }).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}

function renderPixPaymentModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            window.handleClosePixModal();
        }
    };

    let modalBodyHtml = '';
    const { content: pixModalContent, isOpen } = appState.pixModal;
    const schoolProfile = appState.schoolProfile;

    if (!isOpen) return modalOverlay;

    if (!pixModalContent) {
        modalBodyHtml = `
            <div class="pix-status-container">
                <div class="spinner"></div>
                <span>Gerando cobrança PIX...</span>
            </div>
        `;
    } else {
        const { qrCodeUrl, pixCode, totalAmount, coursesInfo } = pixModalContent;
        const receiverName = schoolProfile?.name || '';
        const receiverKey = `(${schoolProfile?.pixKeyType}): ${schoolProfile?.pixKey}`;

        modalBodyHtml = `
            <p>Para pagar, aponte a câmera do seu celular para o QR Code ou utilize o código "Copia e Cola".</p>
            <div class="qr-code-placeholder">
                <img src="${qrCodeUrl}" alt="PIX QR Code" />
            </div>
            <div class="pix-copy-paste">
                <input type="text" id="pix-code" value="${pixCode}" readonly>
                <button onclick="window.handleCopyPixCode()">Copiar</button>
            </div>
            <div class="payment-summary">
                <h4>Resumo do Pagamento</h4>
                <p><strong>Valor Total:</strong> R$ ${totalAmount.toFixed(2).replace('.', ',')}</p>
                <p><strong>Recebedor:</strong> ${receiverName}</p>
                <p><strong>Chave PIX ${receiverKey}</strong></p>
                <p><strong>Referente a:</strong> ${coursesInfo}</p>
            </div>
        `;
    }

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="window.handleClosePixModal()">×</button>
            <h2>Pagamento via PIX</h2>
            <div class="pix-modal-body">
                ${modalBodyHtml}
            </div>
        </div>
    `;

    return modalOverlay;
}

async function renderSystemSettingsView() {
    if (!appState.systemSettings) {
        const { data } = await apiCall('getSystemSettings', {}, 'GET');
        appState.systemSettings = data.settings;
    }
    const settings = appState.systemSettings;
    if (!settings) return `<h2>Erro ao carregar configurações</h2>`;

    return `
        <div class="view-header">
            <h2>Configurações do Sistema</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <form onsubmit="window.handleUpdateSystemSettings(event)">
                <div class="settings-grid">
                    <div class="settings-section">
                        <h3 class="card-title">⚙️ Geral</h3>
                        <div class="form-group">
                            <label for="language">Linguagem</label>
                            <select id="language" name="language">
                                <option value="pt-BR" ${settings.language === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option>
                                <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>Inglês (EUA)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="timeZone">Fuso Horário (NTP)</label>
                            <input type="text" id="timeZone" name="timeZone" value="${settings.timeZone}">
                            <small>Ex: America/Sao_Paulo, Europe/Lisbon, UTC</small>
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">💰 Financeiro</h3>
                        <div class="form-group">
                            <label for="currencySymbol">Símbolo da Moeda</label>
                            <input type="text" id="currencySymbol" name="currencySymbol" value="${settings.currencySymbol}">
                        </div>
                         <div class="form-group">
                            <label for="defaultDueDay">Dia Padrão de Vencimento</label>
                            <input type="number" id="defaultDueDay" name="defaultDueDay" value="${settings.defaultDueDay}" min="1" max="28">
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">🤖 Integração com IA</h3>
                        <div class="form-group">
                            <p>A integração com IA (Gemini) está ativada.</p>
                            <small>A chave de API é gerenciada pelo ambiente do servidor.</small>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">✉️ E-mail (SMTP)</h3>
                        <div class="form-group">
                            <label for="smtpServer">Servidor SMTP</label>
                            <input type="text" id="smtpServer" name="smtpServer" value="${settings.smtpServer}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPort">Porta</label>
                            <input type="text" id="smtpPort" name="smtpPort" value="${settings.smtpPort}">
                        </div>
                        <div class="form-group">
                            <label for="smtpUser">Usuário</label>
                            <input type="text" id="smtpUser" name="smtpUser" value="${settings.smtpUser}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPass">Senha</label>
                            <input type="password" id="smtpPass" name="smtpPass" value="${settings.smtpPass}">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">💾 Base de Dados</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="dbHost">Host</label>
                                <input type="text" id="dbHost" name="dbHost" value="${settings.dbHost || ''}">
                            </div>
                            <div class="form-group">
                                <label for="dbPort">Porta</label>
                                <input type="text" id="dbPort" name="dbPort" value="${settings.dbPort || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="dbName">Nome da Base</label>
                            <input type="text" id="dbName" name="dbName" value="${settings.dbName || ''}">
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="dbUser">Usuário</label>
                                <input type="text" id="dbUser" name="dbUser" value="${settings.dbUser || ''}">
                            </div>
                            <div class="form-group">
                                <label for="dbPass">Senha</label>
                                <input type="password" id="dbPass" name="dbPass" value="${settings.dbPass || ''}">
                            </div>
                        </div>
                        <button type="button" class="action-button secondary" onclick="window.handleExportDatabase()" style="margin-top: 1rem;">Exportar Dados Atuais (JSON)</button>
                        <small style="display: block; margin-top: 0.5rem;">Exporta todos os dados do banco para um arquivo JSON.</small>
                    </div>
                </div>
                <button type="submit" class="action-button" style="margin-top: 2rem;">Salvar Configurações</button>
            </form>
        </div>
    `;
}



// --- CHART GENERATORS (Unchanged) ---

function generateRevenueEvolutionChartSVG(data) {
    if (data.length === 0) return '<p>Dados insuficientes para gerar o gráfico.</p>';
    
    const svgWidth = 500;
    const svgHeight = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const maxVal = Math.max(...data.flatMap(d => [Number(d.expected), Number(d.collected)]), 0);
    const yScale = (val) => chartHeight - (val / (maxVal > 0 ? maxVal : 1)) * chartHeight;

    const yAxisTicks = 5;
    const yAxisHtml = Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
        const val = (maxVal / yAxisTicks) * i;
        const y = yScale(val);
        return `<g class="y-tick">
            <line x1="${-5}" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="2,2" />
            <text x="${-10}" y="${y + 5}" text-anchor="end">R$${val.toFixed(0)}</text>
        </g>`;
    }).join('');

    const barWidth = chartWidth / data.length / 2.5;
    const barGap = chartWidth / data.length;

    const barsHtml = data.map((d, i) => {
        const xExpected = i * barGap + barGap / 2 - barWidth;
        const xCollected = i * barGap + barGap / 2;
        return `
            <g class="bar-group">
                <rect class="bar expected" x="${xExpected}" y="${yScale(Number(d.expected))}" width="${barWidth}" height="${chartHeight - yScale(Number(d.expected))}">
                    <title>Previsto: R$ ${Number(d.expected).toFixed(2)}</title>
                </rect>
                <rect class="bar collected" x="${xCollected}" y="${yScale(Number(d.collected))}" width="${barWidth}" height="${chartHeight - yScale(Number(d.collected))}">
                     <title>Arrecadado: R$ ${Number(d.collected).toFixed(2)}</title>
                </rect>
                <text class="x-axis-label" x="${i * barGap + barGap / 2}" y="${chartHeight + 20}" text-anchor="middle">${d.month}</text>
            </g>`;
    }).join('');

    return `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="chart bar-chart" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(${margin.left}, ${margin.top})">
                <g class="y-axis">${yAxisHtml}</g>
                <g class="x-axis">
                    <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#333" />
                </g>
                ${barsHtml}
            </g>
             <g class="legend" transform="translate(${margin.left}, ${svgHeight - 10})">
                <rect x="0" y="-10" width="12" height="12" class="bar expected" />
                <text x="18" y="0">Previsto</text>
                <rect x="80" y="-10" width="12" height="12" class="bar collected" />
                <text x="98" y="0">Arrecadado</text>
            </g>
        </svg>
    `;
}

function generateRevenueByCourseChartSVG(data) {
    const entries = Object.entries(data);
    if (entries.length === 0) return '<p>Nenhuma receita registrada este mês para exibir o gráfico.</p>';
    
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6610f2'];
    const total = entries.reduce((sum, [, val]) => sum + Number(val), 0);
    if(total === 0) return '<p>Nenhuma receita registrada este mês para exibir o gráfico.</p>';

    let startAngle = 0;
    const slices = entries.map(([name, value], i) => {
        const percentage = (Number(value) / total);
        const angle = percentage * 360;
        const endAngle = startAngle + angle;
        
        const x1 = Math.cos(Math.PI / 180 * startAngle);
        const y1 = Math.sin(Math.PI / 180 * startAngle);
        const x2 = Math.cos(Math.PI / 180 * endAngle);
        const y2 = Math.sin(Math.PI / 180 * endAngle);
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = `M ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} L 0 0 Z`;
        
        startAngle = endAngle;

        return `
            <path d="${pathData}" fill="${colors[i % colors.length]}" class="pie-slice">
                <title>${name}: R$ ${Number(value).toFixed(2)} (${(percentage * 100).toFixed(1)}%)</title>
            </path>
        `;
    }).join('');

    const legendHtml = entries.map(([name, value], i) => {
        const percentage = (Number(value) / total * 100).toFixed(1);
        return `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${colors[i % colors.length]}"></span>
                <span class="legend-label">${name} (${percentage}%)</span>
            </div>
        `;
    }).join('');

    return `
        <div class="pie-chart-container">
            <svg viewBox="-1.1 -1.1 2.2 2.2" class="chart pie-chart">
                ${slices}
            </svg>
            <div class="pie-chart-legend">
                ${legendHtml}
            </div>
        </div>
    `;
}

function generatePaidVsOutstandingBarChartSVG(data) {
    const svgWidth = 400;
    const svgHeight = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const dataEntries = Object.entries(data);
    const maxVal = Math.max(...Object.values(data).map(Number), 0);
    const yScale = (val) => chartHeight - (val / (maxVal > 0 ? maxVal : 1)) * chartHeight;
    const colors = { 'Pago': 'var(--status-pago-text)', 'Em Aberto': 'var(--status-atrasado-text)' };

    const yAxisTicks = 5;
    const yAxisHtml = Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
        const val = (maxVal / yAxisTicks) * i;
        const y = yScale(val);
        return `<g class="y-tick">
            <line x1="${-5}" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="2,2" />
            <text x="${-10}" y="${y + 5}" text-anchor="end">R$${val.toFixed(0)}</text>
        </g>`;
    }).join('');

    const barWidth = chartWidth / dataEntries.length / 2;
    const barGap = chartWidth / dataEntries.length;

    const barsHtml = dataEntries.map(([status, value], i) => {
        const x = i * barGap + barGap / 2 - barWidth / 2;
        const color = colors[status];
        return `
            <g class="bar-group">
                <rect class="bar" x="${x}" y="${yScale(Number(value))}" width="${barWidth}" height="${chartHeight - yScale(Number(value))}" style="fill: ${color};">
                    <title>${status}: R$ ${Number(value).toFixed(2)}</title>
                </rect>
                 <text class="x-axis-label" x="${i * barGap + barGap / 2}" y="${chartHeight + 20}" text-anchor="middle">${status}</text>
            </g>`;
    }).join('');

    return `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="chart bar-chart" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(${margin.left}, ${margin.top})">
                <g class="y-axis">${yAxisHtml}</g>
                <g class="x-axis">
                    <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#333" />
                </g>
                ${barsHtml}
            </g>
        </svg>
    `;
}

// --- PIX HELPERS ---
function formatField(id, value) {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}
function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}
function generateBrCode(pixKey, amount, merchantName, merchantCity, txid = '***', description = null) {
    const sanitizedName = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    const sanitizedCity = merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
    const amountString = amount ? amount.toFixed(2) : null;
    let merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey);
    if (description) {
        const sanitizedDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 72);
        merchantAccountInfo += formatField('02', sanitizedDescription);
    }
    const payloadFields = [
        formatField('00', '01'),
        formatField('26', merchantAccountInfo),
        formatField('52', '0000'),
        formatField('53', '986'),
    ];
    if (amountString) {
        payloadFields.push(formatField('54', amountString));
    }
    payloadFields.push(
        formatField('58', 'BR'),
        formatField('59', sanitizedName),
        formatField('60', sanitizedCity),
        formatField('62', formatField('05', txid))
    );
    const payload = payloadFields.join('');
    const payloadWithCrcPlaceholder = `${payload}6304`;
    const crc = crc16(payloadWithCrcPlaceholder);
    return `${payloadWithCrcPlaceholder}${crc}`;
}


// --- EVENT HANDLERS & HELPERS ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

window.handleLogin = async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.elements.namedItem('email').value;
    const password = form.elements.namedItem('password').value;

    try {
        const result = await apiCall('login', { email, password });
        // Correctly access nested user data
        if (result && result.data && result.data.user) {
            appState.currentUser = result.data.user;
            appState.currentView = 'dashboard';
            render();
        } else {
             throw new Error("Resposta de login inválida do servidor.");
        }
    } catch (error) {
       // Error is already alerted by apiCall
    }
}

window.handleRegister = async (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.namedItem('name').value;
    const email = form.elements.namedItem('email').value;
    const password = form.elements.namedItem('password').value;

    try {
        await apiCall('register', { name, email, password });
        alert('Cadastro realizado com sucesso! Faça o login.');
        appState.currentView = 'login';
        render();
    } catch(error) {
       // Error handled by apiCall
    }
}

window.navigateTo = (view) => {
    appState.currentView = view;
    render();
}

window.handleLogout = () => {
    appState.currentUser = null;
    appState.currentView = 'login';
    // Reset all state
    Object.assign(appState, {
        users: [], courses: [], enrollments: [], attendance: [], payments: [],
        adminView: 'dashboard', viewingCourseId: null, viewingUserId: null,
        userFilters: { name: '', role: 'all', courseId: 'all', enrollmentStatus: 'all' },
        attendanceState: { courseId: null, selectedDate: new Date().toISOString().split('T')[0], students: [], history: {} },
        financialState: { isDashboardVisible: false, isControlPanelVisible: false, selectedDate: new Date().toISOString().slice(0, 7), expandedStudentId: null },
        pixModal: { isOpen: false, paymentIds: [], content: null }
    });
    render();
}

window.handleEnroll = async (event) => {
    if (!appState.currentUser || appState.currentUser.role !== 'student') return;

    const button = event.target;
    const courseId = parseInt(button.dataset.courseId, 10);

    try {
        await apiCall('enroll', { studentId: appState.currentUser.id, courseId });
        alert('Solicitação de matrícula enviada! Aguarde a aprovação do administrador.');
        render();
    } catch (e) {
        // Error handled by apiCall
    }
}

window.handleApprove = async (event) => {
    event.preventDefault();
    const form = event.target;
    const studentId = parseInt(form.dataset.studentId, 10);
    const courseId = parseInt(form.dataset.courseId, 10);
    const billingStartChoice = form.elements.namedItem('billingStart').value;

    try {
        await apiCall('approveEnrollment', { studentId, courseId, billingStartChoice });
        render();
    } catch (e) {
        // Error handled by apiCall
    }
}

window.handleSaveAttendance = async (event) => {
    event.preventDefault();
    const form = event.target;
    const courseId = parseInt(form.dataset.courseId, 10);
    const date = form.elements.namedItem('attendanceDate').value;
    const formData = new FormData(form);
    const absentStudentIds = formData.getAll('absent').map(id => parseInt(id, 10));
    
    try {
        await apiCall('saveAttendance', { courseId, date, absentStudentIds });
        alert('Frequência salva com sucesso!');
        render();
    } catch(e) {
        // Error handled
    }
}

window.handleCreateCourse = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData.entries());
    
    try {
        await apiCall('createCourse', { courseData });
        window.handleNavigateBackToDashboard();
    } catch(e) {
        // error handled
    }
}

window.handleUpdateCourse = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData.entries());

    try {
        await apiCall('updateCourse', { courseData });
        alert('Curso atualizado com sucesso!');
        appState.viewingCourseId = null;
        appState.adminView = 'dashboard';
        render();
    } catch(e) {
        // error handled
    }
}

window.handleUpdateProfile = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId'), 10);
    
    const profileData = {};
    formData.forEach((value, key) => {
        if (key !== 'profilePicture') {
            profileData[key] = value;
        }
    });

    const profilePicFile = formData.get('profilePicture');
    if (profilePicFile && profilePicFile.size > 0) {
        profileData.profilePicture = await fileToBase64(profilePicFile);
    }

    try {
        await apiCall('updateProfile', { userId, profileData });
        alert('Perfil atualizado com sucesso!');
        window.handleNavigateBackToDashboard();
    } catch (e) {}
};

window.handleUpdateSchoolProfile = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const profileData = Object.fromEntries(formData.entries());

    const schoolPicFile = formData.get('schoolProfilePicture');
    if (schoolPicFile && schoolPicFile.size > 0) {
        profileData.profilePicture = await fileToBase64(schoolPicFile);
    }

    try {
        await apiCall('updateSchoolProfile', { profileData });
        alert('Dados da unidade atualizados com sucesso!');
        window.handleNavigateBackToDashboard();
    } catch (e) {}
}

window.handleUpdateSystemSettings = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const settingsData = Object.fromEntries(formData.entries());
    
    try {
        await apiCall('updateSystemSettings', { settingsData });
        alert('Configurações salvas com sucesso!');
        appState.systemSettings = null; // force reload
        window.handleNavigateBackToDashboard();
    } catch(e) {}
}

window.previewProfileImage = (event) => {
    const input = event.target;
    const preview = document.getElementById('profile-pic-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                preview.src = e.target.result;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

window.previewSchoolImage = (event) => {
    const input = event.target;
    const preview = document.getElementById('school-pic-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                preview.src = e.target.result;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

window.handleRoleChange = async (event, userId) => {
    const select = event.target;
    const newRole = select.value;
    try {
        await apiCall('updateUserRole', { userId, newRole });
        render();
    } catch(e) {}
}

window.handleUserFilterChange = (event) => {
    const input = event.target;
    const { name, value } = input;
    if (name === 'courseId') {
        appState.userFilters.courseId = value === 'all' ? 'all' : parseInt(value, 10);
        if (appState.userFilters.courseId === 'all') {
            appState.userFilters.enrollmentStatus = 'all';
        }
    } else {
        appState.userFilters[name] = value;
    }
    render();
}

window.handleDashboardDateChange = (event) => {
    const input = event.target;
    appState.financialState.selectedDate = input.value;
    render();
}

window.handleAttendanceDateChange = (event) => {
    const input = event.target;
    appState.attendanceState.selectedDate = input.value;
    appState.viewingCourseId = appState.attendanceState.courseId; // Stay on the same view
    appState.adminView = 'attendance';
    render();
}

window.handleEndCourse = async (courseId) => {
    if(!appState.currentUser) return;
    try {
        await apiCall('endCourse', { courseId, adminId: appState.currentUser.id });
        render();
    } catch(e) {}
}

window.handleReopenCourse = async (courseId) => {
    if (appState.currentUser?.role !== 'superadmin') {
        alert('Apenas o superadmin pode reabrir cursos.');
        return;
    }
    try {
        await apiCall('reopenCourse', { courseId });
        render();
    } catch(e) {}
}

window.handleNavigateToAttendance = async (courseId) => {
    appState.attendanceState.courseId = courseId;
    appState.viewingCourseId = courseId;
    appState.adminView = 'attendance';
    appState.attendanceState.selectedDate = new Date().toISOString().split('T')[0];
    render();
}

window.handleNavigateToEditCourse = async (courseId) => {
    appState.viewingCourseId = courseId;
    appState.adminView = 'editCourse';
    render();
}

window.handleNavigateToCreateCourse = () => {
    appState.adminView = 'createCourse';
    render();
};

window.handleNavigateToCourseDetails = async (courseId) => {
    appState.viewingCourseId = courseId;
    appState.adminView = 'details';
    render();
}

window.handleNavigateToUserManagement = async () => {
    appState.adminView = 'userManagement';
    render();
}

window.handleNavigateToSystemSettings = async () => {
    appState.adminView = 'systemSettings';
    render();
};

window.handleNavigateToProfile = async (userId) => {
    appState.viewingUserId = userId;
    render();
}

window.handleNavigateToSchoolProfile = async () => {
    appState.viewingUserId = -1; // Special flag for school profile
    appRoot.innerHTML = await renderSchoolProfileView(); // direct render
}

window.handleNavigateToFinancialDashboard = async () => {
    appState.financialState.isDashboardVisible = true;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.expandedStudentId = null;
    render();
}

window.handleNavigateToFinancialControlPanel = async () => {
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = true;
    render();
}

window.handleToggleFinanceStudent = async (studentId) => {
    const { financialState } = appState;
    if (financialState.expandedStudentId === studentId) {
        financialState.expandedStudentId = null;
    } else {
        financialState.expandedStudentId = studentId;
        const { data } = await apiCall('getStudentPayments', { studentId }, 'GET');
        appState.payments = data.payments;
    }
    render();
}

window.handlePaymentStatusChange = async (event, paymentId) => {
    const select = event.target;
    const newStatus = select.value;
    try {
        await apiCall('updatePaymentStatus', { paymentId, status: newStatus });
        render();
    } catch(e) {}
};

window.handleInitiatePixPayment = (paymentIds) => {
    if (!appState.schoolProfile) return;
    appState.pixModal.isOpen = true;
    appState.pixModal.paymentIds = paymentIds;

    const paymentsToProcess = appState.payments.filter(p => paymentIds.includes(p.id));
    if (paymentsToProcess.length === 0) {
        alert("Nenhum pagamento selecionado.");
        appState.pixModal.isOpen = false;
        return;
    }
    const totalAmount = paymentsToProcess.reduce((sum, p) => sum + Number(p.amount), 0);
    const coursesInfo = [...new Set(paymentsToProcess.map(p => appState.courses.find(c => c.id === p.courseId)?.name))].filter(Boolean).join(', ');
    
    const txid = `SGE${Date.now()}`;
    
    const pixCode = generateBrCode(appState.schoolProfile.pixKey, totalAmount, appState.schoolProfile.name, 'SAO PAULO', txid, coursesInfo);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;

    appState.pixModal.content = {
        qrCodeUrl,
        pixCode,
        totalAmount,
        coursesInfo,
    };
    
    render();
};

window.handleClosePixModal = () => {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    appState.pixModal = { isOpen: false, paymentIds: [], content: null };
    render();
};

window.handleCopyPixCode = () => {
    const input = document.getElementById('pix-code');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value);
        alert('Código PIX copiado!');
    }
};

window.handleGenerateDescription = async (formId) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        alert('A chave de API de IA não está configurada no ambiente do servidor.');
        return;
    }

    const form = document.getElementById(formId);
    const courseNameInput = form.elements.namedItem('courseName');
    const descriptionTextarea = form.elements.namedItem('courseDescription');
    const generateButton = form.querySelector('.generate-ai-button');

    const courseName = courseNameInput.value;
    if (!courseName) {
        alert('Por favor, insira um nome para o curso antes de gerar a descrição.');
        return;
    }

    generateButton.disabled = true;
    generateButton.textContent = 'Gerando...';

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Gere uma descrição curta e atrativa para um curso de artes chamado "${courseName}". A descrição deve ter no máximo 200 caracteres e destacar os principais benefícios ou aprendizados.`,
        });
        const description = response.text;
        descriptionTextarea.value = description.trim();
    } catch (error) {
        console.error("AI description generation failed:", error);
        alert("Ocorreu um erro ao gerar a descrição com IA. Verifique sua chave de API e a conexão com a internet.");
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = 'Gerar com IA ✨';
    }
};

window.handleExportDatabase = async () => {
    try {
        const { data } = await apiCall('exportDatabase', {}, 'GET');
        const dataStr = JSON.stringify(data.exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sge_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Exportação concluída com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
    }
};

window.handleNavigateBackToDashboard = () => {
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.attendanceState.courseId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.adminView = 'dashboard';
    render();
};

// --- Drag and Drop Handlers (Unchanged) ---
let draggedElement = null;
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}
window.handleDragStart = (event) => {
    if (event.target && event.target.classList.contains('card')) {
        draggedElement = event.target;
        setTimeout(() => {
            draggedElement.classList.add('dragging');
        }, 0);
    }
};
window.handleDragEnd = () => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
};
window.handleDragOver = (event) => {
    event.preventDefault();
    const container = event.target.closest('.dashboard-grid');
    if (container && draggedElement) {
        const afterElement = getDragAfterElement(container, event.clientY);
        if (afterElement == null) {
            container.appendChild(draggedElement);
        } else {
            container.insertBefore(draggedElement, afterElement);
        }
    }
};
window.handleDrop = (event) => {
    event.preventDefault();
     const container = event.target.closest('.dashboard-grid');
    if (container && appState.currentUser) {
        const cardIds = [...container.querySelectorAll('.card')].map(card => card.id);
        localStorage.setItem(`cardOrder_${appState.currentUser.id}`, JSON.stringify(cardIds));
    }
};


// --- INITIALIZATION ---
function applyCardOrder() {
    if (!appState.currentUser) return;
    const grid = appRoot.querySelector('.dashboard-grid');
    if (!grid) return;

    const savedOrder = localStorage.getItem(`cardOrder_${appState.currentUser.id}`);
    if (savedOrder) {
        try {
            const order = JSON.parse(savedOrder);
            const fragment = document.createDocumentFragment();
            order.forEach((cardId) => {
                const card = document.getElementById(cardId);
                if (card) {
                    fragment.appendChild(card);
                }
            });
            grid.appendChild(fragment);
        } catch (e) {
            console.error("Failed to parse card order from localStorage", e);
        }
    }
}

function init() {
  render();
}

init();
