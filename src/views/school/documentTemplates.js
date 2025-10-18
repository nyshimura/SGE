import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderDocumentTemplatesView() {
    // Busca as configurações mais recentes se ainda não estiverem carregadas
    if (!appState.systemSettings) {
        const data = await apiCall('getSystemSettings', {}, 'GET');
        appState.systemSettings = data.settings;
    }
    const settings = appState.systemSettings;

    const placeholders = [
        { group: 'Dados do Aluno', items: ['{{aluno_nome}}', '{{aluno_email}}', '{{aluno_rg}}', '{{aluno_cpf}}', '{{aluno_endereco}}'] },
        { group: 'Dados do Responsável (para menores)', items: ['{{responsavel_nome}}', '{{responsavel_rg}}', '{{responsavel_cpf}}', '{{responsavel_email}}', '{{responsavel_telefone}}'] },
        { group: 'Dados do Contratante (Automático)', items: ['{{contratante_nome}}', '{{contratante_rg}}', '{{contratante_cpf}}', '{{contratante_email}}', '{{contratante_endereco}}'] },
        { group: 'Dados do Curso', items: ['{{curso_nome}}', '{{curso_mensalidade}}', '{{curso_mensalidade_extenso}}', '{{vencimento_dia}}'] },
        { group: 'Dados da Escola', items: ['{{escola_nome}}', '{{escola_cnpj}}', '{{escola_endereco}}'] },
        { group: 'Dados de Data', items: ['{{data_atual_extenso}}'] }
    ];

    return `
        <div class="view-header">
            <h2>Gerir Modelos de Documentos</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <form class="card full-width" onsubmit="window.handleUpdateDocumentTemplates(event)">
            <div class="document-editor-container">
                
                <div class="document-editor">
                    <h3 class="card-title">Modelo do Contrato de Matrícula</h3>
                    <div class="form-group">
                        <textarea id="enrollmentContractText" name="enrollmentContractText" rows="20">${settings.enrollmentContractText || ''}</textarea>
                    </div>
                </div>

                <div class="placeholders-sidebar">
                    <h3 class="card-title">Placeholders Disponíveis</h3>
                    <p>Clique para copiar e cole no texto.</p>
                    ${placeholders.map(group => `
                        <div class="placeholder-group">
                            <h4>${group.group}</h4>
                            ${group.items.map(ph => `<button type="button" class="placeholder-button" onclick="navigator.clipboard.writeText('${ph}')">${ph}</button>`).join('')}
                        </div>
                    `).join('')}
                </div>
                
                <div class="document-editor">
                    <h3 class="card-title">Modelo do Termo de Uso de Imagem</h3>
                    <div class="form-group">
                        <textarea id="imageTermsText" name="imageTermsText" rows="20">${settings.imageTermsText || ''}</textarea>
                    </div>
                </div>

            </div>
            <button type="submit" class="action-button" style="margin-top: 1.5rem;">Salvar Modelos</button>
        </form>
    `;
}