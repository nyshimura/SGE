/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TYPES (Copied from main app for consistency) ---
type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'unassigned';
type PaymentStatus = 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
type PixKeyType = 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Aleatória';
type CourseStatus = 'Aberto' | 'Encerrado';
type PaymentType = 'recorrente' | 'parcelado';

interface User {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: UserRole;
  age?: number;
  profilePicture?: string;
  address?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

interface Course {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  totalSlots: number | null;
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
    profilePicture?: string;
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

// --- SECURITY HELPER ---
const salt = 'SGE_PROTOTYPE_SALT_v1';
async function hashPassword(password: string): Promise<string> {
    return btoa(password + salt);
}

// --- STATE ---
const installerRoot = document.getElementById('installer-root') as HTMLElement;
let currentStep = 1;
const configData = {
    db: { host: 'localhost', user: 'root', pass: '', name: 'school_db', port: '3306' },
    admin: { firstName: '', lastName: '', email: '', password: '', address: '', age: '' },
    smtp: { server: '', port: '', user: '', pass: '' }
};

// --- RENDER FUNCTIONS ---
function render() {
    if (!installerRoot) return;
    installerRoot.innerHTML = `
        <div class="step-indicator">
            ${renderStepIndicator(1, "Base de Dados", currentStep)}
            ${renderStepIndicator(2, "Super Usuário", currentStep)}
            ${renderStepIndicator(3, "E-mail (SMTP)", currentStep)}
            ${renderStepIndicator(4, "Concluir", currentStep)}
        </div>
        <div class="step-content">
            ${renderCurrentStep()}
        </div>
    `;
}

function renderStepIndicator(stepNumber: number, title: string, activeStep: number) {
    let className = 'step';
    if (stepNumber === activeStep) className += ' active';
    if (stepNumber < activeStep) className += ' completed';
    const checkmark = '&#10003;';
    return `
        <div class="${className}">
            <span class="step-number">${stepNumber < activeStep ? checkmark : stepNumber}</span>
            <span class="step-title">${title}</span>
        </div>
    `;
}

function renderCurrentStep() {
    switch (currentStep) {
        case 1: return renderStep1_Database();
        case 2: return renderStep2_Admin();
        case 3: return renderStep3_Smtp();
        case 4: return renderStep4_Finish();
        default: return '<h2>Etapa desconhecida</h2>';
    }
}

function renderStep1_Database() {
    return `
        <h2>1. Configuração da Base de Dados</h2>
        <p>Insira as informações de conexão com a sua base de dados MySQL. (Simulado)</p>
        <form id="step1-form" onsubmit="handleStep1Submit(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label for="dbHost">Host</label>
                    <input type="text" id="dbHost" name="host" value="${configData.db.host}" required>
                </div>
                <div class="form-group">
                    <label for="dbPort">Porta</label>
                    <input type="text" id="dbPort" name="port" value="${configData.db.port}" required>
                </div>
                <div class="form-group">
                    <label for="dbName">Nome da Base</label>
                    <input type="text" id="dbName" name="name" value="${configData.db.name}" required>
                </div>
                <div class="form-group">
                    <label for="dbUser">Usuário</label>
                    <input type="text" id="dbUser" name="user" value="${configData.db.user}" required>
                </div>
                <div class="form-group">
                    <label for="dbPass">Senha</label>
                    <input type="password" id="dbPass" name="pass" value="${configData.db.pass}">
                </div>
            </div>
            <div class="navigation-buttons">
                <button type="button" class="button secondary" onclick="handleTestConnection(event)">Testar Conexão</button>
                <button type="submit" class="button primary">Próximo &rarr;</button>
            </div>
        </form>
    `;
}

function renderStep2_Admin() {
    return `
        <h2>2. Criar Conta do Super Administrador</h2>
        <p>Esta será a conta principal com acesso total ao sistema.</p>
        <form id="step2-form" onsubmit="handleStep2Submit(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label for="firstName">Nome</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Sobrenome</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <div class="form-group">
                    <label for="age">Idade (Opcional)</label>
                    <input type="number" id="age" name="age">
                </div>
            </div>
             <div class="form-group">
                <label for="address">Endereço (Opcional)</label>
                <textarea id="address" name="address" rows="3"></textarea>
            </div>
            <div class="navigation-buttons">
                <button type="submit" class="button primary">Próximo &rarr;</button>
            </div>
        </form>
    `;
}

function renderStep3_Smtp() {
    return `
        <h2>3. Configuração de E-mail (SMTP)</h2>
        <p>Configure um servidor SMTP para enviar e-mails, como redefinições de senha. Esta etapa é opcional.</p>
        <form id="step3-form" onsubmit="handleStep3Submit(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label for="smtpServer">Servidor SMTP</label>
                    <input type="text" id="smtpServer" name="server" value="${configData.smtp.server}">
                </div>
                <div class="form-group">
                    <label for="smtpPort">Porta</label>
                    <input type="text" id="smtpPort" name="port" value="${configData.smtp.port}">
                </div>
                <div class="form-group">
                    <label for="smtpUser">Usuário</label>
                    <input type="text" id="smtpUser" name="user" value="${configData.smtp.user}">
                </div>
                <div class="form-group">
                    <label for="smtpPass">Senha</label>
                    <input type="password" id="smtpPass" name="pass" value="${configData.smtp.pass}">
                </div>
            </div>
            <div class="navigation-buttons">
                <button type="button" class="button secondary" onclick="handleSkipStep3()">Pular</button>
                <button type="button" class="button secondary" onclick="handleTestSmtp(event)">Testar Envio</button>
                <button type="submit" class="button primary">Próximo &rarr;</button>
            </div>
        </form>
    `;
}

function renderStep4_Finish() {
    return `
        <div class="finish-message">
            <h2>🎉 Instalação Concluída!</h2>
            <p>O sistema foi configurado com sucesso e está pronto para ser usado.</p>
            <p>Clique no botão abaixo para acessar a tela de login e começar a usar o SGE.</p>
            <div class="navigation-buttons" style="justify-content: center;">
                 <button type="button" class="button primary" onclick="handleFinishInstallation()">Acessar o Sistema</button>
            </div>
        </div>
    `;
}

// --- EVENT HANDLERS ---
function handleTestConnection(event: Event) {
    event.preventDefault();
    alert('Sucesso! A conexão com a base de dados foi estabelecida.');
}

function handleTestSmtp(event: Event) {
    event.preventDefault();
    alert('Sucesso! Um e-mail de teste foi enviado.');
}

function handleStep1Submit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    configData.db.host = formData.get('host') as string;
    configData.db.port = formData.get('port') as string;
    configData.db.name = formData.get('name') as string;
    configData.db.user = formData.get('user') as string;
    configData.db.pass = formData.get('pass') as string;
    currentStep = 2;
    render();
}

function handleStep2Submit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    configData.admin.firstName = formData.get('firstName') as string;
    configData.admin.lastName = formData.get('lastName') as string;
    configData.admin.email = formData.get('email') as string;
    configData.admin.password = formData.get('password') as string;
    configData.admin.age = formData.get('age') as string;
    configData.admin.address = formData.get('address') as string;
    currentStep = 3;
    render();
}

