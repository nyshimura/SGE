import { appState } from '../../state.js';
import { renderStudentFinancialHistory } from '../financial/history.js';

export function renderStudentView(studentId, data) {
  const student = appState.currentUser;
  if (!student) return '';

  const myEnrollments = data.enrollments || [];
  const myAttendance = data.attendance || [];
  const allCourses = data.courses || [];
  const teachers = data.teachers || [];

  const cards = [
    {
      id: 'student-courses',
      html: `
        <div class="card" id="student-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📚 Meus Cursos e Matrículas</h3>
            <div class="list-wrapper">
                <ul class="list">
                    ${myEnrollments.map((enrollment) => {
                        const course = allCourses.find((c) => c.id === enrollment.courseId);
                        if (!course) return '';

                        const teacher = teachers.find((t) => t.id === course.teacherId);

                        // Define os botões de ação com base no status da matrícula
                        let actionButtons = `<button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>`;

                        if (enrollment.status === 'Aprovada') {
                            // --- ADICIONA BOTÕES PARA VER DOCUMENTOS ---
                            actionButtons += `
                                <button class="action-button secondary" onclick="window.handleGenerateContractPdf(${student.id}, ${course.id})">Ver Contrato</button>
                                ${enrollment.termsAcceptedAt ? // Mostra botão do termo só se foi aceite
                                    `<button class="action-button secondary" onclick="window.handleGenerateImageTermsPdf(${student.id}, ${course.id})">Ver Termo</button>`
                                    : ''
                                }
                            `;
                            // O botão de trancar foi movido para a tela de detalhes do curso
                            // actionButtons += `<button class="action-button danger" onclick="window.handleCancelEnrollment(${student.id}, ${course.id})">Trancar Matrícula</button>`;
                        }

                        return `
                            <li class="list-item">
                                <div class="list-item-content">
                                    <span class="list-item-title">${course.name}</span>
                                    <span class="list-item-subtitle">Professor: ${teacher?.firstName || ''} ${teacher?.lastName || ''}</span>
                                </div>
                                <div class="list-item-actions">
                                    <span class="status-badge status-${enrollment.status.toLowerCase()}">${enrollment.status}</span>
                                    ${actionButtons}
                                </div>
                            </li>
                        `;
                    }).join('') || '<li>Nenhuma matrícula encontrada.</li>'}
                </ul>
            </div>
        </div>
      `
    },
     {
      id: 'student-available-courses',
      html: `
        <div class="card" id="student-available-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">🏫 Cursos Disponíveis para Inscrição</h3>
             <div class="list-wrapper">
                <ul class="list">
                    ${allCourses.filter(c => c.status === 'Aberto').map((course) => {
                        const existingEnrollment = myEnrollments.find((e) => e.courseId === course.id);
                        const buttonText = existingEnrollment?.status === 'Cancelada' ? 'Reinscrever-se' : 'Inscreva-se Agora';
                        const showButton = !existingEnrollment || existingEnrollment.status === 'Cancelada';

                        const teacher = teachers.find((t) => t.id === course.teacherId);
                        return `
                            <li class="list-item">
                                <div class="list-item-content">
                                    <span class="list-item-title">${course.name}</span>
                                    <span class="list-item-subtitle">Professor: ${teacher?.firstName || ''} ${teacher?.lastName || ''}</span>
                                </div>
                                <div class="list-item-actions">
                                    <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                                    ${showButton ? `
                                        <button class="action-button" data-course-id="${course.id}" onclick="window.handleInitiateEnrollment(${course.id})">
                                            ${buttonText}
                                        </button>
                                    ` : `<span class="status-badge status-${existingEnrollment.status.toLowerCase()}">Matriculado</span>`}
                                </div>
                            </li>
                        `;
                    }).join('') || '<li>Nenhum novo curso disponível no momento.</li>'}
                </ul>
            </div>
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
                        ${myAttendance.sort((a, b) => b.date.localeCompare(a.date)).map((record) => {
                            const course = allCourses.find((c) => c.id === record.courseId);
                            const dateObj = new Date(record.date + 'T00:00:00Z');
                            const formattedDate = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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
        <p>Veja os cursos disponíveis, o status da sua matrícula e seu histórico.</p>
    </div>
    <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
        ${cards.map(c => c.html).join('')}
    </div>
  `;
}