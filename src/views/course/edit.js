import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderEditCourseView(course) {
    const data = await apiCall('getTeachers', {}, 'GET');
    const teachers = data.teachers;
    const isAiEnabled = appState.systemSettings && appState.systemSettings.geminiApiKey;

    return `
        <div class="view-header">
            <h2>Editando Curso: ${course.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">Cancelar</button>
        </div>
        <div class="card full-width">
             <form id="edit-course-form" onsubmit="window.handleUpdateCourse(event)">
                <input type="hidden" name="courseId" value="${course.id}">
                <div class="form-group">
                    <label for="editCourseName">Nome do Curso</label>
                    <input type="text" id="editCourseName" name="courseName" value="${course.name}" required>
                </div>
                <div class="form-group">
                    <div class="form-group-header">
                        <label for="editCourseDescription">Descrição</label>
                        ${isAiEnabled ? `<button type="button" class="action-button secondary generate-ai-button" onclick="window.handleGenerateDescription('edit-course-form')">Gerar com IA ✨</button>` : ''}
                    </div>
                    <textarea id="editCourseDescription" name="courseDescription" rows="4" required>${course.description}</textarea>
                </div>
                 <div class="form-group">
                    <label for="editTeacherId">Professor</label>
                    <select id="editTeacherId" name="teacherId" required>
                        ${teachers.map((t) => `<option value="${t.id}" ${t.id === course.teacherId ? 'selected' : ''}>${t.firstName} ${t.lastName || ''}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="totalSlots">Número de Vagas</label>
                    <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Deixe em branco para ilimitado" value="${course.totalSlots || ''}">
                </div>
                <div class="form-group">
                    <label for="monthlyFee">Valor da Mensalidade (R$)</label>
                    <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" value="${course.monthlyFee || ''}" required>
                </div>
                <div class="form-group">
                    <label>Estrutura de Pagamento</label>
                    <div class="radio-group">
                        <label><input type="radio" name="paymentType" value="recorrente" ${course.paymentType === 'recorrente' ? 'checked' : ''} onchange="document.getElementById('edit-installments-group').style.display='none'"> Recorrente</label>
                        <label><input type="radio" name="paymentType" value="parcelado" ${course.paymentType === 'parcelado' ? 'checked' : ''} onchange="document.getElementById('edit-installments-group').style.display='block'"> Parcelado</label>
                    </div>
                </div>
                <div class="form-group" id="edit-installments-group" style="${course.paymentType === 'parcelado' ? 'display: block;' : 'display: none;'}">
                    <label for="edit-installments">Número de Parcelas</label>
                    <input type="number" id="edit-installments" name="installments" min="1" value="${course.installments || ''}">
                </div>
                 <div class="form-grid">
                    <div class="form-group">
                        <label for="dayOfWeek">Dia da Semana</label>
                        <select id="dayOfWeek" name="dayOfWeek">
                            <option value="" ${!course.dayOfWeek ? 'selected' : ''}>Nenhum</option>
                            <option value="Domingo" ${course.dayOfWeek === 'Domingo' ? 'selected' : ''}>Domingo</option>
                            <option value="Segunda-feira" ${course.dayOfWeek === 'Segunda-feira' ? 'selected' : ''}>Segunda-feira</option>
                            <option value="Terça-feira" ${course.dayOfWeek === 'Terça-feira' ? 'selected' : ''}>Terça-feira</option>
                            <option value="Quarta-feira" ${course.dayOfWeek === 'Quarta-feira' ? 'selected' : ''}>Quarta-feira</option>
                            <option value="Quinta-feira" ${course.dayOfWeek === 'Quinta-feira' ? 'selected' : ''}>Quinta-feira</option>
                            <option value="Sexta-feira" ${course.dayOfWeek === 'Sexta-feira' ? 'selected' : ''}>Sexta-feira</option>
                            <option value="Sábado" ${course.dayOfWeek === 'Sábado' ? 'selected' : ''}>Sábado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Horário de Início</label>
                        <input type="time" id="startTime" name="startTime" value="${course.startTime || ''}">
                    </div>
                    <div class="form-group">
                        <label for="endTime">Horário de Fim</label>
                        <input type="time" id="endTime" name="endTime" value="${course.endTime || ''}">
                    </div>
                </div>
                <button type="submit" class="action-button">Salvar Alterações</button>
            </form>
        </div>
    `;
}