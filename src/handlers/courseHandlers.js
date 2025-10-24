// src/handlers/courseHandlers.js
import { apiCall } from '../api.js';
import { appState } from '../state.js';
import { render } from '../router.js';

export async function handleCreateCourse(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData.entries());
    
    // Normaliza valores vazios ou ausentes
    courseData.totalSlots = courseData.totalSlots || null;
    courseData.installments = courseData.installments || null;
    courseData.dayOfWeek = courseData.dayOfWeek || null;
    courseData.startTime = courseData.startTime || null;
    courseData.endTime = courseData.endTime || null;
    courseData.carga_horaria = courseData.carga_horaria || null; // <-- CAMPO NOVO

    const submitButton = form.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;

    try {
        await apiCall('createCourse', { courseData });
        alert('Curso criado!');
        window.AppHandlers.handleNavigateBackToDashboard();
    } catch(e) {
        alert(e.message || 'Erro ao criar curso.');
        if(submitButton) submitButton.disabled = false;
    }
}

export async function handleUpdateCourse(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData.entries());
    const courseId = parseInt(courseData.courseId, 10);
    
    // Normaliza valores vazios ou ausentes
    courseData.totalSlots = courseData.totalSlots || null;
    courseData.installments = courseData.installments || null;
    courseData.dayOfWeek = courseData.dayOfWeek || null;
    courseData.startTime = courseData.startTime || null;
    courseData.endTime = courseData.endTime || null;
    courseData.carga_horaria = courseData.carga_horaria || null; // <-- CAMPO NOVO

    const submitButton = form.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;

    try {
        await apiCall('updateCourse', { courseData });
        alert('Curso atualizado!');
        const idx = appState.courses.findIndex(c => c.id === courseId);
        if (idx > -1) {
             // Atualiza o estado local, garantindo tipos corretos
             Object.assign(appState.courses[idx], {
                 ...courseData, // Pega todos os dados do form
                 // Sobrescreve/converte tipos se necessário
                 totalSlots: courseData.totalSlots ? parseInt(courseData.totalSlots, 10) : null,
                 monthlyFee: parseFloat(courseData.monthlyFee),
                 installments: courseData.installments ? parseInt(courseData.installments, 10) : null,
                 teacherId: parseInt(courseData.teacherId, 10)
             });
        }
        window.AppHandlers.handleNavigateBackToDashboard();
    } catch(e) {
        alert(e.message || 'Erro ao atualizar curso.');
        if(submitButton) submitButton.disabled = false;
    }
}

export async function handleEndCourse(courseId) {
    if (!appState.currentUser || !(appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin')) return;
    if (confirm("Tem certeza que deseja encerrar este curso? Novas matrículas serão bloqueadas.")) {
        try {
            await apiCall('endCourse', { courseId, adminId: appState.currentUser.id });
            const idx = appState.courses.findIndex(c => c.id === courseId);
            if (idx > -1) {
                appState.courses[idx].status = 'Encerrado';
                appState.courses[idx].closed_by_admin_id = appState.currentUser.id;
                appState.courses[idx].closed_date = new Date().toISOString();
            }
            render();
        } catch(e) { alert(e.message || 'Erro ao encerrar curso.'); }
    }
}

export async function handleReopenCourse(courseId) {
    if (appState.currentUser?.role !== 'superadmin') return alert('Apenas superadministradores podem reabrir cursos.');
    if (confirm("Tem certeza que deseja reabrir este curso?")) {
        try {
            await apiCall('reopenCourse', { courseId });
            const idx = appState.courses.findIndex(c => c.id === courseId);
            if (idx > -1) {
                appState.courses[idx].status = 'Aberto';
                appState.courses[idx].closed_by_admin_id = null;
                appState.courses[idx].closed_date = null;
            }
            render();
        } catch(e) { alert(e.message || 'Erro ao reabrir curso.'); }
    }
}

export async function handleSaveAttendance(event) {
    event.preventDefault();
    const form = event.target;
    const courseId = parseInt(form.dataset.courseId, 10);
    const date = form.elements.namedItem('attendanceDate').value;
    const formData = new FormData(form);
    const absentStudentIds = formData.getAll('absent').map(id => parseInt(id, 10));
    const submitButton = form.querySelector('button[type="submit"]');

    if(submitButton) submitButton.disabled = true;

    try {
        await apiCall('saveAttendance', { courseId, date, absentStudentIds });
        alert('Frequência salva!');
        appState.attendanceState.history = {}; // Limpa histórico local
        render();
    } catch(e) {
        alert(e.message || 'Erro ao salvar frequência.');
    } finally {
        if(submitButton) submitButton.disabled = false;
    }
}

export function handleAttendanceDateChange(event) {
    appState.attendanceState.selectedDate = event.target.value;
    render();
}