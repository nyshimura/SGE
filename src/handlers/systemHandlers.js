// src/handlers/systemHandlers.js
import { apiCall } from '../api.js';
import { appState } from '../state.js';
import { render } from '../router.js';

// Helper para converter arquivo para Base64
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
// Anexa ao handler global
window.AppHandlers = window.AppHandlers || {};
window.AppHandlers.fileToBase64 = fileToBase64;


// Handler para salvar Configurações Gerais E o Template de Certificado
export async function handleUpdateSystemSettings(event) {
    event.preventDefault();
    const form = event.target;
    const elements = form.elements;
    const submitButton = form.querySelector('button[type="submit"]');

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
    }

    const settingsData = {};
    const formData = new FormData(form);

    // Pega todos os campos do formulário (incluindo os hidden das outras views, se houver)
    formData.forEach((value, key) => {
        // Ignora o input de file temporário
        if (key !== 'certificateBackgroundImageInput_temp' && key !== 'schoolProfilePicture' && key !== 'signatureImage') {
             settingsData[key] = value;
        }
    });

    // Trata checkboxes
    if (elements.namedItem('enableTerminationFine')) {
        settingsData.enableTerminationFine = elements.namedItem('enableTerminationFine').checked;
    } else {
        // Se checkbox não está no form atual, pega valor do estado (ou default false)
        settingsData.enableTerminationFine = appState.systemSettings?.enableTerminationFine || false;
    }

    // *** LOGS PARA IMAGEM DO CERTIFICADO ***
    console.log("Dados lidos do form (settingsData):", settingsData);
    const imageBase64 = settingsData.certificate_background_image; // Pega do input hidden
    console.log("Base64 da Imagem Certificado (primeiros 100):", imageBase64 ? imageBase64.substring(0, 100) + '...' : 'Nenhuma/Removida');
    console.log("Tamanho da string Base64 Certificado:", imageBase64 ? imageBase64.length : 0);
    // ****************************************

    // Sanitização final ANTES de enviar (removidos campos de doc templates daqui)
    const enableFine = settingsData.enableTerminationFine;
    const fineMonthsValue = settingsData.terminationFineMonths;
    const terminationFineMonths = Math.max(1, parseInt(fineMonthsValue, 10) || 1);

    const finalSettingsData = {
        language: settingsData.language || 'pt-BR',
        timeZone: (settingsData.timeZone || 'America/Sao_Paulo').trim(),
        currencySymbol: (settingsData.currencySymbol || 'R$').trim(),
        defaultDueDay: Math.max(1, Math.min(28, parseInt(settingsData.defaultDueDay, 10) || 10)),
        geminiApiKey: settingsData.geminiApiKey || null,
        geminiApiEndpoint: (settingsData.geminiApiEndpoint || '').trim() || null,
        smtpServer: (settingsData.smtpServer || '').trim() || null,
        smtpPort: (settingsData.smtpPort || '').trim() || null,
        smtpUser: (settingsData.smtpUser || '').trim() || null,
        smtpPass: settingsData.smtpPass || null,
        enableTerminationFine: enableFine ? 1 : 0,
        terminationFineMonths: terminationFineMonths,
        site_url: (settingsData.site_url || '').trim() || null,
        email_approval_subject: (settingsData.email_approval_subject || '').trim() || null,
        email_approval_body: settingsData.email_approval_body || null,
        email_reset_subject: (settingsData.email_reset_subject || '').trim() || null,
        email_reset_body: settingsData.email_reset_body || null,
        // Campos do certificado (mantidos aqui)
        certificate_template_text: settingsData.certificate_template_text || null,
        certificate_background_image: imageBase64 || null, // Usa a variável logada
    };

    // *** LOGS ANTES DO ENVIO ***
    console.log("Dados FINAIS a serem enviados (finalSettingsData):", finalSettingsData);
    console.log("Base64 FINAL Certificado (primeiros 100):", finalSettingsData.certificate_background_image ? finalSettingsData.certificate_background_image.substring(0, 100) + '...' : 'NULL');
    // ***************************

    try {
        // Chama a API que salva TODOS os system settings (exceto doc templates)
        await apiCall('updateSystemSettings', { settingsData: finalSettingsData });
        alert('Configurações salvas!');
        appState.systemSettings = null; // Força recarregar
        render(); // Re-renderiza a view atual
    } catch(e) {
        alert(e.message || 'Erro ao salvar configurações.');
        // Mostra erro na view correta
        const errorElementId = appState.adminView === 'certificateTemplate' ? 'certificate-template-error' : 'settings-error';
        const errorElement = document.getElementById(errorElementId);
        if (errorElement) errorElement.textContent = e.message;
    } finally {
        if(submitButton) {
            submitButton.disabled = false;
            // Define texto do botão
            if (appState.adminView === 'certificateTemplate') submitButton.textContent = 'Salvar Modelo';
            else submitButton.textContent = 'Salvar Configurações Gerais';
        }
    }
}


// *** FUNÇÃO RESTAURADA E CORRIGIDA ***
// Handler para salvar APENAS os templates de Contrato e Termos
export async function handleUpdateDocumentTemplates(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    // Pega apenas os dados deste formulário específico
    const templateData = {
        enrollmentContractText: formData.get('enrollmentContractText') || null,
        imageTermsText: formData.get('imageTermsText') || null
    };
    const submitButton = form.querySelector('button[type="submit"]');

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
    }

    console.log("Dados a serem enviados (Document Templates):", templateData); // Log

    try {
        // Chama a API específica para salvar apenas os templates de documento
        await apiCall('updateDocumentTemplates', templateData); // Passa apenas os dados relevantes

        alert('Modelos salvos!');
        appState.systemSettings = null; // Força recarregar settings na próxima necessidade
        window.AppHandlers.handleNavigateBackToDashboard(); // Volta para o dashboard
    } catch(e) {
        alert(e.message || 'Erro ao salvar modelos.');
        const errorElement = document.getElementById('doc-template-error');
        if (errorElement) errorElement.textContent = e.message;
        console.error("Erro ao salvar Document Templates:", e); // Log do erro
    } finally {
        if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Modelos';
        }
    }
}
// **********************************

// Handler para Exportar BD (mantido como estava)
export async function handleExportDatabase(event) {
    event.preventDefault();
    try{
        const data = await apiCall('exportDatabase',{},'GET');
        const str = JSON.stringify(data.exportData, null, 2);
        const blob = new Blob([str],{type:'application/json;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        a.href = url;
        a.download = `sge_export_${ts}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Exportação concluída!');
    } catch(error) {
        alert(error.message || 'Erro ao exportar dados.');
    }
}