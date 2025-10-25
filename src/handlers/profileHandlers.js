// src/handlers/profileHandlers.js
import { apiCall } from '../api.js'; // Ajuste o caminho se necessário
import { appState } from '../state.js'; // Ajuste o caminho se necessário
import { render } from '../router.js'; // Ajuste o caminho se necessário
import { fileToBase64 } from '../utils/helpers.js'; // Ajuste o caminho se necessário

// <<< FUNÇÃO MODIFICADA >>>
export async function handleUpdateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId'), 10);
    const profileData = {};
    const submitButton = form.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('profile-update-error');
    const successElement = document.getElementById('profile-update-success');

    if (errorElement) errorElement.textContent = '';
    if (successElement) successElement.textContent = '';

    formData.forEach((value, key) => {
        // Ignora foto (tratada depois) E ignora idade (calculada no backend)
        // <<< MODIFICADO: Adiciona key === 'age' para ignorar >>>
        if (key === 'profilePicture' || key === 'age') return;

        const optionalNullableFields = [
            'lastName', /*'age',*/ 'address', 'rg', 'cpf', 'birthDate',
            'guardianName', 'guardianRG', 'guardianCPF', 'guardianEmail', 'guardianPhone'
        ];

        if (optionalNullableFields.includes(key) && String(value).trim() === '') {
             profileData[key] = null;
        } else if (key === 'birthDate' && value === '') {
             profileData[key] = null;
        } else if (typeof value === 'string') {
             profileData[key] = value.trim();
        } else { profileData[key] = value; }
    });

    // Tratamento da Imagem de Perfil
    const profilePicInput = form.elements.namedItem('profilePicture');
    const profilePicFile = profilePicInput?.files?.[0];
    if (profilePicFile instanceof File && profilePicFile.size > 0) {
         try { profileData.profilePicture = await fileToBase64(profilePicFile); }
         catch (e) { /* ... tratamento de erro ... */ }
    } else if (form.elements.namedItem('removeProfilePicture')?.value === 'true') {
         profileData.profilePicture = null;
    }

    if (submitButton) submitButton.disabled = true;

    try {
        const response = await apiCall('updateProfile', { userId, profileData });

        // --- INÍCIO DA MODIFICAÇÃO (Substituído pela lógica de Refresh) ---
        
        // 1. Verifica se a API retornou sucesso.
        if (response && (response.success || response.status === 'success')) {
            
            // 2. Mostra a mensagem de sucesso
            if (successElement) {
                successElement.textContent = 'Perfil atualizado com sucesso!';
            } else {
                alert('Perfil atualizado!');
            }
            
            // 3. Define o refresh da página após 1 segundo (para o usuário ler a msg)
            setTimeout(() => {
                window.location.reload();
            }, 1000); // 1000ms = 1 segundo

        } else { 
            // Se a API retornar um erro (ex: success: false), joga para o 'catch'
            throw new Error(response?.data?.message || 'Falha ao atualizar perfil. Resposta inesperada da API.'); 
        }
        // --- FIM DA MODIFICAÇÃO ---

    } catch (e) {
        console.error("Erro em handleUpdateProfile:", e);
        if (errorElement) errorElement.textContent = e.message || 'Erro ao atualizar perfil.';
        else alert(e.message || 'Erro ao atualizar perfil.');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

// ... (Restante do arquivo inalterado) ...
export async function handleUpdateSchoolProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const profileData = {};
    const submitButton = form.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('school-profile-update-error');
    const successElement = document.getElementById('school-profile-update-success');
    if (errorElement) errorElement.textContent = ''; if (successElement) successElement.textContent = '';
    formData.forEach((value, key) => { if (!['schoolProfilePicture', 'signatureImage'].includes(key)) { profileData[key] = typeof value === 'string' ? value.trim() : value; } });
    const schoolPicInput = form.elements.namedItem('schoolProfilePicture'); const schoolPicFile = schoolPicInput?.files?.[0];
    if (schoolPicFile instanceof File && schoolPicFile.size > 0) { try { profileData.profilePicture = await fileToBase64(schoolPicFile); } catch (e) { if (errorElement) errorElement.textContent = 'Erro ao processar logo da escola.'; else alert('Erro ao processar logo da escola.'); if (submitButton) submitButton.disabled = false; return; } } else if (form.elements.namedItem('removeSchoolProfilePicture')?.value === 'true') { profileData.profilePicture = null; }
    const signatureInput = form.elements.namedItem('signatureImage'); const signatureFile = signatureInput?.files?.[0];
    if (signatureFile instanceof File && signatureFile.size > 0) { try { profileData.signatureImage = await fileToBase64(signatureFile); } catch (e) { if (errorElement) errorElement.textContent = 'Erro ao processar imagem da assinatura.'; else alert('Erro ao processar imagem da assinatura.'); if (submitButton) submitButton.disabled = false; return; } } else if (form.elements.namedItem('removeSignatureImage')?.value === 'true') { profileData.signatureImage = null; }
    if (submitButton) submitButton.disabled = true;
    try { const response = await apiCall('updateSchoolProfile', { profileData }); if (response && response.success && response.profile) { appState.schoolProfile = response.profile; if (successElement) successElement.textContent = 'Dados da unidade atualizados!'; else alert('Dados da unidade atualizados!'); setTimeout(() => render(), 500); } else { throw new Error(response?.data?.message || 'Falha ao atualizar dados. Resposta inesperada.'); } } catch (e) { console.error("Erro em handleUpdateSchoolProfile:", e); if (errorElement) errorElement.textContent = e.message || 'Erro ao atualizar dados da unidade.'; else alert(e.message || 'Erro ao atualizar dados da unidade.'); } finally { if (submitButton) submitButton.disabled = false; }
}
export async function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target; const formData = new FormData(form); const userId = parseInt(formData.get('userId'), 10); const currentPassword = formData.get('currentPassword'); const newPassword = formData.get('newPassword'); const confirmPassword = formData.get('confirmPassword'); const submitButton = form.querySelector('button[type="submit"]'); const errorElement = document.getElementById('change-password-error'); if (errorElement) errorElement.textContent = '';
    if (!currentPassword || !newPassword || !confirmPassword) { const msg = "Preencha todos os campos de senha."; if (errorElement) errorElement.textContent = msg; else alert(msg); return; } if (newPassword !== confirmPassword) { const msg = 'As novas senhas não coincidem.'; if (errorElement) errorElement.textContent = msg; else alert(msg); return; } if (newPassword.length < 6) { const msg = 'A nova senha deve ter pelo menos 6 caracteres.'; if (errorElement) errorElement.textContent = msg; else alert(msg); return; }
    if (submitButton) submitButton.disabled = true;
    try { const response = await apiCall('changePassword', { userId, currentPassword, newPassword }); if (response && response.success) { alert('Senha alterada com sucesso!'); form.reset(); } else { throw new Error(response?.data?.message || 'Falha ao alterar senha.'); } } catch (e) { console.error("Erro em handleChangePassword:", e); if (errorElement) errorElement.textContent = e.message || 'Erro ao alterar senha.'; else alert(e.message || 'Erro ao alterar senha.'); } finally { if (submitButton) submitButton.disabled = false; }
}
export function previewImage(event, previewElementId) {
    const input = event.target; const preview = document.getElementById(previewElementId); if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) { preview.src = e.target.result; preview.style.display = 'block'; } }; reader.readAsDataURL(input.files[0]); const removeInputId = previewElementId.replace('-preview', '-remove'); const removeInput = document.getElementById(removeInputId); if (removeInput) removeInput.value = 'false'; }
}
export function removeProfileImage() {
    const preview = document.getElementById('profile-pic-preview'); const input = document.getElementById('profilePictureInput'); let removeInput = document.getElementById('removeProfilePicture'); if (!removeInput && preview) { removeInput = document.createElement('input'); removeInput.type = 'hidden'; removeInput.id = 'removeProfilePicture'; removeInput.name = 'removeProfilePicture'; preview.closest('form').appendChild(removeInput); }
    if (preview) { preview.src = 'assets/default-user.png'; } if (input) { input.value = ''; } if (removeInput) { removeInput.value = 'true'; }
}
export const profileHandlers = { handleUpdateProfile, handleUpdateSchoolProfile, handleChangePassword, previewImage, removeProfileImage };