import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderCourseDetailsView(course) {
    // A API agora retorna o status da matrícula de cada aluno
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

    const canManage = appState.currentUser && (appState.currentUser.role === 'admin' || appState.currentUser.role === 'superadmin');

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
        <div class="card full-width">
            <h3 class="card-title">Alunos com Matrícula (${students.length})</h3>
            ${students.length > 0 ? `
                <ul class="list">
                    ${students.map((student) => {
                        let actionButton = '';
                        if (canManage) {
                            if (student.status === 'Aprovada') {
                                actionButton = `<button class="action-button danger" onclick="window.handleCancelEnrollment(${student.id}, ${course.id})">Trancar Matrícula</button>`;
                            } else if (student.status === 'Cancelada') {
                                actionButton = `<button class="action-button" onclick="window.handleReactivateEnrollment(${student.id}, ${course.id})">Reativar</button>`;
                            }
                        }

                        return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${student.firstName} ${student.lastName || ''}</span>
                                <span class="list-item-subtitle">${student.email}</span>
                            </div>
                            <div class="list-item-actions">
                                <span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span>
                                ${actionButton}
                            </div>
                        </li>
                    `}).join('')}
                </ul>
            ` : '<p>Nenhum aluno com matrícula aprovada ou cancelada neste curso.</p>'}
        </div>
    `;
}