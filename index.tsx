/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// --- TYPES ---
type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'unassigned';
type PaymentStatus = 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
type PixKeyType = 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Aleatória';

interface User {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: UserRole;
  age?: number;
  profilePicture?: string; // base64
  address?: string;
  resetToken?: string;
  resetTokenExpiry?: number; // timestamp
}

type CourseStatus = 'Aberto' | 'Encerrado';
type PaymentType = 'recorrente' | 'parcelado';

interface Course {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  totalSlots: number | null; // null means unlimited
  status: CourseStatus;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  monthlyFee?: number;
  paymentType: PaymentType;
  installments?: number;
  closedBy?: { adminId: number; date: string; };
}

interface SchoolProfile {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    pixKeyType: PixKeyType;
    pixKey: string;
    profilePicture?: string; // base64
}

interface SystemSettings {
    smtpServer: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    language: 'pt-BR' | 'en-US';
    timeZone: string;
    currencySymbol: string;
    defaultDueDay: number;
    aiApiKey?: string;
    dbHost?: string;
    dbUser?: string;
    dbPass?: string;
    dbName?: string;
    dbPort?: string;
}


type EnrollmentStatus = 'Pendente' | 'Aprovada';
interface Enrollment {
  studentId: number;
  courseId: number;
  status: EnrollmentStatus;
  billingStartDate?: string; // YYYY-MM-DD
}

type AttendanceStatus = 'Presente' | 'Falta';
interface AttendanceRecord {
    courseId: number;
    studentId: number;
    date: string; // YYYY-MM-DD
    status: AttendanceStatus;
}

interface Payment {
    id: number;
    studentId: number;
    courseId: number;
    amount: number;
    referenceDate: string; // YYYY-MM-01
    dueDate: string; // YYYY-MM-DD
    status: PaymentStatus;
    paymentDate?: string; // YYYY-MM-DD
}

interface Database {
    users: User[];
    courses: Course[];
    schoolProfile: SchoolProfile;
    systemSettings: SystemSettings;
    enrollments: Enrollment[];
    attendance: AttendanceRecord[];
    payments: Payment[];
    nextUserId: number;
    nextCourseId: number;
    nextPaymentId: number;
}


declare global {
    interface Window {
        handleLogin: (event: Event) => Promise<void>;
        handleRegister: (event: Event) => Promise<void>;
        handleLogout: () => void;
        navigateTo: (view: 'login' | 'register' | 'forgotPassword') => void;
        handleForgotPassword: (event: Event) => void;
        handleResetPassword: (event: Event) => Promise<void>;
        handleEnroll: (event: Event) => void;
        handleApprove: (event: Event) => void;
        handleSaveAttendance: (event: Event) => void;
        handleCreateCourse: (event: Event) => void;
        handleRoleChange: (event: Event, userId: number) => void;
        handleEndCourse: (courseId: number) => void;
        handleReopenCourse: (courseId: number) => void;
        handleNavigateToAttendance: (courseId: number) => void;
        handleNavigateBackToDashboard: () => void;
        handleNavigateToUserManagement: () => void;
        handleUserFilterChange: (event: Event) => void;
        handleNavigateToEditCourse: (courseId: number) => void;
        handleUpdateCourse: (event: Event) => void;
        handleNavigateToCourseDetails: (courseId: number) => void;
        handleNavigateToProfile: (userId: number) => void;
        handleNavigateToSchoolProfile: () => void;
        handleUpdateProfile: (event: Event) => Promise<void>;
        handleUpdateSchoolProfile: (event: Event) => Promise<void>;
        previewProfileImage: (event: Event) => void;
        previewSchoolImage: (event: Event) => void;
        handleNavigateToFinancialDashboard: () => void;
        handlePaymentStatusChange: (event: Event, paymentId: number) => void;
        handleNavigateToFinancialControlPanel: () => void;
        handleToggleFinanceStudent: (studentId: number) => void;
        handleDashboardDateChange: (event: Event) => void;
        handleInitiatePixPayment: (paymentIds: number[]) => void;
        handleClosePixModal: () => void;
        handleCopyPixCode: () => void;
        handleDragStart: (event: DragEvent) => void;
        handleDragOver: (event: DragEvent) => void;
        handleDrop: (event: DragEvent) => void;
        handleDragEnd: (event: DragEvent) => void;
        handleNavigateToSystemSettings: () => void;
        handleUpdateSystemSettings: (event: Event) => void;
        handleGenerateDescription: (formId: 'create-course-form' | 'edit-course-form') => Promise<void>;
        handleNavigateToCreateCourse: () => void;
        handleAttendanceDateChange: (event: Event) => void;
        handleExportDatabase: () => void;
    }
}

// --- SIMULATED DATABASE ---
let db: Database;

// --- DB Persistence ---
function loadDb(): Database | null {
    const config = localStorage.getItem('sge_config');
    if (!config) {
        if (!window.location.pathname.includes('install')) {
            window.location.href = 'install/index.html';
        }
        return null;
    }
    return JSON.parse(config);
}

function saveDb() {
    localStorage.setItem('sge_config', JSON.stringify(db));
}

// --- SECURITY HELPERS ---
const salt = 'SGE_PROTOTYPE_SALT_v1';
// In a real app, use a strong library like bcrypt.
// For this prototype, a simple base64 encoding simulates a hash.
async function hashPassword(password: string): Promise<string> {
    return btoa(password + salt);
}
async function checkPassword(password: string, hash: string): Promise<boolean> {
    return (await hashPassword(password)) === hash;
}


// --- DOM Elements ---
const appRoot = document.getElementById('app-root') as HTMLElement;
const appHeader = document.getElementById('app-header') as HTMLElement;

// --- APP STATE ---
let currentUser: User | null = null;
let currentView: 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'dashboard' = 'login';
let currentAdminView: 'dashboard' | 'userManagement' | 'systemSettings' | 'createCourse' = 'dashboard';
let currentCourseIdForAttendance: number | null = null;
let attendanceSelectedDate: string = new Date().toISOString().split('T')[0];
let currentCourseIdForEditing: number | null = null;
let currentCourseIdForDetails: number | null = null;
let currentProfileUserId: number | null = null;
let isViewingSchoolProfile: boolean = false;
let isViewingFinancialDashboard: boolean = false;
let isViewingFinancialControlPanel: boolean = false;
let expandedStudentIdForFinance: number | null = null;
let dashboardSelectedDate: string = new Date().toISOString().slice(0, 7); // YYYY-MM
let passwordResetToken: string | null = null;

// PIX Payment State
let isPixModalOpen = false;
let pixPaymentIds: number[] = [];
let pixModalContent: { qrCodeUrl: string; pixCode: string; totalAmount: number; coursesInfo: string; } | null = null;


let userFilters = {
    name: '',
    role: 'all' as UserRole | 'all',
    courseId: 'all' as number | 'all',
    enrollmentStatus: 'all' as EnrollmentStatus | 'all',
};

// --- DB Persistence ---
function loadDb(): Database | null {
    const config = localStorage.getItem('sge_config');
    if (!config) {
        if (!window.location.pathname.includes('install')) {
            window.location.href = 'install/index.html';
        }
        return null;
    }
    return JSON.parse(config);
}

function saveDb() {
    localStorage.setItem('sge_config', JSON.stringify(db));
}

