import { apiCall } from './api.js';
import { appState } from './state.js';
import { render } from './router.js';
import { generateBrCode } from './utils/pix.js';
import { fileToBase64 } from './utils/helpers.js';
import { renderEnrollmentModal } from './components/enrollmentModal.js'; // <-- Importa o novo modal

// --- Funções de Autenticação ---
export async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.elements.namedItem('email').value;
    const password = form.elements.namedItem('password').value;

    try {
        const data = await apiCall('login', { email, password });
        if (data && data.user) {
            appState.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
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
    localStorage.removeItem('currentUser');
    appState.currentUser = null;
    appState.currentView = 'login';

    // Reseta o estado global para o inicial
    Object.assign(appState, {
        users: [], courses: [], enrollments: [], attendance: [], payments: [],
        schoolProfile: appState.schoolProfile, // Mantém o perfil da escola carregado
        systemSettings: null, // Limpa settings para recarregar se necessário
        adminView: 'dashboard', viewingCourseId: null, viewingUserId: null,
        userFilters: { name: '', role: 'all', courseId: 'all', enrollmentStatus: 'all' },
        attendanceState: { courseId: null, selectedDate: new Date().toISOString().split('T')[0], students: [], history: {} },
        financialState: { isDashboardVisible: false, isControlPanelVisible: false, isDefaultersReportVisible: false, selectedDate: new Date().toISOString().slice(0, 7), defaultersReportMonth: new Date().toISOString().slice(0, 7), defaultersReportCourseId: 'all', expandedStudentId: null },
        documentTemplatesState: { isVisible: false },
        pixModal: { isOpen: false, paymentIds: [], content: null },
        enrollmentModalState: { isOpen: false, data: null, isReenrollment: false }
    });
    render();
}


// --- Funções de Matrícula ---

// FUNÇÃO ANTIGA handleEnroll (Comentada/Removida)
/*
export async function handleEnroll(event) {
    // ... (código antigo) ...
}
*/

// NOVA FUNÇÃO para iniciar o processo de matrícula via modal
export async function handleInitiateEnrollment(courseId, isReenrollment = false) {
    if (!appState.currentUser || appState.currentUser.role !== 'student') return;

    // Fecha modais anteriores
    handleClosePixModal();
    handleCloseEnrollmentModal();

    try {
        // Opcional: Adicionar indicador visual de carregamento
        // document.body.classList.add('loading');

        // ***** ALTERAÇÃO AQUI: Adiciona 'GET' como terceiro parâmetro *****
        const data = await apiCall('getEnrollmentDocuments', { studentId: appState.currentUser.id, courseId }, 'GET');

        // Adiciona dados necessários pelo modal
        data.courseId = courseId;
        data.isReenrollment = isReenrollment;

        // Atualiza estado do modal
        appState.enrollmentModalState.isOpen = true;
        appState.enrollmentModalState.data = data;
        appState.enrollmentModalState.isReenrollment = isReenrollment;

        // Chama render() para exibir o modal (a lógica está no router.js)
        render();

    } catch (e) {
        console.error("Erro ao iniciar matrícula:", e);
        // erro já tratado por apiCall
    } finally {
        // Opcional: Remover indicador visual de carregamento
        // document.body.classList.remove('loading');
    }
}

// NOVA FUNÇÃO para fechar o modal de matrícula (com lógica de logout da Fase 5)
export function handleCloseEnrollmentModal() {
    const modal = document.querySelector('.enrollment-modal');
    if (modal) {
        modal.remove();
    }

    // Verifica se estava no fluxo de rematrícula obrigatória ANTES de resetar o estado
    const wasReenrollment = appState.enrollmentModalState.isReenrollment;
    const courseIdBeingProcessed = appState.enrollmentModalState.data?.courseId;

    // Reseta o estado do modal
    appState.enrollmentModalState = { isOpen: false, data: null, isReenrollment: false };

    // --- LÓGICA DE LOGOUT ---
    if (wasReenrollment) {
        let stillNeedsReenrollment = false;
        const now = new Date();
        const enrollments = appState.enrollments || [];
        const enrollment = enrollments.find(e => e.courseId === courseIdBeingProcessed && e.status === 'Aprovada');
        if (enrollment && enrollment.contractAcceptedAt) {
            try {
                const acceptedDate = new Date(enrollment.contractAcceptedAt);
                if (!isNaN(acceptedDate.getTime())) {
                    const checkDate = new Date(acceptedDate.getTime());
                    checkDate.setMonth(checkDate.getMonth() + 12);
                    if (now >= checkDate) stillNeedsReenrollment = true;
                }
            } catch (e) { console.error("Erro ao verificar data na lógica de logout:", e); }
        }

        if (stillNeedsReenrollment) {
            console.log("Modal de rematrícula fechado sem confirmação. Deslogando...");
            alert("Você precisa concluir a renovação da sua matrícula para continuar acessando o sistema.");
            setTimeout(handleLogout, 50);
        } else {
             console.log("Rematrícula não é mais necessária ou foi concluída. Tentando renderizar dashboard...");
             setTimeout(render, 50);
        }
    }
}


// NOVA FUNÇÃO para submeter os dados do modal de matrícula/rematrícula
export async function handleSubmitEnrollment(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('#submit-enrollment-btn');
    const formData = new FormData(form);
    const enrollmentData = {};

    formData.forEach((value, key) => { enrollmentData[key] = value.trim(); });

    enrollmentData.acceptContract = formData.has('acceptContract');
    enrollmentData.acceptImageTerms = formData.has('acceptImageTerms');

    const studentId = parseInt(enrollmentData.studentId, 10);
    const courseId = parseInt(enrollmentData.courseId, 10);
    const isReenrollment = enrollmentData.isReenrollment === 'true';

    delete enrollmentData.studentId; delete enrollmentData.courseId; delete enrollmentData.isReenrollment;

    // Validação básica frontend
    if (!enrollmentData.aluno_rg || !enrollmentData.aluno_cpf) return alert("Preencha RG e CPF.");
    const isMinor = appState.enrollmentModalState.data?.isMinor;
    if (isMinor && (!enrollmentData.guardianName || !enrollmentData.guardianRG || !enrollmentData.guardianCPF || !enrollmentData.guardianEmail || !enrollmentData.guardianPhone)) return alert("Preencha todos os dados do responsável.");
    if (!enrollmentData.acceptContract) return alert("Aceite o Contrato.");

    submitButton.disabled = true; submitButton.textContent = 'Enviando...';
    const apiAction = isReenrollment ? 'submitReenrollment' : 'submitEnrollment';

    try {
        const result = await apiCall(apiAction, { studentId, courseId, enrollmentData });
        alert(result.message || 'Operação realizada!');
        handleCloseEnrollmentModal(); // Fecha apenas em sucesso

        // Atualiza estado local
        const enrollmentIndex = appState.enrollments.findIndex(e => e.studentId === studentId && e.courseId === courseId);
        const nowISO = new Date().toISOString();

        if (apiAction === 'submitEnrollment') {
            if (enrollmentIndex > -1) { // Reativação
                if (appState.enrollments[enrollmentIndex].status === 'Cancelada') {
                    appState.enrollments[enrollmentIndex].status = 'Pendente';
                    appState.enrollments[enrollmentIndex].contractAcceptedAt = nowISO;
                    appState.enrollments[enrollmentIndex].termsAcceptedAt = enrollmentData.acceptImageTerms ? nowISO : null;
                }
            } else { // Nova matrícula
                appState.enrollments.push({ studentId, courseId, status: 'Pendente', contractAcceptedAt: nowISO, termsAcceptedAt: enrollmentData.acceptImageTerms ? nowISO : null, scholarshipPercentage: 0, customMonthlyFee: null });
            }
        } else if (apiAction === 'submitReenrollment') { // Rematrícula
            if (enrollmentIndex > -1) {
                appState.enrollments[enrollmentIndex].contractAcceptedAt = nowISO;
                appState.enrollments[enrollmentIndex].termsAcceptedAt = enrollmentData.acceptImageTerms ? nowISO : null;
            }
            // Recarrega pagamentos
            const paymentData = await apiCall('getStudentPayments', { studentId }, 'GET');
            appState.payments = [...appState.payments.filter(p => p.studentId !== studentId), ...(paymentData.payments || [])];
        }

        // Atualiza dados do usuário no estado local
        if(appState.currentUser && appState.currentUser.id === studentId) {
            appState.currentUser.rg = enrollmentData.aluno_rg; appState.currentUser.cpf = enrollmentData.aluno_cpf;
             if (isMinor) {
                 appState.currentUser.guardianName=enrollmentData.guardianName; appState.currentUser.guardianRG=enrollmentData.guardianRG; appState.currentUser.guardianCPF=enrollmentData.guardianCPF; appState.currentUser.guardianEmail=enrollmentData.guardianEmail; appState.currentUser.guardianPhone=enrollmentData.guardianPhone;
             }
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
        }

        render();

    } catch (e) {
        console.error(`Falha ao submeter matrícula (${apiAction}):`, e);
        // Reabilita o botão em caso de erro
         if (submitButton) {
             submitButton.disabled = !submitButton.form?.checkValidity() || !document.getElementById('acceptContract')?.checked;
             submitButton.textContent = 'Confirmar Matrícula';
         }
    }
}


// --- Funções de Administração e Outras ---

export async function handleApprove(event) {
    event.preventDefault(); const form = event.target; const studentId = parseInt(form.dataset.studentId, 10); const courseId = parseInt(form.dataset.courseId, 10);
    const billingStartChoice = form.elements.namedItem('billingStart').value; const overrideFeeInput = form.elements.namedItem('overrideFee');
    const overrideFee = (overrideFeeInput && overrideFeeInput.value !== '' && !isNaN(parseFloat(overrideFeeInput.value)) && parseFloat(overrideFeeInput.value) >= 0) ? parseFloat(overrideFeeInput.value) : null;
    try {
        await apiCall('approveEnrollment', { studentId, courseId, billingStartChoice, overrideFee });
        const idx = appState.enrollments.findIndex(e=>e.studentId===studentId && e.courseId===courseId); if(idx>-1){ appState.enrollments[idx].status='Aprovada'; appState.enrollments[idx].customMonthlyFee=overrideFee; }
        const paymentData = await apiCall('getStudentPayments', { studentId }, 'GET'); appState.payments = [...appState.payments.filter(p=>p.studentId !== studentId), ...(paymentData.payments||[])];
        render();
    } catch (e) { /* handled by apiCall */ }
}

export async function handleSaveAttendance(event) {
    event.preventDefault(); const form = event.target; const courseId = parseInt(form.dataset.courseId, 10); const date = form.elements.namedItem('attendanceDate').value; const formData = new FormData(form); const absentStudentIds = formData.getAll('absent').map(id => parseInt(id, 10));
    try { await apiCall('saveAttendance', { courseId, date, absentStudentIds }); alert('Frequência salva!'); appState.attendanceState.history = {}; render(); } catch(e) { /* handled by apiCall */ }
}

export async function handleCreateCourse(event) {
    event.preventDefault(); const form = event.target; const formData = new FormData(form); const courseData = Object.fromEntries(formData.entries()); if (courseData.totalSlots === '') delete courseData.totalSlots; if (courseData.installments === '') delete courseData.installments;
    try { await apiCall('createCourse', { courseData }); alert('Curso criado!'); handleNavigateBackToDashboard(); } catch(e) { /* handled by apiCall */ }
}

export async function handleUpdateCourse(event) {
    event.preventDefault(); const form = event.target; const formData = new FormData(form); const courseData = Object.fromEntries(formData.entries()); const courseId = parseInt(courseData.courseId, 10); if (courseData.totalSlots === '') courseData.totalSlots = null; if (courseData.installments === '') courseData.installments = null;
    try { await apiCall('updateCourse', { courseData }); alert('Curso atualizado!'); const idx = appState.courses.findIndex(c=>c.id===courseId); if(idx>-1) appState.courses[idx]={...appState.courses[idx], ...courseData}; handleNavigateBackToDashboard(); } catch(e) { /* handled by apiCall */ }
}

export async function handleUpdateProfile(event) {
    event.preventDefault(); const form = event.target; const formData = new FormData(form); const userId = parseInt(formData.get('userId'), 10); const profileData = {};
    formData.forEach((value, key) => { if (key !== 'profilePicture' || (form.elements.profilePicture && form.elements.profilePicture.files.length > 0)) { const optionalNullable = ['age', 'rg', 'cpf', 'address', 'guardianName', 'guardianRG', 'guardianCPF', 'guardianEmail', 'guardianPhone']; profileData[key] = (optionalNullable.includes(key) && value.trim() === '') ? null : value; } });
    const profilePicFile = formData.get('profilePicture'); if (profilePicFile instanceof File && profilePicFile.size > 0) profileData.profilePicture = await fileToBase64(profilePicFile); delete profileData.userId;
    try {
        await apiCall('updateProfile', { userId: userId, profileData: profileData }); alert('Perfil atualizado!');
        const updateLocal = (user) => { if (!user) return null; const updated = {...user}; for (const key in profileData) { if (key !== 'profilePicture') updated[key] = profileData[key]; } if (profileData.profilePicture) updated.profilePicture = profileData.profilePicture; return updated; };
        if (appState.currentUser && appState.currentUser.id === userId) { appState.currentUser = updateLocal(appState.currentUser); localStorage.setItem('currentUser', JSON.stringify(appState.currentUser)); }
        const idx = appState.users.findIndex(u=>u.id===userId); if(idx>-1) appState.users[idx]=updateLocal(appState.users[idx]);
        render();
    } catch (e) { /* handled by apiCall */ }
}

export async function handleUpdateSchoolProfile(event) {
    event.preventDefault(); const form = event.target; const formData = new FormData(form); const profileData = {}; formData.forEach((value, key) => { if (!['schoolProfilePicture', 'signatureImage'].includes(key) || (form.elements[key] && form.elements[key].files.length > 0)) profileData[key] = value.trim(); });
    const schoolPicFile = formData.get('schoolProfilePicture'); if (schoolPicFile instanceof File && schoolPicFile.size > 0) profileData.profilePicture = await fileToBase64(schoolPicFile);
    const signatureFile = formData.get('signatureImage'); if (signatureFile instanceof File && signatureFile.size > 0) profileData.signatureImage = await fileToBase64(signatureFile);
    if (!(schoolPicFile instanceof File && schoolPicFile.size > 0)) delete profileData.schoolProfilePicture; if (!(signatureFile instanceof File && signatureFile.size > 0)) delete profileData.signatureImage;
    try { const data = await apiCall('updateSchoolProfile', { profileData }); appState.schoolProfile = data.profile; alert('Dados da unidade atualizados!'); render(); } catch (e) { /* handled by apiCall */ }
}

export async function handleUpdateSystemSettings(event) {
    event.preventDefault(); const form = event.target; const elements = form.elements; const enableFine = elements.namedItem('enableTerminationFine').checked; const fineMonths = Math.max(1, parseInt(elements.namedItem('terminationFineMonths').value, 10) || 1);
    const settingsData = { language: elements.namedItem('language').value, timeZone: elements.namedItem('timeZone').value.trim(), currencySymbol: elements.namedItem('currencySymbol').value.trim(), defaultDueDay: Math.max(1, Math.min(28, parseInt(elements.namedItem('defaultDueDay').value, 10) || 10)), geminiApiKey: elements.namedItem('geminiApiKey').value || null, geminiApiEndpoint: elements.namedItem('geminiApiEndpoint').value.trim() || null, smtpServer: elements.namedItem('smtpServer').value.trim(), smtpPort: elements.namedItem('smtpPort').value.trim(), smtpUser: elements.namedItem('smtpUser').value.trim(), smtpPass: elements.namedItem('smtpPass').value, enableTerminationFine: enableFine ? 1 : 0, terminationFineMonths: fineMonths };
    try { await apiCall('updateSystemSettings', { settingsData }); alert('Configurações salvas!'); appState.systemSettings = null; render(); } catch(e) { /* handled by apiCall */ }
}

export async function handleUpdateDocumentTemplates(event) {
    event.preventDefault(); const form = event.target; const formData = new FormData(form); const templateData = Object.fromEntries(formData.entries());
    try { await apiCall('updateDocumentTemplates', templateData); alert('Modelos salvos!'); appState.systemSettings = null; handleNavigateBackToDashboard(); } catch(e) { /* handled by apiCall */ }
}

export async function handleChangePassword(event) {
    event.preventDefault(); const form = event.target; const formData = new FormData(form); const userId = parseInt(formData.get('userId'), 10); const currentPassword = formData.get('currentPassword'); const newPassword = formData.get('newPassword'); const confirmPassword = formData.get('confirmPassword');
    if (!currentPassword || !newPassword || !confirmPassword) return alert("Preencha todos os campos."); if (newPassword !== confirmPassword) return alert('Senhas não coincidem.'); if (newPassword.length < 6) return alert('Senha muito curta.');
    try { await apiCall('changePassword', { userId, currentPassword, newPassword }); alert('Senha alterada!'); form.reset(); } catch (e) { /* handled by apiCall */ }
}

// --- Funções de Preview de Imagem ---
export function previewProfileImage(event) { const input = event.target; const preview = document.getElementById('profile-pic-preview'); if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) preview.src = e.target.result; }; reader.readAsDataURL(input.files[0]); } }
export function previewSchoolImage(event) { const input = event.target; const preview = document.getElementById('school-pic-preview'); if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) preview.src = e.target.result; }; reader.readAsDataURL(input.files[0]); } }
export function previewSignatureImage(event) { const input = event.target; const preview = document.getElementById('signature-preview'); if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) preview.src = e.target.result; }; reader.readAsDataURL(input.files[0]); } }