function handleStep3Submit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    configData.smtp.server = formData.get('server') as string;
    configData.smtp.port = formData.get('port') as string;
    configData.smtp.user = formData.get('user') as string;
    configData.smtp.pass = formData.get('pass') as string;
    currentStep = 4;
    render();
}

function handleSkipStep3() {
    currentStep = 4;
    render();
}

async function handleFinishInstallation() {
    const adminPassword = await hashPassword(configData.admin.password);
    const samplePassword = await hashPassword('123');

    const db = {
        users: [
            { id: 1, firstName: configData.admin.firstName, lastName: configData.admin.lastName, email: configData.admin.email, password: adminPassword, role: 'superadmin', age: configData.admin.age ? parseInt(configData.admin.age) : undefined, address: configData.admin.address || undefined },
            { id: 2, firstName: 'Ana', lastName: 'Silva', email: 'ana@email.com', password: samplePassword, role: 'student' as UserRole },
            { id: 3, firstName: 'Marcos', lastName: 'Costa', email: 'marcos@email.com', password: samplePassword, role: 'student' as UserRole },
            { id: 4, firstName: 'Carlos', lastName: 'Gerente', email: 'carlos@email.com', password: samplePassword, role: 'admin' as UserRole },
            { id: 5, firstName: 'Prof.', lastName: 'Silva', email: 'silva@email.com', password: samplePassword, role: 'teacher' as UserRole },
        ] as User[],
        courses: [
            { id: 1, name: 'Curso de Desenho Básico', description: 'Aprenda os fundamentos do desenho.', teacherId: 5, totalSlots: 5, status: 'Aberto' as CourseStatus, dayOfWeek: 'Segunda-feira', startTime: '19:00', endTime: '21:00', monthlyFee: 150.00, paymentType: 'recorrente' },
            { id: 2, name: 'Curso de Pintura a Óleo', description: 'Técnicas avançadas de pintura a óleo para artistas.', teacherId: 5, totalSlots: 10, status: 'Aberto' as CourseStatus, dayOfWeek: 'Quarta-feira', startTime: '19:00', endTime: '21:00', monthlyFee: 220.50, paymentType: 'parcelado', installments: 12 },
        ] as Course[],
        schoolProfile: {
            name: 'Minha Escola de Artes',
            cnpj: '00.000.000/0001-00',
            address: 'Endereço da Escola, 123',
            phone: '(00) 00000-0000',
            pixKeyType: 'CNPJ' as PixKeyType,
            pixKey: '00000000000100',
        } as SchoolProfile,
        systemSettings: {
            smtpServer: configData.smtp.server,
            smtpPort: configData.smtp.port,
            smtpUser: configData.smtp.user,
            smtpPass: configData.smtp.pass,
            language: 'pt-BR' as 'pt-BR' | 'en-US',
            timeZone: 'America/Sao_Paulo',
            currencySymbol: 'R$',
            defaultDueDay: 10,
            aiApiKey: '',
            dbHost: configData.db.host,
            dbUser: configData.db.user,
            dbPass: configData.db.pass,
            dbName: configData.db.name,
            dbPort: configData.db.port,
        } as SystemSettings,
        enrollments: [],
        attendance: [],
        payments: [],
        nextUserId: 6,
        nextCourseId: 3,
        nextPaymentId: 1,
    };
    
    localStorage.setItem('sge_config', JSON.stringify(db));
    window.location.href = '/index.html';
}

// Attach handlers to the window object
declare global {
    interface Window {
        handleStep1Submit: (event: Event) => void;
        handleStep2Submit: (event: Event) => void;
        handleStep3Submit: (event: Event) => void;
        handleSkipStep3: () => void;
        handleTestConnection: (event: Event) => void;
        handleTestSmtp: (event: Event) => void;
        handleFinishInstallation: () => void;
    }
}
window.handleStep1Submit = handleStep1Submit;
window.handleStep2Submit = handleStep2Submit;
window.handleStep3Submit = handleStep3Submit;
window.handleSkipStep3 = handleSkipStep3;
window.handleTestConnection = handleTestConnection;
window.handleTestSmtp = handleTestSmtp;
window.handleFinishInstallation = handleFinishInstallation;


// --- INIT ---
function init() {
    if (localStorage.getItem('sge_config')) {
        currentStep = 4;
    }
    render();
}

init();

export {};
