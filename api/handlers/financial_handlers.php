<?php
function handle_get_financial_dashboard_data($conn, $data) {
    $month = $data['month']; // Ex: "2025-10"
    
    // 1. CALCULA A RECEITA ARRECADADA (O QUE ENTROU NO CAIXA NO MÊS)
    // Corrigido: Agora usa paymentDate para refletir o dinheiro que realmente entrou no mês.
    $stmtCollected = $conn->prepare("SELECT SUM(amount) as total FROM payments WHERE paymentDate LIKE ?");
    $stmtCollected->execute(["$month%"]);
    $collectedRevenue = $stmtCollected->fetchColumn() ?: 0;

    // 2. CALCULA O PREVISTO E A INADIMPLÊNCIA (REFERENTE ÀS MENSALIDADES DO MÊS)
    // Mantido: Continua usando referenceDate para saber o que era esperado para o mês.
    $stmtReference = $conn->prepare("SELECT SUM(CASE WHEN status != 'Cancelado' THEN amount ELSE 0 END) as totalExpected, 
                                            SUM(CASE WHEN status = 'Pendente' OR status = 'Atrasado' THEN amount ELSE 0 END) as totalOutstanding
                                     FROM payments WHERE referenceDate LIKE ?");
    $stmtReference->execute(["$month%"]);
    $referenceData = $stmtReference->fetch(PDO::FETCH_ASSOC);
    
    $expectedRevenue = $referenceData['totalExpected'] ?: 0;
    $outstandingRevenue = $referenceData['totalOutstanding'] ?: 0;


    // 3. CALCULA RECEITA POR CURSO (BASEADO NO QUE ENTROU NO CAIXA NO MÊS)
    // Corrigido: Agora usa paymentDate.
    $stmtCourse = $conn->prepare("SELECT c.name, SUM(p.amount) as total FROM payments p JOIN courses c ON p.courseId = c.id WHERE p.paymentDate LIKE ? GROUP BY c.name");
    $stmtCourse->execute(["$month%"]);
    $revenueByCourseData = $stmtCourse->fetchAll(PDO::FETCH_KEY_PAIR);

    // 4. CALCULA EVOLUÇÃO DA RECEITA (BASEADO NO QUE ENTROU NO CAIXA EM CADA MÊS)
    // Corrigido: Agora usa paymentDate.
    $evolutionData = [];
    $date = new DateTime("$month-01");
    $date->modify('-5 months');
    for ($i = 0; $i < 6; $i++) {
        $m = $date->format('Y-m');
        
        $stmtEvoCollected = $conn->prepare("SELECT SUM(amount) FROM payments WHERE paymentDate LIKE ?");
        $stmtEvoCollected->execute(["$m%"]);
        $collected = $stmtEvoCollected->fetchColumn() ?: 0;
        
        $stmtEvoExpected = $conn->prepare("SELECT SUM(amount) FROM payments WHERE referenceDate LIKE ? AND status != 'Cancelado'");
        $stmtEvoExpected->execute(["$m%"]);
        $expected = $stmtEvoExpected->fetchColumn() ?: 0;

        $evolutionData[] = [
            'month' => $date->format('M'), 
            'collected' => $collected, 
            'expected' => $expected
        ];
        $date->modify('+1 month');
    }

    send_response(true, [
        'expectedRevenue' => $expectedRevenue, 
        'collectedRevenue' => $collectedRevenue, 
        'outstandingRevenue' => $outstandingRevenue, 
        'revenueByCourseData' => $revenueByCourseData, 
        'evolutionData' => $evolutionData
    ]);
}

function handle_get_student_payments($conn, $data) {
    $studentId = $data['studentId'];
    $stmt = $conn->prepare("SELECT * FROM payments WHERE studentId = ? ORDER BY referenceDate DESC");
    $stmt->execute([$studentId]);
    $payments = $stmt->fetchAll();
    send_response(true, ['payments' => $payments]);
}

function handle_update_payment_status($conn, $data) {
    $paymentId = $data['paymentId'];
    $status = $data['status'];
    $paymentDate = ($status === 'Pago') ? date('Y-m-d') : null;
    $stmt = $conn->prepare("UPDATE payments SET status = ?, paymentDate = ? WHERE id = ?");
    $stmt->execute([$status, $paymentDate, $paymentId]);
    send_response(true, ['message' => 'Status do pagamento atualizado.']);
}
?>