// --- RENDER FUNCTIONS ---
function render() {
  if (!db) return; // Don't render if DB is not loaded
  updateOverduePayments();
  renderHeader();
  if (!appRoot) return;
  
  // Clear root before rendering new content
  appRoot.innerHTML = '';
  
  if (isPixModalOpen) {
      document.body.appendChild(renderPixPaymentModal());
  }

  if (isViewingFinancialControlPanel) {
      appRoot.innerHTML = renderFinancialControlPanelView();
      return;
  }

  if (isViewingFinancialDashboard) {
      appRoot.innerHTML = renderFinancialDashboardView();
      return;
  }

  if (currentProfileUserId !== null) {
      appRoot.innerHTML = renderProfileView(currentProfileUserId);
      return;
  }
  
  if (isViewingSchoolProfile) {
      appRoot.innerHTML = renderSchoolProfileView();
      return;
  }

  if (currentCourseIdForDetails !== null) {
      appRoot.innerHTML = renderCourseDetailsView(currentCourseIdForDetails);
      return;
  }
  
  if (currentCourseIdForAttendance !== null) {
      appRoot.innerHTML = renderAttendanceManagementView(currentCourseIdForAttendance);
      return;
  }
  
  if (currentCourseIdForEditing !== null) {
      appRoot.innerHTML = renderEditCourseView(currentCourseIdForEditing);
      return;
  }

  switch (currentView) {
    case 'login':
        appRoot.innerHTML = renderLoginScreen();
        break;
    case 'register':
        appRoot.innerHTML = renderRegisterScreen();
        break;
    case 'forgotPassword':
        appRoot.innerHTML = renderForgotPasswordScreen();
        break;
    case 'resetPassword':
        appRoot.innerHTML = renderResetPasswordScreen();
        break;
    case 'dashboard':
        renderDashboard();
        break;
  }
}