// --- Funções de Gerenciamento (Admin) ---
export async function handleRoleChange(event, userId) { const newRole = event.target.value; try { await apiCall('updateUserRole', { userId, newRole }); const idx = appState.users.findIndex(u=>u.id===userId); if(idx>-1) appState.users[idx].role=newRole; } catch(e) { /* handled by apiCall */ } }
export function handleUserFilterChange(event) { const input = event.target; const { name, value } = input; if (name === 'courseId') { appState.userFilters.courseId = value === 'all' ? 'all' : parseInt(value, 10); if (appState.userFilters.courseId === 'all') appState.userFilters.enrollmentStatus = 'all'; } else { appState.userFilters[name] = value; } render(); }

// --- Funções Financeiras ---
export function handleDashboardDateChange(event) { appState.financialState.selectedDate = event.target.value; render(); }
export function handleDefaultersReportDateChange(event) { appState.financialState.defaultersReportMonth = event.target.value; render(); }
export function handleDefaultersReportChangeMonth(direction) { const date = new Date(appState.financialState.defaultersReportMonth + '-02'); date.setMonth(date.getMonth() + direction); appState.financialState.defaultersReportMonth = date.toISOString().slice(0, 7); render(); }
export function handleDefaultersReportCourseChange(event) { appState.financialState.defaultersReportCourseId = event.target.value; render(); }
export async function handleBulkPay(event) { event.preventDefault(); const form = event.target; const formData = new FormData(form); const paymentIds = formData.getAll('paymentIds').map(id => parseInt(id, 10)); if (paymentIds.length === 0) return alert('Nenhum selecionado.'); if (confirm(`Dar baixa em ${paymentIds.length}?`)) { try { const result = await apiCall('bulkUpdatePaymentStatus', { paymentIds }); alert(result.message || 'Atualizado!'); render(); } catch (e) { /* handled by apiCall */ } } }
export async function handlePaymentStatusChange(event, paymentId) { const newStatus = event.target.value; try { await apiCall('updatePaymentStatus', { paymentId, status: newStatus }); const idx = appState.payments.findIndex(p=>p.id===paymentId); if(idx>-1){ appState.payments[idx].status=newStatus; appState.payments[idx].paymentDate=(newStatus==='Pago')?new Date().toISOString().split('T')[0]:null; } render(); } catch(e) { /* handled by apiCall */ } }

