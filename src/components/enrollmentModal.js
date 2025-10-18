import { appState } from '../state.js';

export function renderEnrollmentModal(data) {
    const { contractText, termsText, studentData, guardianData, isMinor, courseId, isReenrollment } = data; // Adiciona isReenrollment aqui
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay enrollment-modal'; // Adiciona classe específica
    modalOverlay.onclick = (e) => {
        // Permite fechar clicando fora do conteúdo do modal
        if (e.target === modalOverlay) {
            window.handleCloseEnrollmentModal();
        }
    };

    const guardianSection = isMinor ? `
        <div class="modal-section guardian-section">
            <h4>Dados do Responsável (Obrigatório)</h4>
            <div class="profile-grid">
                <div class="form-group">
                    <label for="guardianName">Nome Completo</label>
                    <input type="text" id="guardianName" name="guardianName" value="${guardianData?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="guardianEmail">E-mail</label>
                    <input type="email" id="guardianEmail" name="guardianEmail" value="${guardianData?.email || ''}" required>
                </div>
                 <div class="form-group">
                    <label for="guardianPhone">Telefone</label>
                    <input type="tel" id="guardianPhone" name="guardianPhone" value="${guardianData?.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label for="guardianRG">RG</label>
                    <input type="text" id="guardianRG" name="guardianRG" value="${guardianData?.rg || ''}" required>
                </div>
                <div class="form-group">
                    <label for="guardianCPF">CPF</label>
                    <input type="text" id="guardianCPF" name="guardianCPF" value="${guardianData?.cpf || ''}" required>
                </div>
            </div>
        </div>
    ` : '';

    modalOverlay.innerHTML = `
        <div class="modal-content large">
            <button class="modal-close" onclick="window.handleCloseEnrollmentModal()">×</button>
            <h2>${isReenrollment ? 'Renovar Matrícula' : 'Confirmar Matrícula'}</h2>
            <form id="enrollment-form" onsubmit="window.handleSubmitEnrollment(event)">
                <input type="hidden" name="courseId" value="${courseId}">
                <input type="hidden" name="studentId" value="${appState.currentUser.id}">
                Atualize seus dados e aceite os termos para realizar a Matrícula
                <input type="hidden" name="isReenrollment" value="${isReenrollment ? 'true' : 'false'}">

                <div class="modal-body-scrollable">
                    <div class="modal-section student-section">
                        <h4>Seus Dados</h4>
                         <p>Por favor, confirme ou preencha seus documentos.</p>
                        <div class="profile-grid">
                            <div class="form-group">
                                <label for="aluno_rg">RG</label>
                                <input type="text" id="aluno_rg" name="aluno_rg" value="${studentData?.rg || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="aluno_cpf">CPF</label>
                                <input type="text" id="aluno_cpf" name="aluno_cpf" value="${studentData?.cpf || ''}" required>
                            </div>
                        </div>
                    </div>

                    ${guardianSection}

                    <div class="modal-section document-section">
                        <h4>Contrato de Prestação de Serviços</h4>
                        <div class="document-viewer">
                            ${contractText || 'Modelo de contrato não disponível.'}
                        </div>
                            <div class="form-group checkbox-group">
                            <input type="checkbox" id="acceptContract" name="acceptContract" required onchange="document.getElementById('submit-enrollment-btn').disabled = !this.checked;">
                            <label for="acceptContract">Li e aceito o Contrato de Prestação de Serviços.</label>
                        </div>
                    </div>

                    <div class="modal-section document-section">
                        <h4>Termo de Autorização de Uso de Imagem</h4>
                        <div class="document-viewer">
                            ${termsText || 'Modelo de termo de imagem não disponível.'}
                        </div>
                            <div class="form-group checkbox-group">
                            <input type="checkbox" id="acceptImageTerms" name="acceptImageTerms">
                            <label for="acceptImageTerms">Autorizo o uso de imagem conforme os termos (opcional).</label>
                        </div>
                    </div>
                </div> 

                <div class="modal-actions">
                    <button type="button" class="action-button secondary" onclick="window.handleCloseEnrollmentModal()">Cancelar</button>
                    
                    <button type="submit" id="submit-enrollment-btn" class="action-button" disabled>${isReenrollment ? 'Confirmar Rematrícula' : 'Confirmar Matrícula'}</button>
                </div>
            </form>
        </div>
        <style>
            .enrollment-modal .modal-content.large {
                max-width: 800px;
                max-height: 90vh; /* Altura máxima da janela */
                display: flex;
                flex-direction: column;
                overflow: hidden; /* Esconde overflow do container principal */
            }
            .enrollment-modal form {
                flex-grow: 1; /* Faz o form ocupar espaço */
                display: flex;
                flex-direction: column;
                min-height: 0; /* Necessário para flexbox em container com overflow */
            }
             /* NOVO: Wrapper para permitir scroll do conteúdo interno, excluindo botões */
            .modal-body-scrollable {
                overflow-y: auto; /* Adiciona scroll vertical AQUI */
                padding-right: 15px; /* Espaço para a barra de rolagem */
                flex-grow: 1; /* Ocupa o espaço disponível */
                margin-bottom: 1rem; /* Espaço antes dos botões */
            }

             .enrollment-modal .modal-section {
                margin-bottom: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid var(--border-color);
            }
             .enrollment-modal .modal-section:last-of-type {
                 border-bottom: none;
                 margin-bottom: 0;
                 padding-bottom: 0;
            }
            .enrollment-modal h4 {
                margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: var(--primary-color);
            }
             .enrollment-modal .document-viewer {
                max-height: 250px; /* Altura MÁXIMA, permite crescer menos se o texto for curto */
                overflow-y: auto; /* Scroll vertical */
                border: 1px solid var(--border-color);
                padding: 1rem; background-color: var(--subtle-bg); border-radius: 8px;
                font-size: 0.9rem; white-space: pre-wrap; margin-bottom: 1rem; /* Adicionado espaço inferior */
            }
            .enrollment-modal .checkbox-group {
                display: flex; align-items: center; gap: 0.5rem;
                /* margin-top: 1rem; */ /* Removido daqui, o espaço vem do viewer */
                padding: 0.5rem 0; /* Adiciona padding vertical para respiro */
            }
             .enrollment-modal .checkbox-group input[type="checkbox"] {
                width: auto; margin-top: -2px; flex-shrink: 0; /* Evita que o checkbox encolha */
            }
            .enrollment-modal .checkbox-group label {
                margin-bottom: 0; font-weight: normal; cursor: pointer;
            }
             .enrollment-modal .modal-actions {
                margin-top: auto; /* Empurra para baixo */
                padding-top: 1.5rem; border-top: 1px solid var(--border-color);
                display: flex; justify-content: flex-end; gap: 1rem;
                flex-shrink: 0; /* Evita que os botões encolham */
            }
             /* Estilo adicional para garantir visibilidade do texto do placeholder nos inputs */
             .enrollment-modal input::placeholder {
                 color: #999; /* Cor mais clara para placeholder */
                 opacity: 1; /* Garante visibilidade */
             }
        </style>
    `;

    // Re-adiciona o listener para habilitar/desabilitar o botão de confirmação
    modalOverlay.querySelector('#enrollment-form').addEventListener('input', (event) => {
        const acceptContractCheckbox = modalOverlay.querySelector('#acceptContract');
        const submitBtn = modalOverlay.querySelector('#submit-enrollment-btn');
        if (acceptContractCheckbox && submitBtn) {
            // Habilita o botão apenas se o contrato for aceito (outras validações podem ser adicionadas com form.checkValidity())
            submitBtn.disabled = !acceptContractCheckbox.checked;
        }

        // Simples máscara de CPF (opcional)
        if (event.target.name === 'aluno_cpf' || event.target.name === 'guardianCPF') {
            let value = event.target.value.replace(/\D/g, ''); // Remove não dígitos
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            event.target.value = value.slice(0, 14); // Limita tamanho
        }
        // Simples máscara de Telefone (opcional)
        if (event.target.name === 'guardianPhone') {
             let value = event.target.value.replace(/\D/g, '');
             if (value.length <= 10) { // Fixo ou celular sem 9
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
             } else { // Celular com 9
                 value = value.replace(/(\d{2})(\d)/, '($1) $2');
                 value = value.replace(/(\d{5})(\d)/, '$1-$2');
             }
             event.target.value = value.slice(0, 15); // Limita tamanho
        }
    });


    return modalOverlay;
}