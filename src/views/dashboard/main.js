// src/views/dashboard/main.js
import { apiCall } from '../../api.js';
import { appState } from '../../state.js';
import { renderAdminView } from './admin.js';
import { renderStudentView } from './student.js';
import { renderTeacherView } from './teacher.js';

/**
 * Função principal para renderizar o dashboard apropriado baseado na função do usuário.
 * Busca os dados necessários da API.
 */
export async function renderDashboard(appRoot) {
    const { currentUser } = appState;

    if (!currentUser) {
        // Se por algum motivo o usuário não estiver logado, redireciona para login
        window.AppHandlers.navigateTo('login');
        return '<div class="loading-placeholder">Redirecionando...</div>';
    }

    // Mostra loading enquanto busca dados
    if (appRoot) appRoot.innerHTML = '<div class="loading-placeholder">Se ainda não carregou atualize a página!</div>';

    try {
        const data = await apiCall('getDashboardData', { userId: currentUser.id, role: currentUser.role }, 'GET');

        // --- Verificação Essencial ---
        if (!data || typeof data !== 'object') {
            throw new Error("API getDashboardData retornou dados inválidos ou vazios.");
        }
        // -----------------------------

        // Atualiza o estado global com os dados recebidos, garantindo arrays vazios como fallback
        appState.courses = data.courses || [];
        appState.enrollments = data.enrollments || [];
        appState.attendance = data.attendance || []; // Se attendance for necessário no dashboard
        appState.payments = data.payments || []; // Se payments for necessário
        appState.users = data.users || []; // Principalmente para admin
        appState.teachers = data.teachers || []; // Para student/admin

        // Chama a função helper que decide qual view específica renderizar
        const dashboardHtml = renderDashboardHelper(currentUser.id, currentUser.role, appState); // Passa o appState completo

        // --- Verificação Essencial ---
        if (typeof dashboardHtml !== 'string' || dashboardHtml.trim() === '') {
            console.error("!!! renderDashboardHelper retornou HTML inválido ou vazio:", dashboardHtml); // Mantido: Erro importante
            throw new Error("Falha ao gerar o conteúdo do dashboard para a função: " + currentUser.role);
        }
        // -----------------------------

        return dashboardHtml; // Retorna o HTML para o router inserir

    } catch (error) {
        console.error("!!! Erro ao carregar dados do dashboard:", error); // Mantido: Erro importante
        // Retorna uma mensagem de erro para ser exibida pelo router
        return `<div class="error-placeholder">Erro ao carregar dados do painel: ${error.message} <br> Verifique a consola para mais detalhes.</div>`;
    }
}

/**
 * Função helper que escolhe a view específica do dashboard.
 * Recebe o appState completo como 'data' para passar às views filhas.
 */
function renderDashboardHelper(userId, role, data) { // 'data' aqui é o appState
    switch (role) {
        case 'admin':
        case 'superadmin':
            // Verifica se renderAdminView retorna string
            const adminHtml = renderAdminView(userId, data);
            if (typeof adminHtml !== 'string') console.error("!!! renderAdminView NÃO retornou uma string!"); // Mantido: Erro importante
            return adminHtml;
        case 'student':
            // Verifica se renderStudentView retorna string
            const studentHtml = renderStudentView(userId, data);
            if (typeof studentHtml !== 'string') console.error("!!! renderStudentView NÃO retornou uma string!"); // Mantido: Erro importante
            return studentHtml;
        case 'teacher':
            // Verifica se renderTeacherView retorna string
            const teacherHtml = renderTeacherView(userId, data);
            if (typeof teacherHtml !== 'string') console.error("!!! renderTeacherView NÃO retornou uma string!"); // Mantido: Erro importante
            return teacherHtml;
        case 'unassigned':
            return '<div class="card"><h3 class="card-title">Acesso Pendente</h3><p>Sua conta ainda não foi atribuída a uma função (Aluno, Professor, Admin). Por favor, aguarde a administração liberar seu acesso.</p></div>';
        default:
            console.error("Função de usuário desconhecida encontrada:", role); // Mantido: Erro importante
            return '<div class="card"><p>Erro: Função de usuário desconhecida. Contate o suporte.</p></div>';
    }
}