// --- Funções de Frequência ---
export function handleAttendanceDateChange(event) { appState.attendanceState.selectedDate = event.target.value; render(); }

// --- Funções de Curso (Admin) ---
export async function handleEndCourse(courseId) { if(!appState.currentUser||!(appState.currentUser.role==='admin'||appState.currentUser.role==='superadmin')) return; if (confirm("Encerrar curso?")) { try { await apiCall('endCourse', { courseId, adminId: appState.currentUser.id }); const idx=appState.courses.findIndex(c=>c.id===courseId); if(idx>-1) appState.courses[idx].status='Encerrado'; render(); } catch(e) { /* handled by apiCall */ } } }
export async function handleReopenCourse(courseId) { if (appState.currentUser?.role !== 'superadmin') return alert('Apenas superadmin.'); if (confirm("Reabrir curso?")) { try { await apiCall('reopenCourse', { courseId }); const idx=appState.courses.findIndex(c=>c.id===courseId); if(idx>-1) appState.courses[idx].status='Aberto'; render(); } catch(e) { /* handled by apiCall */ } } }

// --- Funções de Matrícula (Admin/Aluno) ---
export async function handleCancelEnrollment(studentId, courseId) { if (confirm("Trancar matrícula?")) { try { const result = await apiCall('cancelEnrollment', { studentId, courseId }); alert(result.message || 'Trancada.'); const idx=appState.enrollments.findIndex(e=>e.studentId===studentId && e.courseId===courseId); if(idx>-1) appState.enrollments[idx].status='Cancelada'; render(); } catch (e) { /* handled by apiCall */ } } }
export async function handleReactivateEnrollment(studentId, courseId) { if (confirm("Reativar matrícula?")) { try { const result = await apiCall('reactivateEnrollment', { studentId, courseId }); alert(result.message || 'Reativada.'); const idx=appState.enrollments.findIndex(e=>e.studentId===studentId && e.courseId===courseId); if(idx>-1) appState.enrollments[idx].status='Aprovada'; render(); } catch (e) { /* handled by apiCall */ } } }
export async function handleUpdateEnrollmentDetails(event, studentId, courseId) { const button = event.target; const listItem = button.closest('li.list-item'); if (!listItem) return; const scholarshipInput = listItem.querySelector(`#scholarship-${courseId}`); const customFeeInput = listItem.querySelector(`#customFee-${courseId}`); const data = { studentId, courseId, scholarshipPercentage: Math.max(0, Math.min(100, parseFloat(scholarshipInput.value) || 0)), customMonthlyFee: (customFeeInput.value === '' || isNaN(parseFloat(customFeeInput.value)) || parseFloat(customFeeInput.value) < 0) ? null : parseFloat(customFeeInput.value) }; button.disabled = true; button.textContent = 'Salvando...'; try { const result = await apiCall('updateEnrollmentDetails', data); alert(result.message || 'Atualizado.'); const idx=appState.enrollments.findIndex(e=>e.studentId===studentId && e.courseId===courseId); if(idx>-1){ appState.enrollments[idx].scholarshipPercentage=data.scholarshipPercentage; appState.enrollments[idx].customMonthlyFee=data.customMonthlyFee; } if (appState.viewingUserId === studentId || appState.financialState.expandedStudentId === studentId) { const paymentData = await apiCall('getStudentPayments', { studentId }, 'GET'); appState.payments = [...appState.payments.filter(p => p.studentId !== studentId), ...(paymentData.payments || [])]; } render(); } catch (e) { /* handled by apiCall */ } finally { button.disabled = false; button.textContent = 'Salvar Alterações'; } }

