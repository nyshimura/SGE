import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderCourseDetailsView(course) {
    const data = await apiCall('getCourseDetails', { courseId: course.id }, 'GET');
    const { teacher, students, admin } = data;
    
    const enrolledCount = students.filter(s => s.status === 'Aprovada').length;
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

    const currentUser = appState.currentUser;
    const canManage = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
    const isStudent = currentUser && currentUser.role === 'student';

    // Seção para o aluno ver a sua própria matrícula
    let studentEnrollmentInfo = '';
    if (isStudent) {
        const myEnrollment = appState.enrollments.find(e => e.studentId === currentUser.id && e.courseId === course.id);
        if (myEnrollment) {
            let actionButtons = '';
            if (myEnrollment.status === 'Aprovada') {
                actionButtons = `
                    <button class="action-button secondary" onclick="window.handleGenerateContractPdf(${currentUser.id}, ${course.id})">Ver Contrato</button>
                    <button class="action-button danger" onclick="window.handleCancelEnrollment(${currentUser.id}, ${course.id})">Trancar Matrícula</button>
                `;
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
                                <span class="status-badge status-${myEnrollment.status.toLowerCase()}">${myEnrollment.status}</span>
                                ${actionButtons}
                            </div>
                        </li>
                    </ul>
                </div>
            `;
        }
    }
    
    // Seção para o admin ver a lista de alunos
    let studentsListHtml = '';
    if (canManage) {
        studentsListHtml = `
            <div class="card full-width">
                <h3 class="card-title">Alunos com Matrícula (${students.length})</h3>
                ${students.length > 0 ? `
                    <ul class="list">
                        ${students.map((student) => {
                            let actionButtons = '';
                            if (student.status === 'Aprovada') {
                                actionButtons = `
                                    <button class="action-button secondary" onclick="window.handleGenerateContractPdf(${student.id}, ${course.id})">Gerar Contrato</button>
                                    <button class="action-button secondary" onclick="window.handleGenerateImageTermsPdf(${student.id}, ${course.id})">Gerar Termo</button>
                                    <button class="action-button danger" onclick="window.handleCancelEnrollment(${student.id}, ${course.id})">Trancar</button>`;
                            } else if (student.status === 'Cancelada') {
                                actionButtons = `<button class="action-button" onclick="window.handleReactivateEnrollment(${student.id}, ${course.id})">Reativar</button>`;
                            }

                            return `
                            <li class="list-item">
                                <div class="list-item-content">
                                    <span class="list-item-title">${student.firstName} ${student.lastName || ''}</span>
                                    <span class="list-item-subtitle">${student.email}</span>
                                </div>
                                <div class="list-item-actions">
                                    <span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span>
                                    ${actionButtons}
                                </div>
                            </li>
                        `}).join('')}
                    </ul>
                ` : '<p>Nenhum aluno com matrícula aprovada ou cancelada neste curso.</p>'}
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
                ${course.description.replace(/\n/g, '<br>')}
            </div>
        </div>
        ${studentEnrollmentInfo}
        ${studentsListHtml}
    `;
}