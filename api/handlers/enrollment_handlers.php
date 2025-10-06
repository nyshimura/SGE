<?php
function handle_enroll($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];

    $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?");
    $stmt->execute([$studentId, $courseId]);
    $existingEnrollment = $stmt->fetch();

    if ($existingEnrollment) {
        if ($existingEnrollment['status'] === 'Pendente' || $existingEnrollment['status'] === 'Aprovada') {
            send_response(false, 'Você já possui uma matrícula ativa ou pendente para este curso.', 409);
        } elseif ($existingEnrollment['status'] === 'Cancelada') {
            $updateStmt = $conn->prepare("UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL WHERE studentId = ? AND courseId = ?");
            $updateStmt->execute([$studentId, $courseId]);
            send_response(true, ['message' => 'Sua matrícula neste curso foi reativada e está aguardando aprovação.']);
        }
    } else {
        $insertStmt = $conn->prepare("INSERT INTO enrollments (studentId, courseId, status) VALUES (?, ?, 'Pendente')");
        $insertStmt->execute([$studentId, $courseId]);
        send_response(true, ['message' => 'Solicitação de matrícula enviada.']);
    }
}

function handle_approve_enrollment($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];
    $billingStartChoice = $data['billingStartChoice'];
    $conn->beginTransaction();
    try {
        $billingDate = new DateTime('now', new DateTimeZone('UTC'));
        if ($billingStartChoice === 'next_month') {
            $billingDate->modify('first day of next month');
        } else {
            $billingDate->modify('first day of this month');
        }
        $billingStartDate = $billingDate->format('Y-m-d');
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada', billingStartDate = ? WHERE studentId = ? AND courseId = ?");
        $stmt->execute([$billingStartDate, $studentId, $courseId]);
        $stmtCourse = $conn->prepare("SELECT monthlyFee, paymentType, installments FROM courses WHERE id = ?");
        $stmtCourse->execute([$courseId]);
        $course = $stmtCourse->fetch();
        $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1");
        $settings = $stmtSettings->fetch();
        $dueDay = isset($settings['defaultDueDay']) ? $settings['defaultDueDay'] : 10;
        if ($course && $course['monthlyFee'] > 0) {
            $limit = 0;
            if ($course['paymentType'] === 'parcelado' && $course['installments'] > 0) {
                $limit = (int)$course['installments'];
            } else {
                $startMonth = (int)$billingDate->format('m');
                $limit = 12 - $startMonth + 1;
            }
            $cursorDate = new DateTime($billingStartDate, new DateTimeZone('UTC'));
            for ($i = 0; $i < $limit; $i++) {
                $refDate = $cursorDate->format('Y-m-01');
                $dueDate = $cursorDate->format('Y-m-') . str_pad($dueDay, 2, '0', STR_PAD_LEFT);
                $stmtInsertPayment = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                $stmtInsertPayment->execute([$studentId, $courseId, $course['monthlyFee'], $refDate, $dueDate]);
                $cursorDate->modify('+1 month');
            }
        }
        $conn->commit();
        send_response(true, ['message' => 'Matrícula aprovada e pagamentos gerados.']);
    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao aprovar matrícula: ' . $e->getMessage(), 500);
    }
}

function handle_cancel_enrollment($conn, $data) {
    $studentId = isset($data['studentId']) ? (int)$data['studentId'] : null;
    $courseId = isset($data['courseId']) ? (int)$data['courseId'] : null;
    if (!$studentId || !$courseId) {
        send_response(false, 'ID do aluno e do curso são obrigatórios.', 400);
    }
    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Cancelada' WHERE studentId = ? AND courseId = ? AND status = 'Aprovada'");
        $stmt->execute([$studentId, $courseId]);
        if ($stmt->rowCount() == 0) {
             throw new Exception('Nenhuma matrícula aprovada encontrada para este aluno/curso.');
        }
        $settingsStmt = $conn->query("SELECT enableTerminationFine, terminationFineMonths FROM system_settings WHERE id = 1");
        $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC);
        $fineEnabled = isset($settings['enableTerminationFine']) && $settings['enableTerminationFine'] == 1;
        $fineMonths = isset($settings['terminationFineMonths']) ? (int)$settings['terminationFineMonths'] : 0;
        $message = 'Matrícula trancada. Todos os pagamentos futuros foram cancelados.';
        $paymentsStmt = $conn->prepare("SELECT id FROM payments WHERE studentId = ? AND courseId = ? AND (status = 'Pendente' OR status = 'Atrasado') ORDER BY dueDate ASC");
        $paymentsStmt->execute([$studentId, $courseId]);
        $futurePayments = $paymentsStmt->fetchAll(PDO::FETCH_COLUMN);
        if (count($futurePayments) > 0) {
            if ($fineEnabled && $fineMonths > 0) {
                $paymentsToCancel = array_slice($futurePayments, $fineMonths);
                if (count($paymentsToCancel) > 0) {
                    $cancelSql = "UPDATE payments SET status = 'Cancelado' WHERE id IN (" . implode(',', array_fill(0, count($paymentsToCancel), '?')) . ")";
                    $cancelStmt = $conn->prepare($cancelSql);
                    $cancelStmt->execute($paymentsToCancel);
                }
                $message = "Matrícula trancada. Uma multa rescisória de {$fineMonths} mensalidade(s) foi mantida. Os demais pagamentos foram cancelados.";
            } else {
                $cancelSql = "UPDATE payments SET status = 'Cancelado' WHERE id IN (" . implode(',', array_fill(0, count($futurePayments), '?')) . ")";
                $cancelStmt = $conn->prepare($cancelSql);
                $cancelStmt->execute($futurePayments);
            }
        }
        $conn->commit();
        send_response(true, ['message' => $message]);
    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao trancar matrícula: ' . $e->getMessage(), 500);
    }
}

function handle_reactivate_enrollment($conn, $data) {
    $studentId = isset($data['studentId']) ? (int)$data['studentId'] : null;
    $courseId = isset($data['courseId']) ? (int)$data['courseId'] : null;
    if (!$studentId || !$courseId) {
        send_response(false, 'ID do aluno e do curso são obrigatórios.', 400);
    }
    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada' WHERE studentId = ? AND courseId = ? AND status = 'Cancelada'");
        $stmt->execute([$studentId, $courseId]);
        if ($stmt->rowCount() == 0) {
            throw new Exception('Nenhuma matrícula cancelada encontrada para reativar.');
        }
        $paymentsStmt = $conn->prepare("SELECT id, dueDate FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Cancelado'");
        $paymentsStmt->execute([$studentId, $courseId]);
        $cancelledPayments = $paymentsStmt->fetchAll(PDO::FETCH_ASSOC);
        $today = new DateTime('now', new DateTimeZone('UTC'));
        foreach ($cancelledPayments as $payment) {
            $dueDate = new DateTime($payment['dueDate'], new DateTimeZone('UTC'));
            $newStatus = ($dueDate < $today) ? 'Atrasado' : 'Pendente';
            $updatePaymentStmt = $conn->prepare("UPDATE payments SET status = ? WHERE id = ?");
            $updatePaymentStmt->execute([$newStatus, $payment['id']]);
        }
        $conn->commit();
        send_response(true, ['message' => 'Matrícula reativada com sucesso. Os pagamentos foram restaurados.']);
    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao reativar matrícula: ' . $e->getMessage(), 500);
    }
}
?>