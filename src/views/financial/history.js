import { appState } from '../../state.js';

export function renderStudentFinancialHistory(studentId, studentPayments, isAdminView = false, allowActions = false) {
    studentPayments.sort((a, b) => b.referenceDate.localeCompare(a.referenceDate));
        
    const title = isAdminView ? "Histórico Financeiro" : "Meu Histórico Financeiro";

    const pendingPayments = studentPayments.filter(p => p.status === 'Pendente' || p.status === 'Atrasado');
    
    let bulkPayButton = '';
    if (!isAdminView && pendingPayments.length > 1) {
        const pendingIds = pendingPayments.map(p => p.id).join(',');
        bulkPayButton = `<div style="margin-bottom: 1rem;"><button class="action-button" onclick="window.handleInitiatePixPayment([${pendingIds}])">Pagar todas as pendências com PIX</button></div>`;
    }
    
    return `
        <h4 class="card-title">${title}</h4>
        ${bulkPayButton}
        ${studentPayments.length === 0 ? '<p>Nenhum histórico de pagamento encontrado.</p>' : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Mês de Referência</th>
                            <th>Curso</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                       ${studentPayments.map(p => {
                           const course = appState.courses.find(c => c.id === p.courseId);
                           const refDate = new Date(p.referenceDate + 'T00:00:00');
                           const dueDate = new Date(p.dueDate + 'T00:00:00');
                           let actionHtml = '<td>-</td>';
                           
                           if (allowActions) {
                               actionHtml = `<td>
                                 <select class="payment-status-select" onchange="window.handlePaymentStatusChange(event, ${p.id})">
                                    <option value="Pendente" ${p.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="Pago" ${p.status === 'Pago' ? 'selected' : ''}>Pago</option>
                                    <option value="Atrasado" ${p.status === 'Atrasado' ? 'selected' : ''}>Atrasado</option>
                                    <option value="Cancelado" ${p.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                 </select>
                               </td>`;
                           } else if ((p.status === 'Pendente' || p.status === 'Atrasado')) {
                               actionHtml = `<td><button class="action-button" onclick="window.handleInitiatePixPayment([${p.id}])">Pagar com PIX</button></td>`;
                           }


                           return `
                            <tr class="${p.status === 'Cancelado' ? 'text-strikethrough' : ''}">
                                <td>${refDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td>
                                <td>${course?.name || 'N/A'}</td>
                                <td>R$ ${Number(p.amount).toFixed(2).replace('.', ',')}</td>
                                <td>${dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                                ${actionHtml}
                            </tr>
                           `
                       }).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}
