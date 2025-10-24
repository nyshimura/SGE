// src/views/course/details.js
import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderCourseDetailsView(course) {
    const data = await apiCall('getCourseDetails', { courseId: course.id }, 'GET');
    const { teacher, students, admin } = data;
    const allEnrollments = appState.enrollments || [];

    const enrolledCount = students.filter(s => s.status === 'Aprovada').length;
    const vacancies = course.totalSlots === null ? 'Ilimitadas' : Math.max(0, course.totalSlots - enrolledCount);
    let paymentInfo = course.paymentType === 'parcelado' ? `${course.installments || '?'} parcelas` : 'Recorrente';

    let auditInfo = '';
    if (course.status === 'Encerrado' && course.closed_by_admin_id && admin) {
        const date = course.closed_date ? new Date(course.closed_date).toLocaleString('pt-BR') : 'Data indisponível';
        auditInfo = `<div class="audit-info"><strong>Encerrado por:</strong> ${admin?.firstName || 'Admin desconhecido'} em ${date}</div>`;
    }

    const currentUser = appState.currentUser;
    const canManage = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
    const isStudent = currentUser && currentUser.role === 'student';

    let studentEnrollmentInfo = '';
    if (isStudent) {
        const myEnrollmentDetails = students.find(s => s.id === currentUser.id);
        const myFullEnrollment = allEnrollments.find(e => e.studentId === currentUser.id && e.courseId === course.id);

        if (myEnrollmentDetails) {
            let actionButtons = '';
            if (myEnrollmentDetails.status === 'Aprovada') {
                actionButtons = `
                    <button class="action-button secondary" onclick="window.AppHandlers.handleGenerateContractPdf(${currentUser.id}, ${course.id})">Ver Contrato</button>
                    ${myFullEnrollment?.termsAcceptedAt ?
                        `<button class="action-button secondary" onclick="window.AppHandlers.handleGenerateImageTermsPdf(${currentUser.id}, ${course.id})">Ver Termo</button>`
                        : ''
                    }
                    <button class="action-button danger" onclick="window.AppHandlers.handleCancelEnrollment(${currentUser.id}, ${course.id})">Trancar Matrícula</button>
                `;
            } else if (myEnrollmentDetails.status === 'Cancelada') {
                 actionButtons = `<button class="action-button" onclick="window.AppHandlers.handleInitiateEnrollment(${course.id})">Reinscrever-se</button>`;
            } else if (myEnrollmentDetails.status === 'Pendente') {
                 actionButtons = `<span>Aguardando Aprovação</span>`;
            }

             studentEnrollmentInfo = `
                <div class="card full-width">
                    <h3 class="card-title">Minha Matrícula neste Curso</h3>
                    <ul class="list">
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">Status:</span>
                            </div>
                            <div class="list-item-actions">
                                <span class="status-badge status-${myEnrollmentDetails.status.toLowerCase()}">${myEnrollmentDetails.status}</span>
                                ${actionButtons}
                            </div>
                        </li>
                    </ul>
                </div>
            `;
        } else {
             studentEnrollmentInfo = `
                <div class="card full-width">
                    <h3 class="card-title">Minha Matrícula neste Curso</h3>
                    <p>Você não está matriculado neste curso.</p>
                     ${course.status === 'Aberto' ?
                        `<div class="list-item-actions" style="justify-content: flex-start;">
                             <button class="action-button" onclick="window.AppHandlers.handleInitiateEnrollment(${course.id})">Inscreva-se Agora</button>
                         </div>`
                         : ''
                     }
                </div>
             `;
        }
    }

    let studentsListHtml = '';
    if (canManage) {
        studentsListHtml = `
            <div class="card full-width">
                <h3 class="card-title">Alunos com Matrícula (${students.length})</h3>
                ${students.length > 0 ? `
                    <ul class="list">
                        ${students.map((student) => {
                            const studentFullEnrollment = allEnrollments.find(e => e.studentId === student.id && e.courseId === course.id);
                            let actionButtons = '';
                            if (student.status === 'Aprovada') {
                                actionButtons = `
                                    <button class="action-button secondary" onclick="window.AppHandlers.handleGenerateContractPdf(${student.id}, ${course.id})">Gerar Contrato</button>
                                    ${studentFullEnrollment?.termsAcceptedAt ?
                                        `<button class="action-button secondary" onclick="window.AppHandlers.handleGenerateImageTermsPdf(${student.id}, ${course.id})">Gerar Termo</button>`
                                        : ''
                                    }
                                    <button class="action-button danger" onclick="window.AppHandlers.handleCancelEnrollment(${student.id}, ${course.id})">Trancar</button>`;
                            } else if (student.status === 'Cancelada') {
                                actionButtons = `<button class="action-button" onclick="window.AppHandlers.handleReactivateEnrollment(${student.id}, ${course.id})">Reativar</button>`;
                            } else if (student.status === 'Pendente') {
                                 // Placeholder para aprovar direto daqui (complexo, geralmente feito em outra tela)
                                 // actionButtons = `<button class="action-button" onclick="window.AppHandlers.approveFromDetails(${student.id}, ${course.id})">Aprovar?</button>`;
                            }

                            return `
                            <li class="list-item">
                                <div class="list-item-content">
                                    <span class="list-item-title">${student.firstName} ${student.lastName || ''}</span>
                                    <span class="list-item-subtitle">${student.email}</span>
                                </div>
                                <div class="list-item-actions">
                                    <span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span>
                                    <button class="action-button secondary" onclick="window.AppHandlers.handleNavigateToProfile(${student.id})">Ver Perfil</button>
                                    ${actionButtons}
                                </div>
                            </li>
                        `}).join('')}
                    </ul>
                ` : '<p>Nenhum aluno com matrícula neste curso ainda.</p>'}
            </div>
        `;
    }

    return `
        <div class="view-header">
            <h2>Detalhes do Curso: ${course.name}</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <div class="course-details-grid">
                <div><strong>Professor:</strong></div>
                <div>${teacher?.firstName || ''} ${teacher?.lastName || ''}</div>

                <div><strong>Status:</strong></div>
                <div><span class="status-badge status-${course.status.toLowerCase()}">${course.status}</span></div>

                <div><strong>Vagas Ocupadas:</strong></div>
                <div>${enrolledCount} / ${course.totalSlots === null ? '∞' : course.totalSlots} (Vagas Restantes: ${vacancies})</div>

                <div><strong>Mensalidade:</strong></div>
                <div>${course.monthlyFee ? `R$ ${Number(course.monthlyFee).toFixed(2).replace('.', ',')} (${paymentInfo})` : 'Não definido'}</div>

                <div><strong>Agenda:</strong></div>
                <div>${course.dayOfWeek && course.startTime && course.endTime ? `${course.dayOfWeek}, das ${course.startTime} às ${course.endTime}` : 'Não definida'}</div>
            </div>
            ${auditInfo}
            <div class="course-description">
                <strong>Descrição:</strong><br>
                ${course.description ? course.description.replace(/\n/g, '<br>') : 'Nenhuma descrição fornecida.'}
            </div>
        </div>
        ${studentEnrollmentInfo}
        ${studentsListHtml}
    `;
}