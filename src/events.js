import { apiCall } from './api.js';
import { appState } from './state.js';
import { render } from './router.js';
import { generateBrCode } from './utils/pix.js';
import { fileToBase64 } from './utils/helpers.js';

export async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.elements.namedItem('email').value;
    const password = form.elements.namedItem('password').value;

    try {
        const data = await apiCall('login', { email, password });
        if (data && data.user) {
            appState.currentUser = data.user;
            appState.currentView = 'dashboard';
            render();
        } else {
             throw new Error("Resposta de login inválida do servidor.");
        }
    } catch (error) {
       // O erro já é tratado e alertado por apiCall
    }
}

export async function handleRegister(event) {
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
       // O erro já é tratado por apiCall
    }
}

export function navigateTo(view) {
    appState.currentView = view;
    render();
}

export function handleLogout() {
    appState.currentUser = null;
    appState.currentView = 'login';
    // Reseta todo o estado para o inicial
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

export async function handleEnroll(event) {
    if (!appState.currentUser || appState.currentUser.role !== 'student') return;
    const button = event.target;
    const courseId = parseInt(button.dataset.courseId, 10);
    try {
        await apiCall('enroll', { studentId: appState.currentUser.id, courseId });
        alert('Solicitação de matrícula enviada! Aguarde a aprovação do administrador.');
        render();
    } catch (e) { /* handled by apiCall */ }
}

export async function handleApprove(event) {
    event.preventDefault();
    const form = event.target;
    const studentId = parseInt(form.dataset.studentId, 10);
    const courseId = parseInt(form.dataset.courseId, 10);
    const billingStartChoice = form.elements.namedItem('billingStart').value;
    try {
        await apiCall('approveEnrollment', { studentId, courseId, billingStartChoice });
        render();
    } catch (e) { /* handled by apiCall */ }
}

export async function handleSaveAttendance(event) {
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
    } catch(e) { /* handled by apiCall */ }
}

export async function handleCreateCourse(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData.entries());
    try {
        await apiCall('createCourse', { courseData });
        handleNavigateBackToDashboard();
    } catch(e) { /* handled by apiCall */ }
}

export async function handleUpdateCourse(event) {
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
    } catch(e) { /* handled by apiCall */ }
}

export async function handleUpdateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId'), 10);
    
    const profileData = {};
    formData.forEach((value, key) => {
        if (key !== 'profilePicture') profileData[key] = value;
    });

    const profilePicFile = formData.get('profilePicture');
    if (profilePicFile && profilePicFile.size > 0) {
        profileData.profilePicture = await fileToBase64(profilePicFile);
    }
    try {
        await apiCall('updateProfile', { userId, profileData });
        alert('Perfil atualizado com sucesso!');
        render();
    } catch (e) { /* handled by apiCall */ }
};

export async function handleUpdateSchoolProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const profileData = Object.fromEntries(formData.entries());

    const schoolPicFile = formData.get('schoolProfilePicture');
    if (schoolPicFile && schoolPicFile.size > 0) {
        profileData.profilePicture = await fileToBase64(schoolPicFile);
    }
    try {
        const data = await apiCall('updateSchoolProfile', { profileData });
        appState.schoolProfile = data.profile;
        alert('Dados da unidade atualizados com sucesso!');
        handleNavigateBackToDashboard();
    } catch (e) { /* handled by apiCall */ }
}

