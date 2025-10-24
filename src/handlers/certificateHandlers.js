// src/handlers/certificateHandlers.js
import { apiCall } from '../api.js';
import { appState } from '../state.js';
import { render } from '../router.js';

// ----------------------------------------------------------------
// FUNÇÃO HELPER INTERNA (Simplificação)
// ----------------------------------------------------------------

/**
 * Converte um objeto File em uma string Base64.
 * Movido para cá para simplificar dependências.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}


// ----------------------------------------------------------------
// HANDLERS EXISTENTES
// ----------------------------------------------------------------

// Função auxiliar (não exportada)
function getCertificateParams(form) {
    const completionDate = form.elements.namedItem('completionDate').value;
    const overrideCargaHoraria = form.elements.namedItem('overrideCargaHoraria').value;

    if (!completionDate) {
        alert('Por favor, selecione uma data de conclusão.');
        return null;
    }
    // Validação simples de data YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
        alert('Formato de data inválido. Use YYYY-MM-DD.');
        return null;
    }

    return { completionDate, overrideCargaHoraria };
}


/**
 * Dispara a geração de um certificado individual (abre em nova aba).
 */
export function handleGenerateCertificate(event, studentId, courseId) {
    event.preventDefault(); // Previne submit do form
    const form = event.target;
    const params = getCertificateParams(form);
    if (!params) return;

    const queryParams = new URLSearchParams({
        action: 'generateCertificate',
        studentId: studentId,
        courseId: courseId,
        completionDate: params.completionDate,
        overrideCargaHoraria: params.overrideCargaHoraria || ''
    });

    // Chama a API via GET para abrir o PDF diretamente
    const url = `api/index.php?${queryParams.toString()}`;
    window.open(url, '_blank');
}


/**
 * Dispara a geração de certificados em massa para um curso (inicia download).
 */
export function handleGenerateBulkCertificates(event, courseId) {
     event.preventDefault(); // Previne submit do form
     const form = event.target;
     const params = getCertificateParams(form);
     if (!params) return;

    const queryParams = new URLSearchParams({
        action: 'generateBulkCertificates',
        courseId: courseId,
        completionDate: params.completionDate,
        overrideCargaHoraria: params.overrideCargaHoraria || ''
    });

    const url = `api/index.php?${queryParams.toString()}`;
    // Redireciona a janela atual para iniciar o download do ZIP
    window.location.href = url;
    
    alert("A geração do arquivo ZIP foi iniciada. O download começará em breve. Se ocorrer um erro, um arquivo de texto com a mensagem será baixado.");
}

// ----------------------------------------------------------------
// HANDLERS DO TEMPLATE (Corrigidos)
// ----------------------------------------------------------------

/**
 * Handler para o preview da imagem de fundo do certificado.
 * Esta função é chamada pelo 'onchange' do input file.
 */
export async function previewCertificateBackground(event) {
    const input = event.target;
    const preview = document.getElementById('certificate-bg-preview');
    const currentBgField = document.getElementById('currentCertificateBackground');
    const file = input.files ? input.files[0] : null;

    if (file && preview && currentBgField) {
        try {
            // *** MUDANÇA: Chama a função fileToBase64 local ***
            const base64String = await fileToBase64(file); 
            
            preview.src = base64String;
            preview.style.display = 'block';
            currentBgField.value = base64String; // Guarda base64 para envio
        } catch (error) {
            console.error("Erro ao ler arquivo de imagem:", error);
            alert("Erro ao carregar imagem.");
        }
    }
}

/**
 * Handler para remover a imagem de fundo do certificado.
 * Esta função é chamada pelo 'onclick' do botão "Remover Imagem".
 */
export function removeCertificateBackground() {
    const preview = document.getElementById('certificate-bg-preview');
    const currentBgField = document.getElementById('currentCertificateBackground');
    const fileInput = document.getElementById('certificateBackgroundImageInput'); // ID do input file

    if (preview) {
        preview.src = '#';
        preview.style.display = 'none';
    }
    if (currentBgField) {
        currentBgField.value = ''; // Envia string vazia (backend converterá para null)
    }
    if (fileInput) {
        fileInput.value = ''; // Limpa o input file
    }
}