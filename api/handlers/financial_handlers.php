<?php
function handle_get_financial_dashboard_data($conn, $data) {
    $month = $data['month'];
    $stmtMonth = $conn->prepare("SELECT SUM(amount) as total, status FROM payments WHERE referenceDate LIKE ? GROUP BY status");
    $stmtMonth->execute(["$month%"]);
    $monthData = $stmtMonth->fetchAll(PDO::FETCH_KEY_PAIR);
    $collectedRevenue = isset($monthData['Pago']) ? $monthData['Pago'] : 0;
    $pendingRevenue = isset($monthData['Pendente']) ? $monthData['Pendente'] : 0;
    $overdueRevenue = isset($monthData['Atrasado']) ? $monthData['Atrasado'] : 0;
    $outstandingRevenue = $pendingRevenue + $overdueRevenue;
    $expectedRevenue = $collectedRevenue + $outstandingRevenue + (isset($monthData['Cancelado']) ? $monthData['Cancelado'] : 0);
    $stmtCourse = $conn->prepare("SELECT c.name, SUM(p.amount) as total FROM payments p JOIN courses c ON p.courseId = c.id WHERE p.referenceDate LIKE ? AND p.status = 'Pago' GROUP BY c.name");
    $stmtCourse->execute(["$month%"]);
    $revenueByCourseData = $stmtCourse->fetchAll(PDO::FETCH_KEY_PAIR);
    $evolutionData = [];
    $date = new DateTime("$month-01");
    $date->modify('-5 months');
    for ($i = 0; $i < 6; $i++) {
        $m = $date->format('Y-m');
        $stmtEvo = $conn->prepare("SELECT SUM(CASE WHEN status = 'Pago' THEN amount ELSE 0 END) as collected, SUM(amount) as expected FROM payments WHERE referenceDate LIKE ?");
        $stmtEvo->execute(["$m%"]);
        $row = $stmtEvo->fetch();
        $evolutionData[] = ['month' => $date->format('M'), 'collected' => isset($row['collected']) ? $row['collected'] : 0, 'expected' => isset($row['expected']) ? $row['expected'] : 0];
        $date->modify('+1 month');
    }
    send_response(true, ['expectedRevenue' => $expectedRevenue, 'collectedRevenue' => $collectedRevenue, 'outstandingRevenue' => $outstandingRevenue, 'revenueByCourseData' => $revenueByCourseData, 'evolutionData' => $evolutionData]);
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