function renderHeader() {
    if (!appHeader || !db) return;
    const logoHtml = db.schoolProfile.profilePicture
        ? `<img src="${db.schoolProfile.profilePicture}" alt="Logo da Escola" class="header-logo">`
        : `<span class="logo-icon">🎨</span>`;

    let headerContent = `<h1>${logoHtml} ${db.schoolProfile.name}</h1>`;
    if (currentUser) {
        const isSuperAdmin = currentUser.role === 'superadmin';
        const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
        headerContent = `
            <div class="header-content">
                <h1>${logoHtml} ${db.schoolProfile.name}</h1>
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
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="auth-button">Entrar</button>
            </form>
            <div class="auth-links">
                <p>Não tem uma conta? <button class="link-button" onclick="window.navigateTo('register')">Cadastre-se</button></p>
                <button class="link-button" onclick="window.navigateTo('forgotPassword')">Esqueceu a senha?</button>
            </div>
        </div>
    `;
}

function renderForgotPasswordScreen() {
    return `
        <div class="auth-container">
            <h2>Redefinir Senha</h2>
            <p>Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
            <form onsubmit="window.handleForgotPassword(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <button type="submit" class="auth-button">Enviar Link de Redefinição</button>
            </form>
            <p><button class="link-button" onclick="window.navigateTo('login')">Voltar para o Login</button></p>
        </div>
    `;
}

function renderResetPasswordScreen() {
    if (!passwordResetToken) {
        return `
            <div class="auth-container">
                <h2>Token Inválido</h2>
                <p>O link de redefinição de senha é inválido ou expirou. Por favor, tente novamente.</p>
                <p><button class="link-button" onclick="window.navigateTo('forgotPassword')">Solicitar novo link</button></p>
            </div>
        `;
    }
    return `
        <div class="auth-container">
            <h2>Crie uma Nova Senha</h2>
            <form onsubmit="window.handleResetPassword(event)">
                <div class="form-group">
                    <label for="newPassword">Nova Senha</label>
                    <input type="password" id="newPassword" name="newPassword" required>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Nova Senha</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                </div>
                <button type="submit" class="auth-button">Redefinir Senha</button>
            </form>
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
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="auth-button">Cadastrar</button>
            </form>
            <p>Já tem uma conta? <button class="link-button" onclick="window.navigateTo('login')">Faça login</button></p>
        </div>
    `;
}

function renderDashboard() {
    if (!currentUser) {
        currentView = 'login';
        render();
        return;
    }

    let dashboardHtml = '';
    switch (currentUser.role) {
        case 'student':
            dashboardHtml = renderStudentView(currentUser.id);
            break;
        case 'admin':
        case 'superadmin':
            dashboardHtml = renderAdminView(currentUser.id);
            break;
        case 'teacher':
            dashboardHtml = renderTeacherView(currentUser.id);
            break;
        default:
            dashboardHtml = `<div class="welcome-message"><h2>Aguardando atribuição</h2><p>Sua conta foi criada. Um administrador precisa atribuir uma função a você.</p></div>`;
            break;
    }
    appRoot.innerHTML = dashboardHtml;
    
    // Apply saved card order after rendering
    setTimeout(applyCardOrder, 0);
}

function renderStudentView(studentId: number) {
  const student = db.users.find(s => s.id === studentId);
  if (!student) return '';

  const myEnrollments = db.enrollments.filter(e => e.studentId === studentId);
  const myAttendance = db.attendance.filter(a => a.studentId === studentId);
  const openCourses = db.courses.filter(c => c.status === 'Aberto');

  const cards = [
    {
      id: 'student-courses',
      html: `
        <div class="card" id="student-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📚 Meus Cursos e Matrículas</h3>
            <ul class="list">
                ${myEnrollments.map(enrollment => {
                    const course = db.courses.find(c => c.id === enrollment.courseId);
                    if (!course) return '';
                    const teacher = db.users.find(t => t.id === course.teacherId);
                    
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
                }).join('')}
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
                ${openCourses.map(course => {
                    const enrollment = myEnrollments.find(e => e.courseId === course.id);
                    // Hide if already actively enrolled or pending
                    if (enrollment && (enrollment.status === 'Aprovada' || enrollment.status === 'Pendente')) {
                        return '';
                    }

                    const teacher = db.users.find(t => t.id === course.teacherId);
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
                        ${myAttendance.map(record => {
                            const course = db.courses.find(c => c.id === record.courseId);
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
            ${renderStudentFinancialHistory(studentId)}
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

function renderAdminView(adminId: number) {
    if (currentAdminView === 'userManagement') {
        return renderUserManagementView(adminId);
    }
    if (currentAdminView === 'systemSettings') {
        return renderSystemSettingsView();
    }
    if (currentAdminView === 'createCourse') {
        return renderCreateCourseView();
    }

    const admin = db.users.find(a => a.id === adminId);
    if (!admin) return '';

    const pendingEnrollments = db.enrollments.filter(e => e.status === 'Pendente');
    const openCourses = db.courses.filter(c => c.status === 'Aberto');

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
                    ${db.courses.map(course => `
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
                    ${pendingEnrollments.length === 0 ? '<li>Nenhuma matrícula pendente.</li>' : pendingEnrollments.map(enrollment => {
                        const student = db.users.find(s => s.id === enrollment.studentId);
                        const course = db.courses.find(c => c.id === enrollment.courseId);
                        if (!student || !course) return '';
                        const enrolledCount = db.enrollments.filter(e => e.courseId === course.id && e.status === 'Aprovada').length;
                        
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
                    ${openCourses.length === 0 ? '<li>Nenhum curso aberto.</li>' : openCourses.map(course => `
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
    const teachers = db.users.filter(u => u.role === 'teacher');
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

function renderUserManagementView(adminId: number) {
    let filteredUsers = db.users.filter(u => u.id !== adminId);

    if (userFilters.name) {
        filteredUsers = filteredUsers.filter(u => `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(userFilters.name.toLowerCase()));
    }
    if (userFilters.role !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === userFilters.role);
    }
    if (userFilters.courseId !== 'all') {
        const enrolledStudentIds = db.enrollments
            .filter(e => e.courseId === userFilters.courseId)
            .map(e => e.studentId);
        filteredUsers = filteredUsers.filter(u => enrolledStudentIds.includes(u.id));
    }
    if (userFilters.courseId !== 'all' && userFilters.enrollmentStatus !== 'all') {
        const enrolledStudentIdsWithStatus = db.enrollments
            .filter(e => e.courseId === userFilters.courseId && e.status === userFilters.enrollmentStatus)
            .map(e => e.studentId);
        filteredUsers = filteredUsers.filter(u => enrolledStudentIdsWithStatus.includes(u.id));
    }

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
                    <input type="text" id="filter-name" name="name" oninput="window.handleUserFilterChange(event)" value="${userFilters.name}">
                </div>
                <div class="filter-group">
                    <label for="filter-role">Função</label>
                    <select id="filter-role" name="role" onchange="window.handleUserFilterChange(event)">
                        <option value="all" ${userFilters.role === 'all' ? 'selected' : ''}>Todas</option>
                        <option value="unassigned" ${userFilters.role === 'unassigned' ? 'selected' : ''}>Não atribuído</option>
                        <option value="student" ${userFilters.role === 'student' ? 'selected' : ''}>Aluno</option>
                        <option value="teacher" ${userFilters.role === 'teacher' ? 'selected' : ''}>Professor</option>
                        <option value="admin" ${userFilters.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-course">Curso</label>
                    <select id="filter-course" name="courseId" onchange="window.handleUserFilterChange(event)">
                        <option value="all">Todos</option>
                        ${db.courses.map(c => `<option value="${c.id}" ${userFilters.courseId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-status">Status da Matrícula</label>
                    <select id="filter-status" name="enrollmentStatus" onchange="window.handleUserFilterChange(event)" ${userFilters.courseId === 'all' ? 'disabled' : ''}>
                        <option value="all">Todos</option>
                        <option value="Pendente" ${userFilters.enrollmentStatus === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Aprovada" ${userFilters.enrollmentStatus === 'Aprovada' ? 'selected' : ''}>Aprovada</option>
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

function renderTeacherView(teacherId: number) {
    const teacher = db.users.find(t => t.id === teacherId);
    if (!teacher) return '';

    const myOpenCourses = db.courses.filter(c => c.teacherId === teacherId && c.status === 'Aberto');

    const cards = myOpenCourses.map(course => ({
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
            ${cards.length === 0 ? '<div class="card"><p>Nenhum curso aberto atribuído a você.</p></div>' : cards.map(c => c.html).join('')}
        </div>
    `;
}

function renderAttendanceManagementView(courseId: number) {
    const course = db.courses.find(c => c.id === courseId);
    if (!course) return '';

    const today = new Date().toISOString().split('T')[0];

    const approvedStudents = db.enrollments
        .filter(e => e.courseId === course.id && e.status === 'Aprovada')
        .map(e => db.users.find(s => s.id === e.studentId))
        .filter(s => s !== undefined) as User[];
    
    // Check if the selected date matches the course's day of the week
    const selectedDateObj = new Date(attendanceSelectedDate + 'T12:00:00Z'); // Use noon UTC to avoid timezone shifts
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const selectedDayOfWeek = weekDays[selectedDateObj.getUTCDay()];
    const isCorrectDayOfWeek = course.dayOfWeek === selectedDayOfWeek;

    const existingRecordsForDate = db.attendance.filter(a => a.courseId === course.id && a.date === attendanceSelectedDate);
    const isEditing = existingRecordsForDate.length > 0;

    const attendanceHistory = db.attendance
        .filter(a => a.courseId === course.id)
        .reduce((acc, record) => {
            if (!acc[record.date]) acc[record.date] = [];
            acc[record.date].push(record);
            return acc;
        }, {} as Record<string, AttendanceRecord[]>);

    return `
        <div class="view-header">
            <h2>Controle de Frequência: ${course.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="attendance-controls">
                    <label for="attendance-date">Data da Chamada:</label>
                    <input type="date" id="attendance-date" value="${attendanceSelectedDate}" max="${today}" onchange="window.handleAttendanceDateChange(event)">
                </div>

                ${isEditing ? `<div class="notice">Você está editando a frequência de uma data já registrada.</div>` : ''}
                ${!isCorrectDayOfWeek && course.dayOfWeek ? `<div class="notice">Atenção: Este curso ocorre às ${course.dayOfWeek}s. A data selecionada é uma ${selectedDayOfWeek}.</div>` : ''}

                 ${approvedStudents.length === 0 ? '<p>Nenhum aluno matriculado nesta turma ainda.</p>' : `
                    <form onsubmit="window.handleSaveAttendance(event)" data-course-id="${course.id}">
                        <input type="hidden" name="attendanceDate" value="${attendanceSelectedDate}">
                        <table>
                            <thead><tr><th>Aluno</th><th>Faltou?</th></tr></thead>
                            <tbody>
                            ${approvedStudents.map(student => {
                                const existingRecord = existingRecordsForDate.find(r => r.studentId === student.id);
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
                            ${Object.entries(attendanceHistory).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)).map(([date, records]) => {
                                const presents = records.filter(r => r.status === 'Presente').length;
                                const absents = records.filter(r => r.status === 'Falta').length;
                                const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
                                return `
                                    <tr>
                                        <td>${formattedDate}</td>
                                        <td>${presents}</td>
                                        <td>${absents}</td>
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

function renderEditCourseView(courseId: number) {
    const course = db.courses.find(c => c.id === courseId);
    if (!course) {
        alert('Curso não encontrado!');
        window.handleNavigateBackToDashboard();
        return '';
    }
    const teachers = db.users.filter(u => u.role === 'teacher');

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
                        ${teachers.map(t => `<option value="${t.id}" ${t.id === course.teacherId ? 'selected' : ''}>${t.firstName} ${t.lastName || ''}</option>`).join('')}
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

function renderCourseDetailsView(courseId: number) {
    const course = db.courses.find(c => c.id === courseId);
    if (!course) {
        alert('Curso não encontrado!');
        window.handleNavigateBackToDashboard();
        return '';
    }
    const teacher = db.users.find(u => u.id === course.teacherId);
    const approvedStudents = db.enrollments
        .filter(e => e.courseId === course.id && e.status === 'Aprovada')
        .map(e => db.users.find(u => u.id === e.studentId))
        .filter(Boolean) as User[];
    
    const enrolledCount = approvedStudents.length;
    const vacancies = course.totalSlots === null ? 'Ilimitadas' : Math.max(0, course.totalSlots - enrolledCount);

    let paymentInfo = course.paymentType === 'parcelado'
        ? `${course.installments} parcelas`
        : 'Recorrente';

    let auditInfo = '';
    if (course.status === 'Encerrado' && course.closedBy) {
        const admin = db.users.find(u => u.id === course.closedBy.adminId);
        const date = new Date(course.closedBy.date).toLocaleString('pt-BR');
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
                <div>${course.monthlyFee ? `R$ ${course.monthlyFee.toFixed(2).replace('.', ',')} (${paymentInfo})` : 'Não definido'}</div>

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
            <h3 class="card-title">Alunos Matriculados (${approvedStudents.length})</h3>
            ${approvedStudents.length > 0 ? `
                <ul class="list">
                    ${approvedStudents.map(student => `
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

function renderProfileView(userId: number) {
    const userToView = db.users.find(u => u.id === userId);
    if (!userToView || !currentUser) {
        window.handleNavigateBackToDashboard();
        return '';
    }

    const isOwner = currentUser.id === userId;
    const isAdminViewer = (currentUser.role === 'admin' || currentUser.role === 'superadmin') && !isOwner;
    const canEditField = (fieldName: keyof User) => {
        if (isOwner) return true;
        if (isAdminViewer) {
            const value = userToView[fieldName as keyof User];
            return value === undefined || value === null || value === '';
        }
        return false;
    };
    const isFieldDisabled = (fieldName: keyof User) => !canEditField(fieldName);

    let enrollmentsHtml = '';
    if (isAdminViewer && userToView.role === 'student') {
        const enrollments = db.enrollments.filter(e => e.studentId === userToView.id);
        enrollmentsHtml = `
            <h3 class="card-title">Matrículas</h3>
            ${enrollments.length === 0 ? '<p>Nenhuma matrícula encontrada.</p>' : `
                <ul class="list">
                    ${enrollments.map(e => {
                        const course = db.courses.find(c => c.id === e.courseId);
                        return `
                            <li class="list-item">
                                <div class="list-item-content">
                                    <span class="list-item-title">${course?.name || 'Curso não encontrado'}</span>
                                </div>
                                <div class="list-item-actions">
                                    <span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>
                                </div>
                            </li>
                        `;
                    }).join('')}
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
                       ${(userToView.role === 'student') ? renderStudentFinancialHistory(userId, true, isAdminViewer) : ''}
                    </div>

                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
}

function renderSchoolProfileView() {
    if (!currentUser || !(currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
        window.handleNavigateBackToDashboard();
        return '';
    }

    const pixKeyTypes: PixKeyType[] = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Aleatória'];

    return `
        <div class="view-header">
            <h2>Dados da Unidade de Ensino</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
             <form class="profile-form" onsubmit="window.handleUpdateSchoolProfile(event)">
                <div class="profile-pic-container">
                    <img id="school-pic-preview" class="profile-pic-preview" src="${db.schoolProfile.profilePicture || 'https://via.placeholder.com/150'}" alt="Logo da Escola">
                    <div class="form-group">
                        <label for="schoolProfilePicture">Alterar Logo</label>
                        <input type="file" id="schoolProfilePicture" name="schoolProfilePicture" accept="image/*" onchange="window.previewSchoolImage(event)">
                    </div>
                </div>

                <div class="profile-fields-container">
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="schoolName">Nome da Unidade</label>
                            <input type="text" id="schoolName" name="name" value="${db.schoolProfile.name}" required>
                        </div>
                         <div class="form-group">
                            <label for="cnpj">CNPJ</label>
                            <input type="text" id="cnpj" name="cnpj" value="${db.schoolProfile.cnpj}" required>
                        </div>
                         <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" value="${db.schoolProfile.phone}" required>
                        </div>
                    </div>
                     <div class="form-grid">
                        <div class="form-group">
                           <label for="pixKeyType">Tipo de Chave PIX</label>
                           <select id="pixKeyType" name="pixKeyType">
                             ${pixKeyTypes.map(type => `<option value="${type}" ${db.schoolProfile.pixKeyType === type ? 'selected' : ''}>${type}</option>`).join('')}
                           </select>
                        </div>
                         <div class="form-group">
                            <label for="pixKey">Chave PIX</label>
                            <input type="text" id="pixKey" name="pixKey" value="${db.schoolProfile.pixKey}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="schoolAddress">Endereço da Unidade</label>
                        <textarea id="schoolAddress" name="address" rows="3" required>${db.schoolProfile.address}</textarea>
                    </div>
                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
}

function renderFinancialDashboardView() {
    const selectedYear = parseInt(dashboardSelectedDate.substring(0, 4), 10);
    const selectedMonth = parseInt(dashboardSelectedDate.substring(5, 7), 10) - 1; // month is 0-indexed

    // Filter by string comparison to avoid timezone issues.
    const paymentsForSelectedMonth = db.payments.filter(p => p.referenceDate.startsWith(dashboardSelectedDate));

    const expectedRevenue = paymentsForSelectedMonth.reduce((sum, payment) => sum + payment.amount, 0);
    const collectedRevenue = paymentsForSelectedMonth.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.amount, 0);
    const outstandingRevenue = expectedRevenue - collectedRevenue;
    const progress = (expectedRevenue > 0) ? (collectedRevenue / expectedRevenue) * 100 : (collectedRevenue > 0 ? 100 : 0);
    
    // Data for charts
    // Bar Chart: Revenue Evolution (last 6 months from selected date)
    const evolutionData = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(selectedYear, selectedMonth - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthRefStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
        
        const monthPayments = db.payments.filter(p => p.referenceDate.startsWith(monthRefStr));
        
        const monthExpected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const monthCollected = monthPayments.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.amount, 0);
        
        evolutionData.push({
            month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
            expected: monthExpected,
            collected: monthCollected,
        });
    }

    // Pie Chart: Revenue by Course (selected month)
    const revenueByCourseData = paymentsForSelectedMonth
        .filter(p => p.status === 'Pago')
        .reduce((acc, p) => {
            const course = db.courses.find(c => c.id === p.courseId);
            if (course) {
                acc[course.name] = (acc[course.name] || 0) + p.amount;
            }
            return acc;
        }, {} as Record<string, number>);
        
    // Bar Chart: Paid vs Outstanding (selected month)
    const monthlyStatusData = {
        'Pago': collectedRevenue,
        'Em Aberto': outstandingRevenue,
    };

    return `
        <div class="view-header">
            <h2>Dashboard Financeiro</h2>
            <div class="dashboard-controls">
                <label for="month-selector">Selecionar Mês:</label>
                <input type="month" id="month-selector" name="month" value="${dashboardSelectedDate}" onchange="window.handleDashboardDateChange(event)">
            </div>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="card full-width">
            <div class="financial-summary-grid">
                <div class="summary-card">
                    <h3>Receita Prevista</h3>
                    <p>R$ ${expectedRevenue.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="summary-card">
                    <h3>Receita Arrecadada</h3>
                    <p>R$ ${collectedRevenue.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="summary-card">
                    <h3>Inadimplência</h3>
                    <p>R$ ${outstandingRevenue.toFixed(2).replace('.', ',')}</p>
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

function renderFinancialControlPanelView() {
    const activeStudents = db.users.filter(user => {
        if (user.role !== 'student') return false;
        return db.enrollments.some(e => e.studentId === user.id && e.status === 'Aprovada');
    }).sort((a,b) => a.firstName.localeCompare(b.firstName));

    return `
        <div class="view-header">
            <h2>Gerenciar Pagamentos</h2>
            <button class="back-button" onclick="window.handleNavigateToFinancialDashboard()">← Voltar ao Dashboard</button>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Alunos com Matrículas (${activeStudents.length})</h3>
            ${activeStudents.length === 0 ? '<p>Nenhum aluno ativo para gerenciar.</p>' : `
            <ul class="list finance-student-list">
                ${activeStudents.map(student => `
                    <li class="list-item clickable" onclick="window.handleToggleFinanceStudent(${student.id})">
                        <div class="list-item-content">
                            <span class="list-item-title">${student.firstName} ${student.lastName || ''}</span>
                            <span class="list-item-subtitle">${student.email}</span>
                        </div>
                        <span class="expand-icon">${expandedStudentIdForFinance === student.id ? '▼' : '▶'}</span>
                    </li>
                    ${expandedStudentIdForFinance === student.id ? `
                        <li class="student-payment-details">
                            ${renderStudentFinancialHistory(student.id, true, true)}
                        </li>
                    ` : ''}
                `).join('')}
            </ul>
            `}
        </div>
    `;
}

function renderStudentFinancialHistory(studentId: number, isAdminView = false, allowActions = false) {
    const studentPayments = db.payments
        .filter(p => p.studentId === studentId)
        .sort((a, b) => b.referenceDate.localeCompare(a.referenceDate));
        
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
                           const course = db.courses.find(c => c.id === p.courseId);
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
                                <td>R$ ${p.amount.toFixed(2).replace('.', ',')}</td>
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

function renderPixPaymentModal(): HTMLElement {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            window.handleClosePixModal();
        }
    };

    let modalBodyHtml = '';

    if (!pixModalContent) {
        modalBodyHtml = `
            <div class="pix-status-container">
                <div class="spinner"></div>
                <span>Gerando cobrança PIX...</span>
            </div>
        `;
    } else {
        const { qrCodeUrl, pixCode, totalAmount, coursesInfo } = pixModalContent;
        const receiverName = db.schoolProfile.name;
        const receiverKey = `(${db.schoolProfile.pixKeyType}): ${db.schoolProfile.pixKey}`;

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

function renderSystemSettingsView() {
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
                                <option value="pt-BR" ${db.systemSettings.language === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option>
                                <option value="en-US" ${db.systemSettings.language === 'en-US' ? 'selected' : ''}>Inglês (EUA)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="timeZone">Fuso Horário (NTP)</label>
                            <input type="text" id="timeZone" name="timeZone" value="${db.systemSettings.timeZone}">
                            <small>Ex: America/Sao_Paulo, Europe/Lisbon, UTC</small>
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">💰 Financeiro</h3>
                        <div class="form-group">
                            <label for="currencySymbol">Símbolo da Moeda</label>
                            <input type="text" id="currencySymbol" name="currencySymbol" value="${db.systemSettings.currencySymbol}">
                        </div>
                         <div class="form-group">
                            <label for="defaultDueDay">Dia Padrão de Vencimento</label>
                            <input type="number" id="defaultDueDay" name="defaultDueDay" value="${db.systemSettings.defaultDueDay}" min="1" max="28">
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">🤖 Integração com IA</h3>
                        <div class="form-group">
                            <label for="aiApiKey">Chave de API de IA (Gemini)</label>
                            <input type="password" id="aiApiKey" name="aiApiKey" value="${db.systemSettings.aiApiKey || ''}" placeholder="Cole sua chave de API aqui">
                            <small>Usada para gerar descrições de cursos.</small>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">✉️ E-mail (SMTP)</h3>
                        <div class="form-group">
                            <label for="smtpServer">Servidor SMTP</label>
                            <input type="text" id="smtpServer" name="smtpServer" value="${db.systemSettings.smtpServer}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPort">Porta</label>
                            <input type="text" id="smtpPort" name="smtpPort" value="${db.systemSettings.smtpPort}">
                        </div>
                        <div class="form-group">
                            <label for="smtpUser">Usuário</label>
                            <input type="text" id="smtpUser" name="smtpUser" value="${db.systemSettings.smtpUser}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPass">Senha</label>
                            <input type="password" id="smtpPass" name="smtpPass" value="${db.systemSettings.smtpPass}">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">💾 Base de Dados</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="dbHost">Host</label>
                                <input type="text" id="dbHost" name="dbHost" value="${db.systemSettings.dbHost || ''}">
                            </div>
                            <div class="form-group">
                                <label for="dbPort">Porta</label>
                                <input type="text" id="dbPort" name="dbPort" value="${db.systemSettings.dbPort || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="dbName">Nome da Base</label>
                            <input type="text" id="dbName" name="dbName" value="${db.systemSettings.dbName || ''}">
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="dbUser">Usuário</label>
                                <input type="text" id="dbUser" name="dbUser" value="${db.systemSettings.dbUser || ''}">
                            </div>
                            <div class="form-group">
                                <label for="dbPass">Senha</label>
                                <input type="password" id="dbPass" name="dbPass" value="${db.systemSettings.dbPass || ''}">
                            </div>
                        </div>
                        <button type="button" class="action-button secondary" onclick="window.handleExportDatabase()" style="margin-top: 1rem;">Exportar Dados Atuais (JSON)</button>
                        <small style="display: block; margin-top: 0.5rem;">Exporta todos os dados simulados para um arquivo JSON que pode ser usado para popular a base de dados real.</small>
                    </div>
                </div>
                <button type="submit" class="action-button" style="margin-top: 2rem;">Salvar Configurações</button>
            </form>
        </div>
    `;
}



// --- CHART GENERATORS ---

function generateRevenueEvolutionChartSVG(data: { month: string; expected: number; collected: number }[]) {
    if (data.length === 0) return '<p>Dados insuficientes para gerar o gráfico.</p>';
    
    const svgWidth = 500;
    const svgHeight = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const maxVal = Math.max(...data.flatMap(d => [d.expected, d.collected]), 0);
    const yScale = (val: number) => chartHeight - (val / (maxVal > 0 ? maxVal : 1)) * chartHeight;

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
                <rect class="bar expected" x="${xExpected}" y="${yScale(d.expected)}" width="${barWidth}" height="${chartHeight - yScale(d.expected)}">
                    <title>Previsto: R$ ${d.expected.toFixed(2)}</title>
                </rect>
                <rect class="bar collected" x="${xCollected}" y="${yScale(d.collected)}" width="${barWidth}" height="${chartHeight - yScale(d.collected)}">
                     <title>Arrecadado: R$ ${d.collected.toFixed(2)}</title>
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

function generateRevenueByCourseChartSVG(data: Record<string, number>) {
    const entries = Object.entries(data);
    if (entries.length === 0) return '<p>Nenhuma receita registrada este mês para exibir o gráfico.</p>';
    
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6610f2'];
    const total = entries.reduce((sum, [, val]) => sum + val, 0);

    let startAngle = 0;
    const slices = entries.map(([name, value], i) => {
        const percentage = (value / total);
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
                <title>${name}: R$ ${value.toFixed(2)} (${(percentage * 100).toFixed(1)}%)</title>
            </path>
        `;
    }).join('');

    const legendHtml = entries.map(([name, value], i) => {
        const percentage = (value / total * 100).toFixed(1);
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

function generatePaidVsOutstandingBarChartSVG(data: { 'Pago': number; 'Em Aberto': number }) {
    const svgWidth = 400;
    const svgHeight = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const dataEntries = Object.entries(data);
    const maxVal = Math.max(...Object.values(data), 0);
    const yScale = (val: number) => chartHeight - (val / (maxVal > 0 ? maxVal : 1)) * chartHeight;
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
        const color = colors[status as keyof typeof colors];
        return `
            <g class="bar-group">
                <rect class="bar" x="${x}" y="${yScale(value)}" width="${barWidth}" height="${chartHeight - yScale(value)}" style="fill: ${color};">
                    <title>${status}: R$ ${value.toFixed(2)}</title>
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
/**
 * Formats a field for the BR Code PIX string.
 * @param id The field ID.
 * @param value The field value.
 * @returns The formatted string in "IDLLValue" format.
 */
function formatField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

/**
 * Calculates the CRC16-CCITT checksum as required for PIX.
 * @param data The string data to calculate the checksum for.
 * @returns A 4-character uppercase hexadecimal string.
 */
function crc16(data: string): string {
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


/**
 * Generates a valid BR Code string for PIX "Copia e Cola".
 * @param pixKey The recipient's PIX key.
 * @param amount The transaction amount. Can be null for dynamic value.
 * @param merchantName The recipient's name.
 * @param merchantCity The recipient's city.
 * @param txid The transaction ID. Defaults to '***'.
 * @param description Optional description for the transaction (infoAdicional).
 * @returns A valid PIX BR Code string.
 */
function generateBrCode(pixKey: string, amount: number | null, merchantName: string, merchantCity: string, txid: string = '***', description: string | null = null): string {
    // Sanitize and truncate merchant name and city as per spec
    const sanitizedName = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    const sanitizedCity = merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);

    const amountString = amount ? amount.toFixed(2) : null;
    
    let merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey);
    if (description) {
        const sanitizedDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 72);
        merchantAccountInfo += formatField('02', sanitizedDescription);
    }
    
    const payloadFields = [
        formatField('00', '01'), // Payload Format Indicator
        formatField('26', merchantAccountInfo),
        formatField('52', '0000'), // Merchant Category Code
        formatField('53', '986'), // Transaction Currency (BRL)
    ];

    if (amountString) {
        payloadFields.push(formatField('54', amountString));
    }
    
    payloadFields.push(
        formatField('58', 'BR'), // Country Code
        formatField('59', sanitizedName), // Merchant Name
        formatField('60', sanitizedCity), // Merchant City
        formatField('62', formatField('05', txid)) // Additional Data Field (txid)
    );

    const payload = payloadFields.join('');

    const payloadWithCrcPlaceholder = `${payload}6304`;
    const crc = crc16(payloadWithCrcPlaceholder);
    
    return `${payloadWithCrcPlaceholder}${crc}`;
}


// --- EVENT HANDLERS & HELPERS ---
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

/**
 * Updates the status of overdue payments from 'Pendente' to 'Atrasado'.
 * This function runs periodically on render.
 */
function updateOverduePayments() {
    const todayStr = new Date().toISOString().split('T')[0];
    let changed = false;
    db.payments.forEach(payment => {
        if (payment.status === 'Pendente' && payment.dueDate < todayStr) {
            payment.status = 'Atrasado';
            changed = true;
        }
    });
    if (changed) saveDb();
}

/**
 * Generates all future payments for a student's enrollment at once upon approval.
 * Respects course payment type (recurring or installments).
 * @param enrollment The newly approved enrollment.
 */
function generateAllPaymentsForEnrollment(enrollment: Enrollment) {
    const course = db.courses.find(c => c.id === enrollment.courseId);
    if (!course || !course.monthlyFee || !enrollment.billingStartDate) {
        console.error("Cannot generate payments: Missing course data or billing start date.", { course, enrollment });
        return;
    }

    // Use UTC to prevent timezone issues.
    const [startYear, startMonth, startDay] = enrollment.billingStartDate.split('-').map(Number);
    let cursorDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));

    if (course.paymentType === 'parcelado') {
        const numberOfInstallments = course.installments || 0;
        for (let i = 0; i < numberOfInstallments; i++) {
            generatePaymentForMonth(enrollment, course, cursorDate);
            cursorDate.setUTCMonth(cursorDate.getUTCMonth() + 1);
        }
    } else { // 'recorrente'
        const endOfYear = new Date(Date.UTC(cursorDate.getUTCFullYear(), 11, 31)); // December 31st of the starting year
        while (cursorDate <= endOfYear) {
            generatePaymentForMonth(enrollment, course, cursorDate);
            cursorDate.setUTCMonth(cursorDate.getUTCMonth() + 1);
        }
    }
}

/**
 * Helper function to create a single payment record for a given month.
 */
function generatePaymentForMonth(enrollment: Enrollment, course: Course, date: Date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const monthRef = `${year}-${month.toString().padStart(2, '0')}-01`;

    const paymentExists = db.payments.some(p => 
        p.studentId === enrollment.studentId &&
        p.courseId === enrollment.courseId &&
        p.referenceDate === monthRef
    );

    if (!paymentExists && course.monthlyFee) {
        const dueDay = db.systemSettings.defaultDueDay;
        const dueDate = new Date(Date.UTC(year, month - 1, dueDay)).toISOString().split('T')[0];
        const newPayment: Payment = {
            id: db.nextPaymentId++,
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            amount: course.monthlyFee,
            referenceDate: monthRef,
            dueDate: dueDate,
            status: 'Pendente',
        };
        db.payments.push(newPayment);
    }
}


function checkTeacherScheduleConflict(teacherId: number, dayOfWeek: string, startTime: string, endTime: string, excludingCourseId: number | null = null): Course | null {
    if (!dayOfWeek || !startTime || !endTime) return null;

    const teacherCourses = db.courses.filter(c =>
        c.teacherId === teacherId &&
        c.status === 'Aberto' &&
        c.id !== excludingCourseId
    );

    for (const course of teacherCourses) {
        if (course.dayOfWeek === dayOfWeek && course.startTime && course.endTime) {
            // Conflict if (StartA < EndB) and (EndA > StartB)
            if (startTime < course.endTime && endTime > course.startTime) {
                return course; // Conflict found
            }
        }
    }
    return null; // No conflict
}

window.handleLogin = async (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const user = db.users.find(u => u.email === email);

    if (user && await checkPassword(password, user.password)) {
        currentUser = user;
        currentView = 'dashboard';
    } else {
        alert('Email ou senha inválidos.');
    }
    render();
}

window.handleRegister = async (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (db.users.some(u => u.email === email)) {
        alert('Este email já está em uso.');
        return;
    }
    
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
        id: db.nextUserId++,
        firstName: name,
        email,
        password: hashedPassword,
        role: 'unassigned',
    };
    db.users.push(newUser);
    saveDb();
    alert('Cadastro realizado com sucesso! Faça o login.');
    currentView = 'login';
    render();
}

window.handleForgotPassword = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const user = db.users.find(u => u.email === email);

    if (user) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        saveDb();

        const resetLink = `${window.location.origin}${window.location.pathname}?view=resetPassword&token=${token}`;
        alert(`Um e-mail de redefinição de senha foi enviado para ${email}.\n\n(Protótipo) Link de redefinição:\n${resetLink}`);
    } else {
        alert(`Se um usuário com o e-mail ${email} existir, um link de redefinição foi enviado.`);
    }

    currentView = 'login';
    render();
};

window.handleResetPassword = async (event: Event) => {
    event.preventDefault();
    if (!passwordResetToken) {
        alert('Token inválido ou expirado.');
        return;
    }
    const form = event.target as HTMLFormElement;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
    
    if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    const user = db.users.find(u => u.resetToken === passwordResetToken && u.resetTokenExpiry && u.resetTokenExpiry > Date.now());

    if (user) {
        user.password = await hashPassword(newPassword);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        saveDb();
        alert('Senha redefinida com sucesso! Por favor, faça o login com sua nova senha.');
        passwordResetToken = null;
        currentView = 'login';
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        url.searchParams.delete('token');
        history.pushState({}, '', url);
        render();
    } else {
        alert('Token inválido ou expirado. Por favor, solicite um novo link de redefinição.');
        currentView = 'login';
        render();
    }
};


window.navigateTo = (view: 'login' | 'register' | 'forgotPassword') => {
    currentView = view;
    render();
}

window.handleLogout = () => {
    currentUser = null;
    currentView = 'login';
    currentCourseIdForAttendance = null;
    currentCourseIdForEditing = null;

    currentCourseIdForDetails = null;
    currentProfileUserId = null;
    isViewingSchoolProfile = false;
    isViewingFinancialDashboard = false;
    isViewingFinancialControlPanel = false;
    expandedStudentIdForFinance = null;
    currentAdminView = 'dashboard';
    userFilters = { name: '', role: 'all', courseId: 'all', enrollmentStatus: 'all' };
    render();
}

window.handleEnroll = (event: Event) => {
    if (!currentUser || currentUser.role !== 'student') return;

    const button = event.target as HTMLButtonElement;
    const courseId = parseInt(button.dataset.courseId!, 10);
    const studentId = currentUser.id;

    const isAlreadyEnrolled = db.enrollments.some(e => 
        e.studentId === studentId && 
        e.courseId === courseId &&
        (e.status === 'Aprovada' || e.status === 'Pendente')
    );
    
    if (isAlreadyEnrolled) {
        alert('Você já tem uma matrícula ativa ou pendente para este curso.');
        return;
    }

    // This is a brand new enrollment request
    db.enrollments.push({
        studentId: studentId,
        courseId: courseId,
        status: 'Pendente',
    });
    
    saveDb();
    alert('Solicitação de matrícula enviada! Aguarde a aprovação do administrador.');
    render();
}

window.handleApprove = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const studentId = parseInt(form.dataset.studentId!, 10);
    const courseId = parseInt(form.dataset.courseId!, 10);
    const billingStartChoice = (form.elements.namedItem('billingStart') as HTMLSelectElement).value;


    const enrollment = db.enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
    if (enrollment) {
        // Use UTC to avoid timezone issues.
        const today = new Date();
        const currentYear = today.getUTCFullYear();
        const currentMonth = today.getUTCMonth();
        
        let billingStartDate: Date;

        if (billingStartChoice === 'next_month') {
            billingStartDate = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
        } else { // 'this_month'
            billingStartDate = new Date(Date.UTC(currentYear, currentMonth, 1));
        }
        
        enrollment.status = 'Aprovada';
        enrollment.billingStartDate = billingStartDate.toISOString().split('T')[0]; // Store as YYYY-MM-DD UTC date
        
        // Generate all payments for this enrollment now
        generateAllPaymentsForEnrollment(enrollment);
        
        saveDb();
        render();
    }
}

window.handleSaveAttendance = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const courseId = parseInt(form.dataset.courseId!, 10);
    const date = (form.elements.namedItem('attendanceDate') as HTMLInputElement).value;
    const formData = new FormData(form);
    const absentStudentIds = formData.getAll('absent').map(id => parseInt(id as string, 10));
    
    // Remove previous records for this date to allow editing
    db.attendance = db.attendance.filter(a => !(a.courseId === courseId && a.date === date));

    const approvedStudentIds = db.enrollments
        .filter(e => e.courseId === courseId && e.status === 'Aprovada')
        .map(e => e.studentId);

    approvedStudentIds.forEach(studentId => {
        const isAbsent = absentStudentIds.includes(studentId);
        db.attendance.push({
            courseId,
            studentId,
            date: date,
            status: isAbsent ? 'Falta' : 'Presente',
        });
    });
    
    saveDb();
    alert('Frequência salva com sucesso!');
    render();
}

window.handleCreateCourse = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const courseName = (form.elements.namedItem('courseName') as HTMLInputElement).value;
    const courseDescription = (form.elements.namedItem('courseDescription') as HTMLTextAreaElement).value;
    const teacherId = parseInt((form.elements.namedItem('teacherId') as HTMLSelectElement).value, 10);
    const totalSlotsValue = (form.elements.namedItem('totalSlots') as HTMLInputElement).value;
    const monthlyFee = parseFloat((form.elements.namedItem('monthlyFee') as HTMLInputElement).value);
    const paymentType = (form.elements.namedItem('paymentType') as HTMLInputElement).value as PaymentType;
    const installmentsValue = (form.elements.namedItem('installments') as HTMLInputElement).value;
    const dayOfWeek = (form.elements.namedItem('dayOfWeek') as HTMLSelectElement).value;
    const startTime = (form.elements.namedItem('startTime') as HTMLInputElement).value;
    const endTime = (form.elements.namedItem('endTime') as HTMLInputElement).value;

    if (!courseName || !teacherId || !courseDescription) {
        alert('Por favor, preencha nome, descrição e professor.');
        return;
    }
     if (isNaN(monthlyFee) || monthlyFee < 0) {
        alert('Por favor, insira um valor de mensalidade válido.');
        return;
    }
    if (paymentType === 'parcelado' && (!installmentsValue || parseInt(installmentsValue, 10) <= 0)) {
        alert('Por favor, insira um número de parcelas válido.');
        return;
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
        alert('Para agendar, por favor preencha ambos os horários de início e fim.');
        return;
    }

    const conflictCourse = checkTeacherScheduleConflict(teacherId, dayOfWeek, startTime, endTime);
    if (conflictCourse) {
        const proceed = window.confirm(`AVISO: O professor selecionado já está alocado para o curso "${conflictCourse.name}" neste horário (${conflictCourse.dayOfWeek}, ${conflictCourse.startTime}-${conflictCourse.endTime}).\n\nDeseja criar o curso mesmo assim?`);
        if (!proceed) {
            return;
        }
    }

    const newCourse: Course = {
        id: db.nextCourseId++,
        name: courseName,
        description: courseDescription,
        teacherId: teacherId,
        totalSlots: totalSlotsValue ? parseInt(totalSlotsValue, 10) : null,
        status: 'Aberto',
        monthlyFee,
        paymentType,
        installments: paymentType === 'parcelado' ? parseInt(installmentsValue, 10) : undefined,
        dayOfWeek: dayOfWeek || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
    };
    db.courses.push(newCourse);
    saveDb();
    window.handleNavigateBackToDashboard();
}

window.handleUpdateCourse = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const courseId = parseInt((form.elements.namedItem('courseId') as HTMLInputElement).value, 10);
    const courseName = (form.elements.namedItem('courseName') as HTMLInputElement).value;
    const courseDescription = (form.elements.namedItem('courseDescription') as HTMLTextAreaElement).value;
    const teacherId = parseInt((form.elements.namedItem('teacherId') as HTMLSelectElement).value, 10);
    const totalSlotsValue = (form.elements.namedItem('totalSlots') as HTMLInputElement).value;
    const monthlyFee = parseFloat((form.elements.namedItem('monthlyFee') as HTMLInputElement).value);
    const paymentType = (form.elements.namedItem('paymentType') as HTMLInputElement).value as PaymentType;
    const installmentsValue = (form.elements.namedItem('installments') as HTMLInputElement).value;
    const dayOfWeek = (form.elements.namedItem('dayOfWeek') as HTMLSelectElement).value;
    const startTime = (form.elements.namedItem('startTime') as HTMLInputElement).value;
    const endTime = (form.elements.namedItem('endTime') as HTMLInputElement).value;

    if (isNaN(monthlyFee) || monthlyFee < 0) {
        alert('Por favor, insira um valor de mensalidade válido.');
        return;
    }
    if (paymentType === 'parcelado' && (!installmentsValue || parseInt(installmentsValue, 10) <= 0)) {
        alert('Por favor, insira um número de parcelas válido.');
        return;
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
        alert('Para agendar, por favor preencha ambos os horários de início e fim.');
        return;
    }
    
    const conflictCourse = checkTeacherScheduleConflict(teacherId, dayOfWeek, startTime, endTime, courseId);
    if (conflictCourse) {
        const proceed = window.confirm(`AVISO: O professor selecionado já está alocado para o curso "${conflictCourse.name}" neste horário (${conflictCourse.dayOfWeek}, ${conflictCourse.startTime}-${conflictCourse.endTime}).\n\nDeseja salvar a alteração mesmo assim?`);
        if (!proceed) {
            return;
        }
    }

    const course = db.courses.find(c => c.id === courseId);
    if (course) {
        course.name = courseName;
        course.description = courseDescription;
        course.teacherId = teacherId;
        course.totalSlots = totalSlotsValue ? parseInt(totalSlotsValue, 10) : null;
        course.monthlyFee = monthlyFee;
        course.paymentType = paymentType;
        course.installments = paymentType === 'parcelado' ? parseInt(installmentsValue, 10) : undefined;
        course.dayOfWeek = dayOfWeek || undefined;
        course.startTime = startTime || undefined;
        course.endTime = endTime || undefined;
        saveDb();
    } else {
        alert('Erro: Curso não encontrado.');
    }
    
    currentCourseIdForEditing = null;
    render();
}

window.handleUpdateProfile = async (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId') as string, 10);
    const userToUpdate = db.users.find(u => u.id === userId);

    if (!userToUpdate) {
        alert('Usuário não encontrado!');
        return;
    }

    const profilePicFile = formData.get('profilePicture') as File;
    if (profilePicFile && profilePicFile.size > 0) {
        userToUpdate.profilePicture = await fileToBase64(profilePicFile);
    }

    // Only update fields the user is allowed to edit
    const updatableFields: (keyof User)[] = ['firstName', 'lastName', 'age', 'address'];
    updatableFields.forEach(field => {
        const element = form.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (element && !element.disabled) {
            const value = formData.get(field) as string;
            (userToUpdate as any)[field] = field === 'age' ? (value ? parseInt(value, 10) : undefined) : value;
        }
    });
    
    saveDb();
    alert('Perfil atualizado com sucesso!');
    window.handleNavigateBackToDashboard();
};

window.handleUpdateSchoolProfile = async (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    db.schoolProfile.name = formData.get('name') as string;
    db.schoolProfile.cnpj = formData.get('cnpj') as string;
    db.schoolProfile.phone = formData.get('phone') as string;
    db.schoolProfile.pixKeyType = formData.get('pixKeyType') as PixKeyType;
    db.schoolProfile.pixKey = formData.get('pixKey') as string;
    db.schoolProfile.address = formData.get('address') as string;

    const schoolPicFile = formData.get('schoolProfilePicture') as File;
    if (schoolPicFile && schoolPicFile.size > 0) {
        db.schoolProfile.profilePicture = await fileToBase64(schoolPicFile);
    }

    saveDb();
    alert('Dados da unidade atualizados com sucesso!');
    window.handleNavigateBackToDashboard();
}

window.handleUpdateSystemSettings = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    db.systemSettings.smtpServer = formData.get('smtpServer') as string;
    db.systemSettings.smtpPort = formData.get('smtpPort') as string;
    db.systemSettings.smtpUser = formData.get('smtpUser') as string;
    db.systemSettings.smtpPass = formData.get('smtpPass') as string;
    db.systemSettings.language = formData.get('language') as 'pt-BR' | 'en-US';
    db.systemSettings.timeZone = formData.get('timeZone') as string;
    db.systemSettings.currencySymbol = formData.get('currencySymbol') as string;
    db.systemSettings.defaultDueDay = parseInt(formData.get('defaultDueDay') as string, 10);
    db.systemSettings.aiApiKey = formData.get('aiApiKey') as string;
    db.systemSettings.dbHost = formData.get('dbHost') as string;
    db.systemSettings.dbPort = formData.get('dbPort') as string;
    db.systemSettings.dbName = formData.get('dbName') as string;
    db.systemSettings.dbUser = formData.get('dbUser') as string;
    db.systemSettings.dbPass = formData.get('dbPass') as string;
    
    saveDb();
    alert('Configurações salvas com sucesso!');
    window.handleNavigateBackToDashboard();
}

window.previewProfileImage = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const preview = document.getElementById('profile-pic-preview') as HTMLImageElement;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                preview.src = e.target.result as string;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

window.previewSchoolImage = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const preview = document.getElementById('school-pic-preview') as HTMLImageElement;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                preview.src = e.target.result as string;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}


window.handleRoleChange = (event: Event, userId: number) => {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as UserRole;
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.role = newRole;
        saveDb();
        render();
    }
}

window.handleUserFilterChange = (event: Event) => {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = input;

    type FilterKeys = keyof typeof userFilters;

    if (name === 'courseId') {
        userFilters.courseId = value === 'all' ? 'all' : parseInt(value, 10);
        if (userFilters.courseId === 'all') {
            userFilters.enrollmentStatus = 'all';
        }
    } else {
        userFilters[name as FilterKeys] = value as any;
    }
    
    render();
}

window.handleDashboardDateChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    dashboardSelectedDate = input.value;
    render();
}

window.handleAttendanceDateChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    attendanceSelectedDate = input.value;
    render();
}

window.handleEndCourse = (courseId: number) => {
    const course = db.courses.find(c => c.id === courseId);
    if (course && currentUser) {
        course.status = 'Encerrado';
        course.closedBy = {
            adminId: currentUser.id,
            date: new Date().toISOString(),
        };
        saveDb();
        render();
    }
}

window.handleReopenCourse = (courseId: number) => {
    if (currentUser?.role !== 'superadmin') {
        alert('Apenas o superadmin pode reabrir cursos.');
        return;
    }
    const course = db.courses.find(c => c.id === courseId);
    if (course) {
        course.status = 'Aberto';
        course.closedBy = undefined;
        saveDb();
        render();
    }
}

window.handleNavigateToAttendance = (courseId: number) => {
    currentCourseIdForAttendance = courseId;
    attendanceSelectedDate = new Date().toISOString().split('T')[0];
    render();
}

window.handleNavigateToEditCourse = (courseId: number) => {
    currentCourseIdForEditing = courseId;
    render();
}

window.handleNavigateToCreateCourse = () => {
    currentAdminView = 'createCourse';
    render();
};

window.handleNavigateToCourseDetails = (courseId: number) => {
    currentCourseIdForDetails = courseId;
    render();
}

window.handleNavigateToUserManagement = () => {
    currentAdminView = 'userManagement';
    render();
}

window.handleNavigateToSystemSettings = () => {
    currentAdminView = 'systemSettings';
    render();
};

window.handleNavigateToProfile = (userId: number) => {
    currentProfileUserId = userId;
    render();
}

window.handleNavigateToSchoolProfile = () => {
    isViewingSchoolProfile = true;
    render();
}

window.handleNavigateToFinancialDashboard = () => {
    isViewingFinancialDashboard = true;
    isViewingFinancialControlPanel = false;
    expandedStudentIdForFinance = null;
    render();
}

window.handleNavigateToFinancialControlPanel = () => {
    isViewingFinancialDashboard = false;
    isViewingFinancialControlPanel = true;
    render();
}

window.handleToggleFinanceStudent = (studentId: number) => {
    if (expandedStudentIdForFinance === studentId) {
        expandedStudentIdForFinance = null;
    } else {
        expandedStudentIdForFinance = studentId;
    }
    render();
}

window.handlePaymentStatusChange = (event: Event, paymentId: number) => {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as PaymentStatus;
    const payment = db.payments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = newStatus;
        if (newStatus === 'Pago') {
            payment.paymentDate = new Date().toISOString().split('T')[0];
        } else {
            payment.paymentDate = undefined;
        }
        saveDb();
        render();
    }
};

