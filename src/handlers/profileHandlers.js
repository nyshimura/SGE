// src/handlers/profileHandlers.js
import { apiCall } from '../api.js';
import { appState } from '../state.js';
import { render } from '../router.js';
import { fileToBase64 } from '../utils/helpers.js';

export async function handleUpdateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId'), 10);
    const profileData = {};
    const submitButton = form.querySelector('button[type="submit"]');

    formData.forEach((value, key) => {
        // Inclui campo mesmo se for string vazia, mas verifica se é file input vazio
        if (key !== 'profilePicture' || (form.elements.profilePicture && form.elements.profilePicture.files.length > 0)) {
            const optionalNullableFields = ['age', 'rg', 'cpf', 'address', 'guardianName', 'guardianRG', 'guardianCPF', 'guardianEmail', 'guardianPhone'];
            // Se for um campo opcional e estiver vazio, envia null, senão envia o valor (trim se string)
            if (optionalNullableFields.includes(key) && String(value).trim() === '') {
                 profileData[key] = null;
            } else if (typeof value === 'string') {
                 profileData[key] = value.trim();
            } else {
                 profileData[key] = value;
            }
        }
    });

    const profilePicFile = formData.get('profilePicture');
    if (profilePicFile instanceof File && profilePicFile.size > 0) {
        profileData.profilePicture = await fileToBase64(profilePicFile);
    }
    delete profileData.userId; // Não envia userId dentro de profileData

    if (submitButton) submitButton.disabled = true;

    try {
        await apiCall('updateProfile', { userId, profileData });
        alert('Perfil atualizado!');

        // Função para atualizar dados localmente
        const updateLocalUserData = (user) => {
            if (!user) return null;
            const updatedUser = { ...user };
            for (const key in profileData) {
                // Não atualiza a senha aqui, apenas outros campos
                if (key !== 'password' && key !== 'profilePicture') {
                    updatedUser[key] = profileData[key];
                }
            }
            // Atualiza a foto se foi enviada
            if (profileData.profilePicture) {
                updatedUser.profilePicture = profileData.profilePicture;
            }
            return updatedUser;
        };

        // Atualiza currentUser se for o próprio perfil
        if (appState.currentUser && appState.currentUser.id === userId) {
            appState.currentUser = updateLocalUserData(appState.currentUser);
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
        }
        // Atualiza na lista de usuários (para admin view)
        const userIndex = appState.users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            appState.users[userIndex] = updateLocalUserData(appState.users[userIndex]);
        }
        render(); // Re-renderiza a view de perfil
    } catch (e) {
        alert(e.message || 'Erro ao atualizar perfil.');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

export async function handleUpdateSchoolProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const profileData = {};
    const submitButton = form.querySelector('button[type="submit"]');

    formData.forEach((value, key) => {
        // Processa apenas se não for input de file vazio
        if (!['schoolProfilePicture', 'signatureImage'].includes(key) || (form.elements[key] && form.elements[key].files.length > 0)) {
             profileData[key] = typeof value === 'string' ? value.trim() : value;
        }
    });

    const schoolPicFile = formData.get('schoolProfilePicture');
    if (schoolPicFile instanceof File && schoolPicFile.size > 0) {
        profileData.profilePicture = await fileToBase64(schoolPicFile);
    }
     // Remove a chave se não houver arquivo (para não sobrescrever com string vazia)
    else { delete profileData.schoolProfilePicture; }


    const signatureFile = formData.get('signatureImage');
    if (signatureFile instanceof File && signatureFile.size > 0) {
        profileData.signatureImage = await fileToBase64(signatureFile);
    }
     // Remove a chave se não houver arquivo
    else { delete profileData.signatureImage; }


    if (submitButton) submitButton.disabled = true;

    try {
        const data = await apiCall('updateSchoolProfile', { profileData });
        appState.schoolProfile = data.profile; // Atualiza o perfil da escola no estado global
        alert('Dados da unidade atualizados!');
        render(); // Re-renderiza a view do perfil da escola
    } catch (e) {
        alert(e.message || 'Erro ao atualizar dados da unidade.');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

export async function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userId = parseInt(formData.get('userId'), 10);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    const submitButton = form.querySelector('button[type="submit"]');
    // Assume que há um <p class="error-message"> DENTRO da seção de alterar senha no profile.js
    const errorElement = form.closest('.admin-only-section').querySelector('.error-message');
    // Se não encontrar, tenta buscar por ID (caso adicione um ID específico)
    // const errorElement = document.getElementById('change-password-error');

    if (errorElement) errorElement.textContent = ''; // Limpa erro anterior

    if (!currentPassword || !newPassword || !confirmPassword) {
        const msg = "Preencha todos os campos.";
        if (errorElement) errorElement.textContent = msg; else alert(msg);
        return;
    }
    if (newPassword !== confirmPassword) {
        const msg = 'As novas senhas não coincidem.';
        if (errorElement) errorElement.textContent = msg; else alert(msg);
        return;
    }
    if (newPassword.length < 6) {
        const msg = 'A nova senha deve ter pelo menos 6 caracteres.';
        if (errorElement) errorElement.textContent = msg; else alert(msg);
        return;
    }

    if (submitButton) submitButton.disabled = true;

    try {
        await apiCall('changePassword', { userId, currentPassword, newPassword });
        alert('Senha alterada com sucesso!');
        form.reset();
    } catch (e) {
        if (errorElement) errorElement.textContent = e.message || 'Erro ao alterar senha.';
        else alert(e.message || 'Erro ao alterar senha.');
    } finally {
         if (submitButton) submitButton.disabled = false;
    }
}

// Funções de Preview (mantidas)
export function previewProfileImage(event) {
    const input = event.target; const preview = document.getElementById('profile-pic-preview');
    if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) preview.src = e.target.result; }; reader.readAsDataURL(input.files[0]); }
}
export function previewSchoolImage(event) {
    const input = event.target; const preview = document.getElementById('school-pic-preview');
    if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) preview.src = e.target.result; }; reader.readAsDataURL(input.files[0]); }
}
export function previewSignatureImage(event) {
    const input = event.target; const preview = document.getElementById('signature-preview');
    if (input.files && input.files[0] && preview) { const reader = new FileReader(); reader.onload = (e) => { if (e.target?.result) preview.src = e.target.result; }; reader.readAsDataURL(input.files[0]); }
}