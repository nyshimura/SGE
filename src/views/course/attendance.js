// src/views/course/attendance.js
import { apiCall } from '../../api.js';
import { appState } from '../../state.js';
// Importa helper (certifique-se que ele existe em helpers.js)
import { getMonthName } from '../../utils/helpers.js';

export async function renderAttendanceManagementView(courseId) {
    const { selectedDate, selectedMonth } = appState.attendanceState;
    const currentMonthForInput = selectedMonth || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Pede dados
    const data = await apiCall('getAttendanceData', {
        courseId,
        date: selectedDate,
        month: currentMonthForInput
    }, 'GET');

    const course = data.course;
    if (!course) return '';

    const today = new Date().toISOString().split('T')[0];

    // Lógica para o formulário
    const selectedDateObj = new Date(selectedDate + 'T12:00:00Z');
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const selectedDayOfWeek = weekDays[selectedDateObj.getUTCDay()];
    const isCorrectDayOfWeek = !course.dayOfWeek || course.dayOfWeek === selectedDayOfWeek;
    const existingRecordsForDate = data.recordsForDate || [];
    const isEditing = existingRecordsForDate.length > 0;

    // Processar histórico mensal
    const monthlyRecords = data.monthlyRecords || [];
    const studentsArray = data.students || [];
    const studentsMap = new Map(studentsArray.map(s => [s.id, `${s.firstName} ${s.lastName || ''}`]));

    // Agrupa registros por semana
    const weeklyGroupedHistory = {};
    monthlyRecords.forEach(record => {
        try {
            const dateObj = new Date(record.date + 'T12:00:00Z');
            if (isNaN(dateObj.getTime())) { console.warn(`Data inválida: ${record.date}`); return; }
            const year = dateObj.getUTCFullYear();
            const month = dateObj.getUTCMonth();
            const day = dateObj.getUTCDate();
            const firstDayOfMonth = new Date(Date.UTC(year, month, 1)); // Use UTC
            const dayOfWeekFirst = firstDayOfMonth.getUTCDay();
            const weekNumber = Math.ceil((day + dayOfWeekFirst) / 7);
            const weekKey = `${year}-W${month + 1}-${weekNumber}`;

            if (!weeklyGroupedHistory[weekKey]) {
                weeklyGroupedHistory[weekKey] = { dates: new Set(), students: {} };
            }
            weeklyGroupedHistory[weekKey].dates.add(record.date);
            if (!weeklyGroupedHistory[weekKey].students[record.studentId]) {
                weeklyGroupedHistory[weekKey].students[record.studentId] = {};
            }
            weeklyGroupedHistory[weekKey].students[record.studentId][record.date] = record.status;
        } catch (e) { console.error(`Erro processando registro ${record.date}:`, e); }
    });

    // Ordena semanas e datas
    const sortedWeeks = Object.entries(weeklyGroupedHistory).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    sortedWeeks.forEach(([key, weekData]) => {
        weekData.sortedDates = Array.from(weekData.dates).sort();
    });

    // Gera o HTML
    return `
        <div class="view-header">
            <h2>Controle de Frequência: ${course.name}</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="dashboard-grid-freq">
            
            <div class="card">
                <h3 class="card-title">Registrar / Editar Chamada</h3>
                <div class="attendance-controls">
                    <label for="attendance-date-save">Data da Chamada:</label>
                    <input type="date" id="attendance-date-save" value="${selectedDate}" max="${today}" onchange="window.AppHandlers.handleAttendanceDateChangeForSave(event)">
                 </div>
                ${isEditing ? `<div class="notice">Editando frequência de ${new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}.</div>` : ''}
                ${!isCorrectDayOfWeek && course.dayOfWeek ? `<div class="notice notice-warning">Atenção: Curso ocorre às ${course.dayOfWeek}s. Data selecionada: ${selectedDayOfWeek}.</div>` : ''}
                 ${studentsArray.length === 0 ? '<p>Nenhum aluno matriculado nesta turma ainda.</p>' : `
                    <form onsubmit="window.AppHandlers.handleSaveAttendance(event)" data-course-id="${course.id}">
                        <input type="hidden" name="attendanceDate" value="${selectedDate}">
                        <div class="table-wrapper thin-scrollbar" style="max-height: 300px;">
                            <table>
                                <thead><tr><th>Aluno</th><th>Faltou?</th></tr></thead>
                                <tbody>
                                ${studentsArray.map(student => {
                                    const existingRecord = existingRecordsForDate.find(r => r.studentId === student.id);
                                    const isAbsent = existingRecord ? existingRecord.status === 'Falta' : false;
                                    // *** CORREÇÃO APLICADA ***
                                    const checkedAttr = isAbsent ? ' checked' : ''; // Adiciona espaço antes, garante que é string vazia se false
                                    // LINHAS CORRIGIDAS (sem escapes \ )
                                    const inputTag = `<input type="checkbox" id="student-${student.id}" name="absent" value="${student.id}"${checkedAttr}>`; // Constrói o input separadamente
                                    return `
                                        <tr>
                                            <td>${student.firstName} ${student.lastName || ''}</td>
                                            <td>
                                                <div class="attendance-checkbox">
                                                    ${inputTag}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                                </tbody>
                            </table>
                        </div>
                        <p class="error-message" id="attendance-error"></p>
                        <button type="submit" class="action-button primary" style="margin-top: 1rem;">${isEditing ? 'Atualizar Frequência' : 'Salvar Frequência'}</button>
                    </form>
                 `}
            </div>

            
             <div class="card">
                <h3 class="card-title">Histórico Mensal</h3>
                <div class="attendance-controls">
                    <label for="attendance-month">Mês:</label>
                    <input type="month" id="attendance-month" value="${currentMonthForInput}" onchange="window.AppHandlers.handleAttendanceMonthChange(event)">
                </div>
                ${sortedWeeks.length === 0 ? `<p style="margin-top: 1rem;">Nenhum histórico registrado para ${getMonthName(currentMonthForInput)}.</p>` : `
                    <div class="monthly-attendance-history thin-scrollbar" style="margin-top: 1rem;">
                        ${sortedWeeks.map(([weekKey, weekData], weekIndex) => `
                            <div class="week-section">
                                <h4>${weekIndex + 1}ª Semana (${new Date(weekData.sortedDates[0] + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} a ${new Date(weekData.sortedDates[weekData.sortedDates.length - 1] + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })})</h4>
                                <div class="table-wrapper thin-scrollbar" style="max-height: 350px;">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style="min-width: 150px;">Aluno</th>
                                                ${weekData.sortedDates.map(date => `
                                                    <th style="min-width: 60px; text-align: center;">
                                                        ${new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}<br>
                                                        <span style="font-size: 0.75rem;">(${new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' })})</span>
                                                    </th>
                                                `).join('')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${studentsArray.map(student => `
                                                <tr>
                                                    <td>${studentsMap.get(student.id)}</td>
                                                    ${weekData.sortedDates.map(date => {
                                                        const status = weekData.students[student.id]?.[date];
                                                        let display = '-';
                                                        let className = 'status-none';
                                                        if (status === 'Presente') {
                                                            display = 'P';
                                                            className = 'status-present';
                                                        } else if (status === 'Falta') {
                                                            display = 'F';
                                                            className = 'status-absent';
                                                        }
                                                        return `<td class="${className}" style="text-align: center;">${display}</td>`;
                                                    }).join('')}
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

// <<< Helper para nome do mês (deve estar em helpers.js e ser importado) >>>
/*
function getMonthName(monthString) { // monthString no formato 'YYYY-MM'
    if (!monthString) return '';
    try {
        const [year, month] = monthString.split('-');
        const date = new Date(year, month - 1, 1);
        if (isNaN(date.getTime())) return 'Mês inválido';
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) {
        console.error("Erro ao formatar nome do mês:", e);
        return 'Erro de mês';
    }
}
*/