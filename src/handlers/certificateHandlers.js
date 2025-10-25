// src/handlers/certificateHandlers.js
import { apiCall } from '../api.js'; // <<< Certifique-se que o caminho está correto
import { appState } from '../state.js'; // <<< Certifique-se que o caminho está correto
import { render } from '../router.js'; // <<< Certifique-se que o caminho está correto

// ----------------------------------------------------------------
// FUNÇÃO HELPER INTERNA (Simplificação)
// ----------------------------------------------------------------

/**
 * Converte um objeto File em uma string Base64.
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
// HANDLERS DE CERTIFICADO
// ----------------------------------------------------------------

// <<< MODIFICADO: Renomeada para clareza >>>
// Função auxiliar (não exportada) para ler dados de um formulário
function getCertificateParamsFromForm(form) {
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
 * Dispara a geração de um certificado individual (abre em nova aba) - Usado via Formulário.
 */
function handleGenerateCertificate(event, studentId, courseId) { // <<< Removido export daqui
    event.preventDefault(); // Previne submit do form
    const form = event.target;
    const params = getCertificateParamsFromForm(form); // <<< Usa a função renomeada
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

// <<< ADICIONADO: Nova função para visualizar certificado da lista do aluno >>>
/**
 * Dispara a visualização/download de um certificado (abre em nova aba) - Usado na view 'myCertificates'.
 */
function handleViewCertificate(studentId, courseId, completionDate) { // <<< Removido export daqui
    // Validações básicas
    if (!studentId || !courseId || !completionDate) {
        console.error("IDs de aluno/curso ou data de conclusão ausentes para visualizar certificado.");
        alert("Não foi possível gerar o link do certificado. Dados incompletos.");
        return;
    }
     // Validação simples de data YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
        console.error('Formato de data inválido recebido:', completionDate);
        alert('Formato de data inválido recebido. Use YYYY-MM-DD.');
        return;
    }

    const queryParams = new URLSearchParams({
        action: 'generateCertificate', // Usa a mesma action do backend
        studentId: studentId,
        courseId: courseId,
        completionDate: completionDate,
        overrideCargaHoraria: '' // Carga horária não precisa ser sobrescrita na visualização
    });

    // Chama a API via GET para abrir o PDF diretamente
    const url = `api/index.php?${queryParams.toString()}`;
    window.open(url, '_blank'); // Abre o PDF em uma nova aba
}
// <<< FIM DA ADIÇÃO >>>

/**
 * Dispara a geração de certificados em massa para um curso (inicia download).
 */
function handleGenerateBulkCertificates(event, courseId) { // <<< Removido export daqui
     event.preventDefault(); // Previne submit do form
     const form = event.target;
     const params = getCertificateParamsFromForm(form); // <<< Usa a função renomeada
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
// HANDLERS DO TEMPLATE (Edição de modelo)
// ----------------------------------------------------------------

/**
 * Handler para o preview da imagem de fundo do certificado.
 */
async function previewCertificateBackground(event) { // <<< Removido export daqui
    const input = event.target;
    const preview = document.getElementById('certificate-bg-preview');
    const currentBgField = document.getElementById('currentCertificateBackground');
    const file = input.files ? input.files[0] : null;

    if (file && preview && currentBgField) {
        try {
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
 */
function removeCertificateBackground() { // <<< Removido export daqui
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

// <<< ADICIONADO/MODIFICADO: Agrupa todos os handlers para exportação >>>
export const certificateHandlers = {
    handleGenerateCertificate,
    handleViewCertificate, // <<< Nova função adicionada aqui
    handleGenerateBulkCertificates,
    previewCertificateBackground,
    removeCertificateBackground,
};