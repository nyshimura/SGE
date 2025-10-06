import { appState } from '../../state.js';
import { renderStudentFinancialHistory } from '../financial/history.js';

export function renderStudentView(studentId, data) {
  const student = appState.currentUser;
  if (!student) return '';

  const myEnrollments = data.enrollments || [];
  const myAttendance = data.attendance || [];
  const allCourses = data.courses || []; 

  const cards = [
    {
      id: 'student-courses',
      html: `
        <div class="card" id="student-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📚 Meus Cursos e Matrículas</h3>
            <ul class="list">
                ${myEnrollments.map((enrollment) => {
                    const course = allCourses.find((c) => c.id === enrollment.courseId);
                    if (!course) return ''; 
                    
                    const teacher = data.teachers.find((t) => t.id === course.teacherId);
                    
                    let actionButton = '';
                    if (enrollment.status === 'Aprovada') {
                        actionButton = `<button class="action-button danger" onclick="window.handleCancelEnrollment(${student.id}, ${course.id})">Trancar Matrícula</button>`;
                    }

                    return `
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${course.name}</span>
                                <span class="list-item-subtitle">Professor: ${teacher?.firstName} ${teacher?.lastName || ''}</span>
                            </div>
                            <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                                <span class="status-badge status-${enrollment.status.toLowerCase()}">${enrollment.status}</span>
                                ${actionButton}
                            </div>
                        </li>
                    `;
                }).join('') || '<li>Nenhuma matrícula encontrada.</li>'}
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
                ${allCourses.filter(c => c.status === 'Aberto').map((course) => {
                    // CORREÇÃO: Impede a exibição se o aluno já tiver uma matrícula ativa ou pendente
                    const isEnrolled = myEnrollments.some((e) => e.courseId === course.id && (e.status === 'Aprovada' || e.status === 'Pendente'));
                    if (isEnrolled) {
                        return '';
                    }

                    const teacher = data.teachers.find((t) => t.id === course.teacherId);
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
                        ${myAttendance.map((record) => {
                            const course = allCourses.find((c) => c.id === record.courseId);
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
            ${renderStudentFinancialHistory(studentId, data.payments)}
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