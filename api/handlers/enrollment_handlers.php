<?php
// <<< FUNÇÃO ANTIGA RESTAURADA AQUI >>>
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
            // Esta é a lógica que precisamos restaurar:
            $updateStmt = $conn->prepare("UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL, contractAcceptedAt = NULL, termsAcceptedAt = NULL WHERE studentId = ? AND courseId = ?");
            $updateStmt->execute([$studentId, $courseId]);
            send_response(true, ['message' => 'Sua matrícula neste curso foi reativada e está aguardando aprovação.']);
        }
    } else {
        $insertStmt = $conn->prepare("INSERT INTO enrollments (studentId, courseId, status) VALUES (?, ?, 'Pendente')");
        $insertStmt->execute([$studentId, $courseId]);
        send_response(true, ['message' => 'Solicitação de matrícula enviada.']);
    }
}

// Função para submeter a matrícula com dados do responsável e aceite de termos
function handle_submit_enrollment($conn, $data) {
    $studentId = $data['studentId'] ?? 0;
    $courseId = $data['courseId'] ?? 0;
    $enrollmentData = $data['enrollmentData'] ?? [];

    if ($studentId <= 0 || $courseId <= 0) {
        send_response(false, 'Dados de matrícula inválidos.', 400);
    }

    $conn->beginTransaction();
    try {
        // 1. Atualiza os dados do responsável e do aluno (RG/CPF) na tabela de usuários
        if (!empty($enrollmentData['guardianName'])) {
            $updateUserSql = "UPDATE users SET 
                                rg = :rg, cpf = :cpf, 
                                guardianName = :guardianName, guardianRG = :guardianRG, guardianCPF = :guardianCPF,
                                guardianEmail = :guardianEmail, guardianPhone = :guardianPhone
                              WHERE id = :studentId";
            $stmtUser = $conn->prepare($updateUserSql);
            $stmtUser->execute([
                ':rg' => $enrollmentData['aluno_rg'] ?? null,
                ':cpf' => $enrollmentData['aluno_cpf'] ?? null,
                ':guardianName' => $enrollmentData['guardianName'],
                ':guardianRG' => $enrollmentData['guardianRG'],
                ':guardianCPF' => $enrollmentData['guardianCPF'],
                ':guardianEmail' => $enrollmentData['guardianEmail'],
                ':guardianPhone' => $enrollmentData['guardianPhone'],
                ':studentId' => $studentId
            ]);
        } else {
            $updateUserSql = "UPDATE users SET rg = :rg, cpf = :cpf WHERE id = :studentId";
            $stmtUser = $conn->prepare($updateUserSql);
            $stmtUser->execute([
                ':rg' => $enrollmentData['aluno_rg'] ?? null,
                ':cpf' => $enrollmentData['aluno_cpf'] ?? null,
                ':studentId' => $studentId
            ]);
        }

        // 2. Verifica se já existe matrícula
        $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?");
        $stmt->execute([$studentId, $courseId]);
        $existingEnrollment = $stmt->fetch();

        $now = date('Y-m-d H:i:s');
        $contractAcceptedAt = !empty($enrollmentData['acceptContract']) ? $now : null;
        $termsAcceptedAt = !empty($enrollmentData['acceptImageTerms']) ? $now : null;

        if ($existingEnrollment) {
             $updateStmt = $conn->prepare("
                UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL, 
                       contractAcceptedAt = ?, termsAcceptedAt = ? 
                WHERE studentId = ? AND courseId = ?
            ");
            $updateStmt->execute([$contractAcceptedAt, $termsAcceptedAt, $studentId, $courseId]);
            $message = 'Sua matrícula neste curso foi reativada e está aguardando aprovação.';
        } else {
            $insertStmt = $conn->prepare("
                INSERT INTO enrollments (studentId, courseId, status, contractAcceptedAt, termsAcceptedAt) 
                VALUES (?, ?, 'Pendente', ?, ?)
            ");
            $insertStmt->execute([$studentId, $courseId, $contractAcceptedAt, $termsAcceptedAt]);
            $message = 'Solicitação de matrícula enviada.';
        }

        $conn->commit();
        send_response(true, ['message' => $message]);

    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao processar matrícula: ' . $e->getMessage(), 500);
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
        
        $stmtCourse = $conn->prepare("SELECT c.monthlyFee, c.paymentType, c.installments, e.customMonthlyFee, e.scholarshipPercentage 
                                      FROM courses c JOIN enrollments e ON c.id = e.courseId 
                                      WHERE e.studentId = ? AND e.courseId = ?");
        $stmtCourse->execute([$studentId, $courseId]);
        $details = $stmtCourse->fetch();
        
        $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1");
        $settings = $stmtSettings->fetch();
        $dueDay = isset($settings['defaultDueDay']) ? $settings['defaultDueDay'] : 10;
        
        if ($details && ($details['monthlyFee'] > 0 || $details['customMonthlyFee'] > 0) && $details['scholarshipPercentage'] < 100) {
            $baseAmount = $details['customMonthlyFee'] !== null ? $details['customMonthlyFee'] : $details['monthlyFee'];
            $finalAmount = round($baseAmount * (1 - ($details['scholarshipPercentage'] / 100)), 2);

            if ($finalAmount > 0) {
                $limit = 0;
                $currentYear = $billingDate->format('Y');

                if ($details['paymentType'] === 'parcelado' && $details['installments'] > 0) {
                    $limit = (int)$details['installments'];
                } else { // Recorrente
                    $endOfYear = new DateTime("{$currentYear}-12-31");
                    $interval = $billingDate->diff($endOfYear);
                    $limit = $interval->m + ($interval->d >= 0 ? 1 : 0);
                }

                $cursorDate = new DateTime($billingStartDate, new DateTimeZone('UTC'));
                for ($i = 0; $i < $limit; $i++) {
                    $refDate = $cursorDate->format('Y-m-01');
                    $dueDate = $cursorDate->format('Y-m-') . str_pad($dueDay, 2, '0', STR_PAD_LEFT);
                    $stmtInsertPayment = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                    $stmtInsertPayment->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]);
                    $cursorDate->modify('+1 month');
                }
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

function handle_update_enrollment_details($conn, $data) {
    $studentId = filter_var($data['studentId'], FILTER_VALIDATE_INT);
    $courseId = filter_var($data['courseId'], FILTER_VALIDATE_INT);
    $scholarship = isset($data['scholarshipPercentage']) && is_numeric($data['scholarshipPercentage']) ? (float)$data['scholarshipPercentage'] : 0.0;
    if ($scholarship < 0 || $scholarship > 100) $scholarship = 0.0;
    $customFee = isset($data['customMonthlyFee']) && $data['customMonthlyFee'] !== '' && is_numeric($data['customMonthlyFee']) ? (float)$data['customMonthlyFee'] : null;

    if ($studentId === false || $courseId === false) {
        send_response(false, 'IDs de aluno/curso inválidos.', 400);
    }

    $conn->beginTransaction();
    try {
        $updateStmt = $conn->prepare("UPDATE enrollments SET scholarshipPercentage = ?, customMonthlyFee = ? WHERE studentId = ? AND courseId = ?");
        $updateStmt->execute([$scholarship, $customFee, $studentId, $courseId]);

        $deleteStmt = $conn->prepare("DELETE FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado')");
        $deleteStmt->execute([$studentId, $courseId]);

        $stmtDetails = $conn->prepare("SELECT c.monthlyFee, c.paymentType, c.installments, e.billingStartDate 
                                       FROM courses c JOIN enrollments e ON c.id = e.courseId 
                                       WHERE e.studentId = ? AND e.courseId = ?");
        $stmtDetails->execute([$studentId, $courseId]);
        $details = $stmtDetails->fetch();
        $dueDay = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1")->fetchColumn() ?? 10;

        if ($details && $scholarship < 100) {
            $baseAmount = $customFee !== null ? $customFee : $details['monthlyFee'];
            $finalAmount = round($baseAmount * (1 - ($scholarship / 100)), 2);

            if ($finalAmount > 0) {
                $lastPaymentStmt = $conn->prepare("SELECT MAX(referenceDate) as lastDate FROM payments WHERE studentId = ? AND courseId = ?");
                $lastPaymentStmt->execute([$studentId, $courseId]);
                $lastPayment = $lastPaymentStmt->fetch();

                $startDate = new DateTime('first day of this month', new DateTimeZone('UTC'));
                if ($lastPayment && $lastPayment['lastDate']) {
                    $startDate = new DateTime($lastPayment['lastDate'], new DateTimeZone('UTC'));
                    $startDate->modify('first day of next month');
                }
                
                $cursorDate = $startDate;
                
                $totalPaymentsStmt = $conn->prepare("SELECT COUNT(id) as total FROM payments WHERE studentId = ? AND courseId = ?");
                $totalPaymentsStmt->execute([$studentId, $courseId]);
                $totalPayments = $totalPaymentsStmt->fetchColumn();

                $limit = 0;
                if ($details['paymentType'] === 'parcelado' && $details['installments'] > 0) {
                    $limit = (int)$details['installments'] - $totalPayments;
                } else {
                    $currentYear = $cursorDate->format('Y');
                    $endOfYear = new DateTime("{$currentYear}-12-31", new DateTimeZone('UTC'));
                    $interval = $cursorDate->diff($endOfYear);
                    $limit = $interval->m + ($interval->d >= 0 ? 1 : 0);
                }
                
                for ($i = 0; $i < $limit; $i++) {
                    $refDate = $cursorDate->format('Y-m-01');
                    $dueDate = $cursorDate->format('Y-m-') . str_pad($dueDay, 2, '0', STR_PAD_LEFT);
                    
                    $insertStmt = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                    $insertStmt->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]);

                    $cursorDate->modify('+1 month');
                }
            }
        }
        
        $conn->commit();
        send_response(true, ['message' => 'Bolsa e mensalidade atualizadas. Pagamentos foram recalculados.']);

    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao atualizar detalhes da matrícula: ' . $e->getMessage(), 500);
    }
}
?>