export async function handleUpdateSystemSettings(event) {
    event.preventDefault();
    const form = event.target;
    const elements = form.elements;

    const enableFine = elements.namedItem('enableTerminationFine').checked;
    const fineMonthsValue = elements.namedItem('terminationFineMonths').value;
    const terminationFineMonths = parseInt(fineMonthsValue, 10);
    
    const settingsData = {
        language: elements.namedItem('language').value,
        timeZone: elements.namedItem('timeZone').value,
        currencySymbol: elements.namedItem('currencySymbol').value,
        defaultDueDay: elements.namedItem('defaultDueDay').value,
        geminiApiKey: elements.namedItem('geminiApiKey').value || null,
        geminiApiEndpoint: elements.namedItem('geminiApiEndpoint').value || null,
        smtpServer: elements.namedItem('smtpServer').value,
        smtpPort: elements.namedItem('smtpPort').value,
        smtpUser: elements.namedItem('smtpUser').value,
        smtpPass: elements.namedItem('smtpPass').value,
        enableTerminationFine: enableFine ? 1 : 0,
        terminationFineMonths: !isNaN(terminationFineMonths) && terminationFineMonths > 0 ? terminationFineMonths : 1,
    };

    try {
        await apiCall('updateSystemSettings', { settingsData });
        alert('Configurações salvas com sucesso!');
        appState.systemSettings = null; // Força recarregar na próxima vez
        handleNavigateBackToDashboard();
    } catch(e) { /* handled by apiCall */ }
}


export async function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId'), 10);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        return alert('A nova senha e a confirmação não correspondem.');
    }

    try {
        await apiCall('changePassword', { userId, currentPassword, newPassword });
        alert('Senha alterada com sucesso!');
        form.reset();
    } catch (e) {
        // O erro já é tratado e alertado pela função apiCall
    }
}


