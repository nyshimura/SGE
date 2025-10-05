import { apiCall } from '../../api.js';

export async function renderCourseDetailsView(course) {
    const data = await apiCall('getCourseDetails', { courseId: course.id }, 'GET');
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
