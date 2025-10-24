// src/views/dashboard/student.js
import { appState } from '../../state.js';
import { renderStudentFinancialHistory } from '../financial/history.js';

export function renderStudentView(studentId, data) {
  const student = appState.currentUser;
  if (!student) return '';

  const myEnrollments = data.enrollments || [];
  const myAttendance = data.attendance || [];
  const allCourses = data.courses || [];
  const teachers = data.teachers || [];

  // --- INÍCIO DA MODIFICAÇÃO ---

  // 1. Identificar IDs dos cursos onde a matrícula é APROVADA.
  const approvedCourseIds = myEnrollments
    .filter(e => e.status === 'Aprovada')
    .map(e => e.courseId);

  // 2. Filtrar a lista de Cursos Disponíveis:
  const availableCoursesToDisplay = allCourses.filter(course =>
    // a) O curso deve estar Aberto
    course.status === 'Aberto' &&
    // b) O aluno NÃO pode ter uma matrícula APROVADA neste curso
    !approvedCourseIds.includes(course.id)
  );

  // --- FIM DA MODIFICAÇÃO ---

  // *** ALTERAÇÃO AQUI ***
  // 1. Filtramos a lista de matrículas ANTES de renderizar.
  // Queremos apenas as que estão 'Aprovada' ou 'Pendente'.
  const activeEnrollments = myEnrollments.filter(
    (e) => e.status === 'Aprovada' || e.status === 'Pendente'
  );

  const cards = [
    {
      id: 'student-courses',
      html: `
        <div class="card" id="student-courses" draggable="true" ondragstart="window.AppHandlers.handleDragStart(event)" ondragend="window.AppHandlers.handleDragEnd(event)">
            <h3 class="card-title">📚 Meus Cursos e Matrículas</h3>
            <div class="list-wrapper">
                <ul class="list">
                    ${activeEnrollments.length === 0 ? '<li>Nenhuma matrícula ativa encontrada.</li>' : activeEnrollments.map((enrollment) => {
                        // 2. Agora o .map() usa a lista filtrada "activeEnrollments"
                        const course = allCourses.find((c) => c.id === enrollment.courseId);
                        if (!course) return '<li>Curso não encontrado (ID: ' + enrollment.courseId + ')</li>';

                        const teacher = teachers.find((t) => t.id === course.teacherId);

                        // 3. Os botões de ação foram simplificados.
                        // Deixamos APENAS o botão "Detalhes".
                        let actionButtons = `<button class="action-button secondary" onclick="window.AppHandlers.handleNavigateToCourseDetails(${course.id})">Detalhes</button>`;

                        // 4. REMOVEMOS os blocos 'if (enrollment.status === 'Aprovada')' 
                        // e 'else if (enrollment.status === 'Cancelada')' que adicionavam outros botões.

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
                    }).join('')}
                </ul>
            </div>
        </div>
      `
    },
      {
      id: 'student-available-courses',
      html: `
        <div class="card" id="student-available-courses" draggable="true" ondragstart="window.AppHandlers.handleDragStart(event)" ondragend="window.AppHandlers.handleDragEnd(event)">
            <h3 class="card-title">🏫 Cursos Disponíveis para Inscrição</h3>
             <div class="list-wrapper">
                <ul class="list">
                    ${availableCoursesToDisplay.map((course) => { // <-- USANDO A LISTA JÁ FILTRADA
                        // Verifica se existe matrícula ATIVA (Pendente ou Aprovada)
                        const hasActiveEnrollment = myEnrollments.some((e) => e.courseId === course.id && (e.status === 'Aprovada' || e.status === 'Pendente'));
                        // Verifica se existe matrícula CANCELADA
                        const wasCancelled = myEnrollments.some((e) => e.courseId === course.id && e.status === 'Cancelada');

                        const teacher = teachers.find((t) => t.id === course.teacherId);
                        let actionHtml = '';

                        // A lógica abaixo agora só precisa checar Pendente ou Cancelada, já que Aprovada foi filtrado antes.
                        if (hasActiveEnrollment) {
                             const currentStatus = myEnrollments.find(e => e.courseId === course.id)?.status;
                             actionHtml = `<span class="status-badge status-${currentStatus.toLowerCase()}">Matriculado</span>`;
                        } else if (wasCancelled) {
                            actionHtml = `<button class="action-button" data-course-id="${course.id}" onclick="window.AppHandlers.handleInitiateEnrollment(${course.id})">Reinscrever-se</button>`;
                        } else {
                            actionHtml = `<button class="action-button" data-course-id="${course.id}" onclick="window.AppHandlers.handleInitiateEnrollment(${course.id})">Inscreva-se Agora</button>`;
                        }

                        return `
                            <li class="list-item">
                                <div class="list-item-content">
                                    <span class="list-item-title">${course.name}</span>
                                    <span class="list-item-subtitle">Professor: ${teacher?.firstName || ''} ${teacher?.lastName || ''}</span>
                                </div>
                                <div class="list-item-actions">
                                    <button class="action-button secondary" onclick="window.AppHandlers.handleNavigateToCourseDetails(${course.id})">Detalhes</button>
                                    ${actionHtml}
                                </div>
                            </li>
                        `;
                    }).join('') || '<li>🎉 Parabéns! Você já está matriculado(a) em todos os cursos abertos. 🎉</li>'}
                </ul>
            </div>
        </div>
      `
    },
    {
      id: 'student-attendance',
      html: `
        <div class="card" id="student-attendance" draggable="true" ondragstart="window.AppHandlers.handleDragStart(event)" ondragend="window.AppHandlers.handleDragEnd(event)">
            <h3 class="card-title">📊 Meu Relatório de Frequência</h3>
             ${myAttendance.length === 0 ? '<p>Nenhum registro de frequência ainda.</p>' : `
                <div class="table-wrapper">
                <table>
                    <thead><tr><th>Curso</th><th>Data</th><th>Status</th></tr></thead>
                    <tbody>
                        ${myAttendance.sort((a, b) => b.date.localeCompare(a.date)).map((record) => {
                            const course = allCourses.find((c) => c.id === record.courseId);
                            const dateObj = new Date(record.date + 'T00:00:00Z'); // Usa UTC para evitar problemas de fuso
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
        <div class="card full-width" id="student-finance" draggable="true" ondragstart="window.AppHandlers.handleDragStart(event)" ondragend="window.AppHandlers.handleDragEnd(event)">
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
    <div class="dashboard-grid" ondragover="window.AppHandlers.handleDragOver(event)" ondrop="window.AppHandlers.handleDrop(event)">
        ${cards.map(c => c.html).join('')}
    </div>
  `;
}