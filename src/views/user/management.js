// src/views/user/management.js
import { apiCall } from '../../api.js';
import { appState } from '../../state.js';

export async function renderUserManagementView(adminId) {
    let users = [];
    let courses = [];
    try {
        const data = await apiCall('getFilteredUsers', appState.userFilters, 'POST');
        users = data.users || [];
        courses = data.courses || [];
        appState.users = users; // Atualiza estado
        appState.courses = courses; // Atualiza estado
    } catch(e) {
        console.error("Erro ao buscar usuários:", e);
        // Pode retornar uma mensagem de erro na interface
        return `<div class="view-header"><h2>Erro ao carregar usuários</h2><button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar</button></div><p>${e.message}</p>`;
    }

    const filteredUsers = users.filter(u => u.id !== adminId);

    return `
        <div class="view-header">
            <h2>Gerenciamento de Usuários</h2>
            <button class="back-button" onclick="window.AppHandlers.handleNavigateBackToDashboard()">← Voltar ao Painel</button>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Filtros</h3>
            <div class="filter-container">
                 <div class="filter-group">
                    <label for="filter-name">Nome</label>
                    <input type="text" id="filter-name" name="name" oninput="window.AppHandlers.handleUserFilterChange(event)" value="${appState.userFilters.name}">
                </div>
                <div class="filter-group">
                    <label for="filter-role">Função</label>
                    <select id="filter-role" name="role" onchange="window.AppHandlers.handleUserFilterChange(event)">
                        <option value="all" ${appState.userFilters.role === 'all' ? 'selected' : ''}>Todas</option>
                        <option value="unassigned" ${appState.userFilters.role === 'unassigned' ? 'selected' : ''}>Não atribuído</option>
                        <option value="student" ${appState.userFilters.role === 'student' ? 'selected' : ''}>Aluno</option>
                        <option value="teacher" ${appState.userFilters.role === 'teacher' ? 'selected' : ''}>Professor</option>
                        <option value="admin" ${appState.userFilters.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-course">Curso</label>
                    <select id="filter-course" name="courseId" onchange="window.AppHandlers.handleUserFilterChange(event)">
                        <option value="all">Todos</option>
                        ${courses.map(c => `<option value="${c.id}" ${appState.userFilters.courseId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-status">Status da Matrícula</label>
                    <select id="filter-status" name="enrollmentStatus" onchange="window.AppHandlers.handleUserFilterChange(event)" ${appState.userFilters.courseId === 'all' ? 'disabled' : ''}>
                        <option value="all">Todos</option>
                        <option value="Pendente" ${appState.userFilters.enrollmentStatus === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Aprovada" ${appState.userFilters.enrollmentStatus === 'Aprovada' ? 'selected' : ''}>Aprovada</option>
                         <option value="Cancelada" ${appState.userFilters.enrollmentStatus === 'Cancelada' ? 'selected' : ''}>Cancelada</option> 
                    </select>
                </div>
            </div>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Usuários Encontrados (${filteredUsers.length})</h3>
            <div class="table-wrapper">
            <table>
                <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Ações</th></tr></thead>
                <tbody>
                    ${filteredUsers.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhum usuário encontrado com os filtros aplicados.</td></tr>' : filteredUsers.map(user => `
                        <tr>
                            <td>${user.firstName} ${user.lastName || ''}</td>
                            <td>${user.email}</td>
                            <td>
                                <select onchange="window.AppHandlers.handleRoleChange(event, ${user.id})">
                                    <option value="unassigned" ${user.role === 'unassigned' ? 'selected' : ''}>Não atribuído</option>
                                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Aluno</option>
                                    <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Professor</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </td>
                            <td>
                                <button class="action-button" onclick="window.AppHandlers.handleNavigateToProfile(${user.id})">Ver Perfil</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
}