window.handleInitiatePixPayment = (paymentIds: number[]) => {
    isPixModalOpen = true;
    pixPaymentIds = paymentIds;

    const paymentsToProcess = db.payments.filter(p => paymentIds.includes(p.id));
    if (paymentsToProcess.length === 0) {
        alert("Nenhum pagamento selecionado.");
        isPixModalOpen = false;
        return;
    }
    const totalAmount = paymentsToProcess.reduce((sum, p) => sum + p.amount, 0);
    const coursesInfo = [...new Set(paymentsToProcess.map(p => db.courses.find(c => c.id === p.courseId)?.name))].filter(Boolean).join(', ');
    
    const txid = `SGE${Date.now()}`;
    
    const pixCode = generateBrCode(db.schoolProfile.pixKey, totalAmount, db.schoolProfile.name, 'SAO PAULO', txid, coursesInfo);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;

    pixModalContent = {
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
    
    isPixModalOpen = false;
    pixPaymentIds = [];
    pixModalContent = null;
    
    render();
};

window.handleCopyPixCode = () => {
    const input = document.getElementById('pix-code') as HTMLInputElement;
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(input.value);
        alert('Código PIX copiado!');
    }
};

window.handleGenerateDescription = async (formId: 'create-course-form' | 'edit-course-form') => {
    const apiKey = db.systemSettings.aiApiKey;
    if (!apiKey) {
        alert('Por favor, configure a Chave de API de IA nas Configurações do Sistema.');
        return;
    }

    const form = document.getElementById(formId) as HTMLFormElement;
    const courseNameInput = form.elements.namedItem('courseName') as HTMLInputElement;
    const descriptionTextarea = form.elements.namedItem('courseDescription') as HTMLTextAreaElement;
    const generateButton = form.querySelector('.generate-ai-button') as HTMLButtonElement;

    const courseName = courseNameInput.value;
    if (!courseName) {
        alert('Por favor, insira um nome para o curso antes de gerar a descrição.');
        return;
    }

    generateButton.disabled = true;
    generateButton.textContent = 'Gerando...';

    try {
        const { GoogleGenAI } = await import('@google/genai');
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

window.handleExportDatabase = () => {
    try {
        const dataToExport = JSON.parse(JSON.stringify(db));
        const dataStr = JSON.stringify(dataToExport, null, 2);
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
        alert('Ocorreu um erro durante a exportação.');
    }
};

window.handleNavigateBackToDashboard = () => {
    const previousAdminView = currentAdminView;

    currentCourseIdForAttendance = null;
    currentCourseIdForEditing = null;
    currentCourseIdForDetails = null;
    currentProfileUserId = null;
    isViewingSchoolProfile = false;
    isViewingFinancialDashboard = false;
    isViewingFinancialControlPanel = false;
    expandedStudentIdForFinance = null;
    currentAdminView = 'dashboard';
    
    if (previousAdminView === 'userManagement') {
        userFilters = { name: '', role: 'all', courseId: 'all', enrollmentStatus: 'all' };
    }
    render();
};

// --- Drag and Drop Handlers ---
let draggedElement: HTMLElement | null = null;
function getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')] as HTMLElement[];
    
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

window.handleDragStart = (event: DragEvent) => {
    if (event.target && (event.target as HTMLElement).classList.contains('card')) {
        draggedElement = event.target as HTMLElement;
        setTimeout(() => {
            draggedElement!.classList.add('dragging');
        }, 0);
    }
};

window.handleDragEnd = (event: DragEvent) => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
};

window.handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    const container = (event.target as HTMLElement).closest('.dashboard-grid');
    if (container && draggedElement) {
        const afterElement = getDragAfterElement(container as HTMLElement, event.clientY);
        if (afterElement == null) {
            container.appendChild(draggedElement);
        } else {
            container.insertBefore(draggedElement, afterElement);
        }
    }
};

window.handleDrop = (event: DragEvent) => {
    event.preventDefault();
     const container = (event.target as HTMLElement).closest('.dashboard-grid');
    if (container && currentUser) {
        const cardIds = [...container.querySelectorAll('.card')].map(card => card.id);
        localStorage.setItem(`cardOrder_${currentUser.id}`, JSON.stringify(cardIds));
    }
};


// --- INITIALIZATION ---
function applyCardOrder() {
    if (!currentUser) return;
    const grid = appRoot.querySelector('.dashboard-grid');
    if (!grid) return;

    const savedOrder = localStorage.getItem(`cardOrder_${currentUser.id}`);
    if (savedOrder) {
        try {
            const order = JSON.parse(savedOrder);
            const fragment = document.createDocumentFragment();
            order.forEach((cardId: string) => {
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
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const tokenParam = urlParams.get('token');

  if (viewParam === 'resetPassword' && tokenParam) {
      currentView = 'resetPassword';
      passwordResetToken = tokenParam;
  }
  
  db = loadDb();
  if(db) {
      render();
  }
}

init();

// Fix: Add an empty export to treat this file as a module.
// This is necessary for the `declare global` block to correctly augment the Window interface.
export {};
