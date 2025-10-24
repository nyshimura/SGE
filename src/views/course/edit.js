// src/views/course/edit.js
import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderEditCourseView(course) {
    if (!appState.users.some(u => u.role === 'teacher')) {
        try { const data = await apiCall('getTeachers', {}, 'GET'); const teacherIds = new Set(appState.users.filter(u => u.role === 'teacher').map(t => t.id)); (data.teachers || []).forEach(t => { if (!teacherIds.has(t.id)) appState.users.push(t); }); } catch(e) { console.error("Erro buscar professores:", e); }
    }
    const teachers = appState.users.filter(u => u.role === 'teacher');
    const isAiEnabled = appState.systemSettings && appState.systemSettings.geminiApiKey;
    const today = new Date().toISOString().split('T')[0]; // Para default da data

    return `
        <div class="view-header">
            <h2>Editando Curso: ${course.name}</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">Cancelar</button>
        </div>
        <div class="card full-width">
             <form id="edit-course-form" onsubmit="window.AppHandlers.handleUpdateCourse(event)">
                <input type="hidden" name="courseId" value="${course.id}">
                 <div class="form-group"> <label for="editCourseName">Nome</label> <input type="text" id="editCourseName" name="courseName" value="${course.name}" required> </div>
                 <div class="form-group"> <div class="form-group-header"> <label for="editCourseDescription">Descrição</label> ${isAiEnabled ? `<button type="button" class="action-button secondary generate-ai-button" onclick="window.AppHandlers.handleGenerateDescription('edit-course-form')">IA ✨</button>` : ''} </div> <textarea id="editCourseDescription" name="courseDescription" rows="4" required>${course.description || ''}</textarea> </div>
                 <div class="form-group"> <label for="editTeacherId">Professor</label> <select id="editTeacherId" name="teacherId" required> ${teachers.map((t) => `<option value="${t.id}" ${t.id === course.teacherId ? 'selected' : ''}>${t.firstName} ${t.lastName || ''}</option>`).join('')} </select> </div>
                 <div class="form-group"> <label for="totalSlots">Vagas</label> <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Branco = ilimitado" value="${course.totalSlots || ''}"> </div>
                 <div class="form-group"> <label for="monthlyFee">Mensalidade (R$)</label> <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" value="${course.monthlyFee || ''}" required> </div>
                 <div class="form-group"> <label>Pagamento</label> <div class="radio-group"> <label><input type="radio" name="paymentType" value="recorrente" ${course.paymentType === 'recorrente' ? 'checked' : ''} onchange="document.getElementById('edit-installments-group').style.display='none'"> Recorrente</label> <label><input type="radio" name="paymentType" value="parcelado" ${course.paymentType === 'parcelado' ? 'checked' : ''} onchange="document.getElementById('edit-installments-group').style.display='block'"> Parcelado</label> </div> </div>
                 <div class="form-group" id="edit-installments-group" style="${course.paymentType === 'parcelado' ? 'display: block;' : 'display: none;'}"> <label for="edit-installments">Nº Parcelas</label> <input type="number" id="edit-installments" name="installments" min="1" value="${course.installments || ''}"> </div>

                {/* --- CAMPO CARGA HORÁRIA --- */}
                <div class="form-group">
                    <label for="carga_horaria">Carga Horária (p/ certificado)</label>
                    <input type="text" id="carga_horaria" name="carga_horaria" value="${course.carga_horaria || ''}" placeholder="Ex: 40 horas">
                </div>
                {/* ------------------------- */}

                 <div class="form-grid">
                    <div class="form-group"> <label for="dayOfWeek">Dia</label> <select id="dayOfWeek" name="dayOfWeek"> <option value="" ${!course.dayOfWeek ? 'selected' : ''}>Nenhum</option> <option value="Domingo" ${course.dayOfWeek === 'Domingo' ? 'selected' : ''}>Dom</option> <option value="Segunda-feira" ${course.dayOfWeek === 'Segunda-feira' ? 'selected' : ''}>Seg</option> <option value="Terça-feira" ${course.dayOfWeek === 'Terça-feira' ? 'selected' : ''}>Ter</option> <option value="Quarta-feira" ${course.dayOfWeek === 'Quarta-feira' ? 'selected' : ''}>Qua</option> <option value="Quinta-feira" ${course.dayOfWeek === 'Quinta-feira' ? 'selected' : ''}>Qui</option> <option value="Sexta-feira" ${course.dayOfWeek === 'Sexta-feira' ? 'selected' : ''}>Sex</option> <option value="Sábado" ${course.dayOfWeek === 'Sábado' ? 'selected' : ''}>Sáb</option> </select> </div>
                    <div class="form-group"> <label for="startTime">Início</label> <input type="time" id="startTime" name="startTime" value="${course.startTime || ''}"> </div>
                    <div class="form-group"> <label for="endTime">Fim</label> <input type="time" id="endTime" name="endTime" value="${course.endTime || ''}"> </div>
                 </div>
                 <p class="error-message" id="edit-course-error"></p>
                <button type="submit" class="action-button">Salvar Alterações</button>
            </form>
        </div>

        {/* --- SEÇÃO GERAÇÃO EM MASSA --- */}
        <div class="card full-width">
            <h3 class="card-title">Certificados (Geração em Massa)</h3>
            <p style="font-size: 0.9rem; color: #aaa; margin-top: -1rem;">Gera um .zip com certificados para <strong>todos</strong> os alunos aprovados neste curso.</p>
            
            {/* Usamos um form aqui para agrupar os inputs, mas o submit chama JS */}
            <form onsubmit="window.AppHandlers.handleGenerateBulkCertificates(event, ${course.id})">
                 <div class="profile-grid"> {/* Reutiliza grid */}
                    <div class="form-group">
                        <label for="bulkCompletionDate">Data de Conclusão (para todos)</label>
                        <input type="date" id="bulkCompletionDate" name="completionDate" value="${today}" required>
                    </div>
                    <div class="form-group">
                        <label for="bulkOverrideCarga">Carga Horária (Opcional)</label>
                        <input type="text" id="bulkOverrideCarga" name="overrideCargaHoraria" placeholder="Padrão: ${course.carga_horaria || 'N/A'}">
                    </div>
                </div>
                <button type="submit" class="action-button">
                    Gerar e Baixar ZIP de Certificados
                </button>
            </form>
        </div>
    `;
}