// --- Funções de Geração de Documentos (PDF) ---
export function handleGenerateReceipt(paymentId) { window.open(`api/index.php?action=generateReceipt&paymentId=${paymentId}`, '_blank'); }
export function handleGenerateContractPdf(studentId, courseId) { window.open(`api/index.php?action=generateContractPdf&studentId=${studentId}&courseId=${courseId}`, '_blank'); }
export function handleGenerateImageTermsPdf(studentId, courseId) { window.open(`api/index.php?action=generateImageTermsPdf&studentId=${studentId}&courseId=${courseId}`, '_blank'); }

// --- Funções de Navegação ---
export function handleNavigateToAttendance(courseId) { appState.viewingCourseId = courseId; appState.adminView = 'attendance'; appState.attendanceState.selectedDate = new Date().toISOString().split('T')[0]; render(); }
export function handleNavigateToEditCourse(courseId) { appState.viewingCourseId = courseId; appState.adminView = 'editCourse'; render(); }
export function handleNavigateToCreateCourse() { appState.adminView = 'createCourse'; appState.viewingCourseId = null; appState.viewingUserId = null; render(); }
export function handleNavigateToCourseDetails(courseId) { appState.viewingCourseId = courseId; appState.adminView = 'details'; appState.viewingUserId = null; appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToUserManagement() { appState.adminView = 'userManagement'; appState.viewingCourseId = null; appState.viewingUserId = null; appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToSystemSettings() { appState.adminView = 'systemSettings'; appState.viewingCourseId = null; appState.viewingUserId = null; appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToDocumentTemplates() { appState.documentTemplatesState.isVisible = true; appState.adminView = 'dashboard'; appState.viewingCourseId = null; appState.viewingUserId = null; appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; render(); }
export function handleNavigateToProfile(userId) { appState.viewingUserId = userId; appState.viewingCourseId = null; appState.adminView = 'dashboard'; appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToSchoolProfile() { appState.viewingUserId = -1; appState.viewingCourseId = null; appState.adminView = 'dashboard'; appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToFinancialDashboard() { appState.financialState.isDashboardVisible = true; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.financialState.expandedStudentId = null; appState.viewingCourseId = null; appState.viewingUserId = null; appState.adminView = 'dashboard'; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToFinancialControlPanel() { appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = true; appState.financialState.isDefaultersReportVisible = false; appState.viewingCourseId = null; appState.viewingUserId = null; appState.adminView = 'dashboard'; appState.documentTemplatesState.isVisible = false; render(); }
export function handleNavigateToDefaultersReport() { appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = true; appState.viewingCourseId = null; appState.viewingUserId = null; appState.adminView = 'dashboard'; appState.documentTemplatesState.isVisible = false; render(); }
export async function handleToggleFinanceStudent(studentId) { const { financialState } = appState; if (financialState.expandedStudentId === studentId) { financialState.expandedStudentId = null; render(); } else { financialState.expandedStudentId = studentId; try { render(); const data = await apiCall('getStudentPayments', { studentId }, 'GET'); appState.payments = [...appState.payments.filter(p => p.studentId !== studentId), ...(data.payments || [])]; if (appState.financialState.expandedStudentId === studentId) render(); } catch(e) { console.error("Erro pagamentos:", e); financialState.expandedStudentId = null; render(); } } }

// --- Funções PIX ---
export function handleInitiatePixPayment(paymentIds) { if (!appState.schoolProfile || !appState.schoolProfile.pixKey) return alert("Chave PIX não configurada."); handleCloseEnrollmentModal(); appState.pixModal.isOpen = true; appState.pixModal.paymentIds = paymentIds; appState.pixModal.content = null; let paymentsToProcess = appState.payments.filter(p => paymentIds.includes(p.id) && (p.status === 'Pendente' || p.status === 'Atrasado')); if (paymentsToProcess.length !== paymentIds.length) { console.warn("Buscando detalhes da API para PIX..."); render(); apiCall('getStudentPayments', { studentId: appState.currentUser.id }, 'GET').then(data => { appState.payments = data.payments || []; paymentsToProcess = appState.payments.filter(p => paymentIds.includes(p.id) && (p.status === 'Pendente' || p.status === 'Atrasado')); if (paymentsToProcess.length === 0) throw new Error("Pagamentos pendentes não encontrados."); generatePixContent(paymentsToProcess); render(); }).catch(e => { console.error("Erro ao buscar pagamentos para PIX:", e); alert("Erro ao gerar PIX."); handleClosePixModal(); }); } else { generatePixContent(paymentsToProcess); render(); } }
function generatePixContent(paymentsToProcess) { const totalAmount = paymentsToProcess.reduce((sum, p) => sum + Number(p.amount), 0); const coursesInfo = [...new Set(paymentsToProcess.map(p => { const course = appState.courses.find(c => c.id === p.courseId); return course ? course.name : `Curso ID ${p.courseId}`; }))].filter(Boolean).join(', '); const txid = `SGE${Date.now()}${appState.currentUser.id}`; const merchantCity = appState.schoolProfile.city || 'SAO PAULO'; const pixCode = generateBrCode( appState.schoolProfile.pixKey, totalAmount, appState.schoolProfile.name.substring(0, 25), merchantCity.substring(0, 15), txid, `Pag SGE: ${coursesInfo.substring(0, 72)}` ); const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`; appState.pixModal.content = { qrCodeUrl, pixCode, totalAmount, coursesInfo }; }
export function handleClosePixModal() { const modal = document.querySelector('.modal-overlay:not(.enrollment-modal)'); if (modal) modal.remove(); appState.pixModal = { isOpen: false, paymentIds: [], content: null }; }
export function handleCopyPixCode() { const input = document.getElementById('pix-code'); if (input) { input.select(); input.setSelectionRange(0, 99999); try { navigator.clipboard.writeText(input.value); alert('Código PIX copiado!'); } catch (err) { alert('Falha ao copiar.'); } } }

// --- Funções de IA e Exportação ---
export async function handleGenerateDescription(formId) { const form = document.getElementById(formId); if (!form) return; const courseNameInput = form.elements.namedItem('courseName'); const descriptionTextarea = form.elements.namedItem('courseDescription'); const generateButton = form.querySelector('.generate-ai-button'); if (!courseNameInput || !descriptionTextarea || !generateButton) return; const courseName = courseNameInput.value.trim(); if (!courseName) return alert('Nome do curso necessário.'); generateButton.disabled = true; generateButton.textContent = 'Gerando...'; try { const data = await apiCall('generateAiDescription', { courseName }); if (data && data.description) descriptionTextarea.value = data.description; else throw new Error('Descrição não recebida.'); } catch (error) { /* handled by apiCall */ } finally { generateButton.disabled = false; generateButton.textContent = 'Gerar com IA ✨'; } }
export async function handleExportDatabase() { try { const data = await apiCall('exportDatabase', {}, 'GET'); const dataStr = JSON.stringify(data.exportData, null, 2); const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); a.href = url; a.download = `sge_export_${timestamp}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); alert('Exportação concluída!'); } catch (error) { /* handled by apiCall */ } }

// --- Função Universal de Navegação de Volta ---
export function handleNavigateBackToDashboard() {
    appState.viewingCourseId = null; appState.viewingUserId = null;
    appState.attendanceState.courseId = null;
    appState.financialState.isDashboardVisible = false; appState.financialState.isControlPanelVisible = false; appState.financialState.isDefaultersReportVisible = false; appState.financialState.expandedStudentId = null;
    appState.documentTemplatesState.isVisible = false;
    appState.adminView = 'dashboard'; appState.currentView = 'dashboard';
    render();
}