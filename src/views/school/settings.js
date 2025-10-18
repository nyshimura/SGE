import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderSystemSettingsView() {
    if (!appState.systemSettings) {
        const data = await apiCall('getSystemSettings', {}, 'GET');
        appState.systemSettings = data.settings;
    }
    const settings = appState.systemSettings;
    if (!settings) return `<h2>Erro ao carregar configurações</h2>`;

    return `
        <div class="view-header">
            <h2>Configurações do Sistema</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="card full-width">
             <h3 class="card-title">Documentos</h3>
             <p>Gerencie os modelos de contrato e termos de uso que serão apresentados aos alunos durante a matrícula.</p>
             <button type="button" class="action-button" onclick="window.handleNavigateToDocumentTemplates()">Gerir Modelos de Documentos</button>
        </div>

        <div class="card full-width">
            <form onsubmit="window.handleUpdateSystemSettings(event)">
                <div class="settings-grid">
                    <div class="settings-section">
                        <h3 class="card-title">⚙️ Geral</h3>
                        <div class="form-group">
                            <label for="language">Linguagem</label>
                            <select id="language" name="language">
                                <option value="pt-BR" ${settings.language === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option>
                                <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>Inglês (EUA)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="timeZone">Fuso Horário (NTP)</label>
                            <input type="text" id="timeZone" name="timeZone" value="${settings.timeZone}">
                            <small>Ex: America/Sao_Paulo, Europe/Lisbon, UTC</small>
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">💰 Financeiro</h3>
                        <div class="form-group">
                            <label for="currencySymbol">Símbolo da Moeda</label>
                            <input type="text" id="currencySymbol" name="currencySymbol" value="${settings.currencySymbol}">
                        </div>
                         <div class="form-group">
                            <label for="defaultDueDay">Dia Padrão de Vencimento</label>
                            <input type="number" id="defaultDueDay" name="defaultDueDay" value="${settings.defaultDueDay}" min="1" max="28">
                        </div>
                        
                        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                            <h4 style="margin-top: 0; margin-bottom: 1rem;">Multa Rescisória</h4>
                            <div class="form-group">
                                <label class="form-group-inline" style="gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" id="enableTerminationFine" name="enableTerminationFine" ${settings.enableTerminationFine ? 'checked' : ''} onchange="document.getElementById('termination-fine-months-group').style.display = this.checked ? 'block' : 'none'" style="width: auto;">
                                    <span>Habilitar multa por trancamento de matrícula</span>
                                </label>
                            </div>
                            <div class="form-group" id="termination-fine-months-group" style="display: ${settings.enableTerminationFine ? 'block' : 'none'};">
                                <label for="terminationFineMonths">Nº de Mensalidades para Multa</label>
                                <input type="number" id="terminationFineMonths" name="terminationFineMonths" value="${settings.terminationFineMonths || 1}" min="1">
                                <small>Número de mensalidades a serem cobradas como multa quando um aluno tranca a matrícula.</small>
                            </div>
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">🤖 Integração com IA</h3>
                        <div class="form-group">
                           <label for="geminiApiKey">Chave da API do Gemini</label>
                           <input type="password" id="geminiApiKey" name="geminiApiKey" value="${settings.geminiApiKey || ''}">
                        </div>
                        <div class="form-group">
                           <label for="geminiApiEndpoint">URL do Endpoint da API</label>
                           <input type="text" id="geminiApiEndpoint" name="geminiApiEndpoint" value="${settings.geminiApiEndpoint || ''}">
                           <small>Ex: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent</small>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">✉️ E-mail (SMTP)</h3>
                        <div class="form-group">
                            <label for="smtpServer">Servidor SMTP</label>
                            <input type="text" id="smtpServer" name="smtpServer" value="${settings.smtpServer || ''}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPort">Porta</label>
                            <input type="text" id="smtpPort" name="smtpPort" value="${settings.smtpPort || ''}">
                        </div>
                        <div class="form-group">
                            <label for="smtpUser">Usuário</label>
                            <input type="text" id="smtpUser" name="smtpUser" value="${settings.smtpUser || ''}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPass">Senha</label>
                            <input type="password" id="smtpPass" name="smtpPass" value="${settings.smtpPass || ''}">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">💾 Base de Dados</h3>
                        <button type="button" class="action-button secondary" onclick="window.handleExportDatabase()" style="margin-top: 1rem;">Exportar Dados Atuais (JSON)</button>
                        <small style="display: block; margin-top: 0.5rem;">Exporta todos os dados do banco para um arquivo JSON.</small>
                    </div>
                </div>
                <button type="submit" class="action-button" style="margin-top: 2rem;">Salvar Configurações</button>
            </form>
        </div>
    `;
}