export function previewProfileImage(event) {
    const input = event.target;
    const preview = document.getElementById('profile-pic-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) preview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export function previewSchoolImage(event) {
    const input = event.target;
    const preview = document.getElementById('school-pic-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) preview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export async function handleRoleChange(event, userId) {
    const newRole = event.target.value;
    try {
        await apiCall('updateUserRole', { userId, newRole });
        render();
    } catch(e) { /* handled by apiCall */ }
}

export function handleUserFilterChange(event) {
    const input = event.target;
    const { name, value } = input;
    if (name === 'courseId') {
        appState.userFilters.courseId = value === 'all' ? 'all' : parseInt(value, 10);
        if (appState.userFilters.courseId === 'all') appState.userFilters.enrollmentStatus = 'all';
    } else {
        appState.userFilters[name] = value;
    }
    render();
}

export function handleDashboardDateChange(event) {
    appState.financialState.selectedDate = event.target.value;
    render();
}

export function handleAttendanceDateChange(event) {
    appState.attendanceState.selectedDate = event.target.value;
    render();
}

export async function handleEndCourse(courseId) {
    if(!appState.currentUser) return;
    try {
        await apiCall('endCourse', { courseId, adminId: appState.currentUser.id });
        render();
    } catch(e) { /* handled by apiCall */ }
}

export async function handleReopenCourse(courseId) {
    if (appState.currentUser?.role !== 'superadmin') {
        return alert('Apenas o superadmin pode reabrir cursos.');
    }
    try {
        await apiCall('reopenCourse', { courseId });
        render();
    } catch(e) { /* handled by apiCall */ }
}

export async function handleCancelEnrollment(studentId, courseId) {
    const confirmation = confirm("Você tem certeza que deseja trancar esta matrícula? Esta ação não pode ser desfeita e pode gerar uma multa rescisória.");
    if (confirmation) {
        try {
            const result = await apiCall('cancelEnrollment', { studentId, courseId });
            alert(result.message || 'Matrícula trancada com sucesso.');
            render(); 
        } catch (e) {
            // error handled by apiCall
        }
    }
}

export async function handleReactivateEnrollment(studentId, courseId) {
    const confirmation = confirm("Você tem certeza que deseja reativar esta matrícula? Os pagamentos que foram cancelados serão restaurados.");
    if (confirmation) {
        try {
            const result = await apiCall('reactivateEnrollment', { studentId, courseId });
            alert(result.message || 'Matrícula reativada com sucesso.');
            render(); 
        } catch (e) {
            // error handled by apiCall
        }
    }
}

export async function handleUpdateEnrollmentDetails(event, studentId, courseId) {
    event.preventDefault();
    
    const scholarshipInput = document.getElementById(`scholarship-${courseId}`);
    const customFeeInput = document.getElementById(`customFee-${courseId}`);

    const data = {
        studentId: studentId,
        courseId: courseId,
        scholarshipPercentage: scholarshipInput.value,
        customMonthlyFee: customFeeInput.value
    };
    
    try {
        const result = await apiCall('updateEnrollmentDetails', data);
        alert(result.message || 'Detalhes da matrícula atualizados com sucesso.');
        render(); 
    } catch (e) {
        // error handled by apiCall
    }
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
    render();
};

export function handleNavigateToCourseDetails(courseId) {
    appState.viewingCourseId = courseId;
    appState.adminView = 'details';
    render();
}

export function handleNavigateToUserManagement() {
    appState.adminView = 'userManagement';
    render();
}

export function handleNavigateToSystemSettings() {
    appState.adminView = 'systemSettings';
    render();
};

export function handleNavigateToProfile(userId) {
    appState.viewingUserId = userId;
    render();
}

export function handleNavigateToSchoolProfile() {
    appState.viewingUserId = -1; // Flag especial para o perfil da escola
    render();
}

export function handleNavigateToFinancialDashboard() {
    appState.financialState.isDashboardVisible = true;
    appState.financialState.isControlPanelVisible = false;
    appState.financialState.expandedStudentId = null;
    render();
}

export function handleNavigateToFinancialControlPanel() {
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = true;
    render();
}

export async function handleToggleFinanceStudent(studentId) {
    const { financialState } = appState;
    if (financialState.expandedStudentId === studentId) {
        financialState.expandedStudentId = null;
    } else {
        financialState.expandedStudentId = studentId;
        const data = await apiCall('getStudentPayments', { studentId }, 'GET');
        appState.payments = data.payments;
    }
    render();
}

export async function handlePaymentStatusChange(event, paymentId) {
    const newStatus = event.target.value;
    try {
        await apiCall('updatePaymentStatus', { paymentId, status: newStatus });
        if (appState.financialState.expandedStudentId) {
            const data = await apiCall('getStudentPayments', { studentId: appState.financialState.expandedStudentId }, 'GET');
            appState.payments = data.payments;
        }
        render();
    } catch(e) { /* handled by apiCall */ }
};


export function handleInitiatePixPayment(paymentIds) {
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

    appState.pixModal.content = { qrCodeUrl, pixCode, totalAmount, coursesInfo };
    render();
};

export function handleClosePixModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    appState.pixModal = { isOpen: false, paymentIds: [], content: null };
    render();
};

export function handleCopyPixCode() {
    const input = document.getElementById('pix-code');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value);
        alert('Código PIX copiado!');
    }
};

export async function handleGenerateDescription(formId) {
    const form = document.getElementById(formId);
    const courseNameInput = form.elements.namedItem('courseName');
    const descriptionTextarea = form.elements.namedItem('courseDescription');
    const generateButton = form.querySelector('.generate-ai-button');

    const courseName = courseNameInput.value;
    if (!courseName) {
        return alert('Por favor, insira um nome para o curso antes de gerar a descrição.');
    }

    generateButton.disabled = true;
    generateButton.textContent = 'Gerando...';

    try {
        const data = await apiCall('generateAiDescription', { courseName });
        if (data && data.description) {
            descriptionTextarea.value = data.description;
        } else {
            throw new Error('A resposta da API não continha uma descrição.');
        }
    } catch (error) {
        console.error("AI description generation failed:", error);
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = 'Gerar com IA ✨';
    }
};

export async function handleExportDatabase() {
    try {
        const data = await apiCall('exportDatabase', {}, 'GET');
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

export function handleNavigateBackToDashboard() {
    appState.viewingCourseId = null;
    appState.viewingUserId = null;
    appState.attendanceState.courseId = null;
    appState.financialState.isDashboardVisible = false;
    appState.financialState.isControlPanelVisible = false;
    appState.adminView = 'dashboard';
    render();
};