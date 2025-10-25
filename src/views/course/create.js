// src/views/course/create.js
import { appState } from '../../state.js';

export function renderCreateCourseView() {
    const teachers = appState.users.filter(u => u.role === 'teacher');
    const isAiEnabled = appState.systemSettings && appState.systemSettings.geminiApiKey;

    return `
        <div class="view-header">
            <h2>Criar Novo Curso</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar ao Painel</button>
        </div>
        <div class="card full-width">
            <form id="create-course-form" onsubmit="window.AppHandlers.handleCreateCourse(event)">
                <div class="form-group"> <label for="courseName">Nome do Curso</label> <input type="text" id="courseName" name="courseName" required> </div>
                <div class="form-group"> <div class="form-group-header"> <label for="courseDescription">Descrição</label> ${isAiEnabled ? `<button type="button" class="action-button secondary generate-ai-button" onclick="window.AppHandlers.handleGenerateDescription('create-course-form')">Gerar com IA ✨</button>` : ''} </div> <textarea id="courseDescription" name="courseDescription" rows="3" required></textarea> </div>
                <div class="form-group"> <label for="teacherId">Professor</label> <select id="teacherId" name="teacherId" required> <option value="">Selecione...</option> ${teachers.map(t => `<option value="${t.id}">${t.firstName} ${t.lastName || ''}</option>`).join('')} </select> </div>
                <div class="form-group"> <label for="totalSlots">Número de Vagas</label> <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Branco = ilimitado"> </div>
                <div class="form-group"> <label for="monthlyFee">Valor da Mensalidade (R$)</label> <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" placeholder="Ex: 150.00" required> </div>
                <div class="form-group"> <label>Estrutura de Pagamento</label> <div class="radio-group"> <label><input type="radio" name="paymentType" value="recorrente" checked onchange="document.getElementById('installments-group').style.display='none'"> Recorrente</label> <label><input type="radio" name="paymentType" value="parcelado" onchange="document.getElementById('installments-group').style.display='block'"> Parcelado</label> </div> </div>
                <div class="form-group" id="installments-group" style="display: none;"> <label for="installments">Número de Parcelas</label> <input type="number" id="installments" name="installments" min="1" placeholder="Ex: 12"> </div>

                
                <div class="form-group">
                    <label for="carga_horaria">Carga Horária (p/ certificado)</label>
                    <input type="text" id="carga_horaria" name="carga_horaria" placeholder="Ex: 40 horas">
                </div>
                

                <div class="form-grid">
                     <div class="form-group"> <label for="dayOfWeek">Dia da Semana</label> <select id="dayOfWeek" name="dayOfWeek"> <option value="">Nenhum</option> <option value="Domingo">Domingo</option> <option value="Segunda-feira">Segunda</option> <option value="Terça-feira">Terça</option> <option value="Quarta-feira">Quarta</option> <option value="Quinta-feira">Quinta</option> <option value="Sexta-feira">Sexta</option> <option value="Sábado">Sábado</option> </select> </div>
                    <div class="form-group"> <label for="startTime">Horário Início</label> <input type="time" id="startTime" name="startTime"> </div>
                    <div class="form-group"> <label for="endTime">Horário Fim</label> <input type="time" id="endTime" name="endTime"> </div>
                </div>
                <p class="error-message" id="create-course-error"></p>
                <button type="submit" class="action-button">Criar Curso</button>
            </form>
        </div>
    `;
}