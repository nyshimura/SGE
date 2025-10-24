// src/views/course/attendance.js
import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderAttendanceManagementView(courseId) {
    const data = await apiCall('getAttendanceData', { courseId, date: appState.attendanceState.selectedDate }, 'GET');
    const course = data.course;
    if (!course) return '';

    const { selectedDate } = appState.attendanceState;
    const today = new Date().toISOString().split('T')[0];

    const selectedDateObj = new Date(selectedDate + 'T12:00:00Z'); // Adiciona hora para evitar problemas de fuso no getUTCDay
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const selectedDayOfWeek = weekDays[selectedDateObj.getUTCDay()];
    const isCorrectDayOfWeek = !course.dayOfWeek || course.dayOfWeek === selectedDayOfWeek; // Permite salvar se dia não definido

    const existingRecordsForDate = data.recordsForDate;
    const isEditing = existingRecordsForDate.length > 0;

    const attendanceHistory = data.history;

    return `
        <div class="view-header">
            <h2>Controle de Frequência: ${course.name}</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="attendance-controls">
                    <label for="attendance-date">Data da Chamada:</label>
                    <input type="date" id="attendance-date" value="${selectedDate}" max="${today}" onchange="window.AppHandlers.handleAttendanceDateChange(event)">
                </div>

                ${isEditing ? `<div class="notice">Você está editando a frequência de uma data já registrada.</div>` : ''}
                ${!isCorrectDayOfWeek && course.dayOfWeek ? `<div class="notice" style="background-color: var(--status-absent-bg); color: var(--status-absent-text); border-left-color: var(--status-absent-text);">Atenção: Este curso ocorre às ${course.dayOfWeek}s. A data selecionada é uma ${selectedDayOfWeek}.</div>` : ''}

                 ${data.students.length === 0 ? '<p>Nenhum aluno matriculado nesta turma ainda.</p>' : `
                    <form onsubmit="window.AppHandlers.handleSaveAttendance(event)" data-course-id="${course.id}">
                        <input type="hidden" name="attendanceDate" value="${selectedDate}">
                        <div class="table-wrapper">
                            <table>
                                <thead><tr><th>Aluno</th><th>Faltou?</th></tr></thead>
                                <tbody>
                                ${data.students.map((student) => {
                                    const existingRecord = existingRecordsForDate.find((r) => r.studentId === student.id);
                                    const isAbsent = existingRecord ? existingRecord.status === 'Falta' : false;
                                    return `
                                        <tr>
                                            <td>${student.firstName} ${student.lastName || ''}</td>
                                            <td>
                                                <div class="attendance-checkbox">
                                                 <input type="checkbox" id="student-${student.id}" name="absent" value="${student.id}" ${isAbsent ? 'checked' : ''}>
                                                </div>
                                            </td>
                                        </tr>
                                    `
                                }).join('')}
                                </tbody>
                            </table>
                        </div>
                        <p class="error-message" id="attendance-error" style="margin-top: 1rem;"></p>
                        <button type="submit" class="action-button" style="margin-top: 1rem;">${isEditing ? 'Atualizar Frequência' : 'Salvar Frequência'}</button>
                    </form>
                    `}
            </div>
             <div class="card">
                <h3 class="card-title">Histórico de Frequência</h3>
                ${Object.keys(attendanceHistory).length === 0 ? '<p>Nenhum histórico de frequência.</p>' : `
                 <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Data</th><th>Presentes</th><th>Faltas</th></tr></thead>
                        <tbody>
                            ${Object.entries(attendanceHistory).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)).map(([date, summary]) => {
                                const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Adiciona T00:00:00 e UTC
                                return `
                                    <tr>
                                        <td>${formattedDate}</td>
                                        <td>${summary.presentes}</td>
                                        <td>${summary.faltas}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                 </div>
                `}
            </div>
        </div>
    `;
}