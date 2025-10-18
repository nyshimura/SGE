<?php
// Função antiga mantida caso seja usada em outro fluxo, mas não pelo modal principal
function handle_enroll($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];

    $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?");
    $stmt->execute([$studentId, $courseId]);
    $existingEnrollment = $stmt->fetch();

    if ($existingEnrollment) {
        if ($existingEnrollment['status'] === 'Pendente' || $existingEnrollment['status'] === 'Aprovada') {
            send_response(false, 'Você já possui uma matrícula ativa ou pendente para este curso.', 409);
        }
        elseif ($existingEnrollment['status'] === 'Cancelada') {
            $updateStmt = $conn->prepare("UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL, contractAcceptedAt = NULL, termsAcceptedAt = NULL WHERE studentId = ? AND courseId = ?");
            $updateStmt->execute([$studentId, $courseId]);
            send_response(true, ['message' => 'Sua matrícula cancelada foi reaberta e está aguardando aprovação. Complete os dados se necessário.']);
        }
    } else {
        $insertStmt = $conn->prepare("INSERT INTO enrollments (studentId, courseId, status) VALUES (?, ?, 'Pendente')");
        $insertStmt->execute([$studentId, $courseId]);
        send_response(true, ['message' => 'Solicitação de matrícula inicial criada. Complete os dados e aceite os termos.']);
    }
}


// Função para submeter a matrícula com dados do responsável e aceite de termos
function handle_submit_enrollment($conn, $data) {
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0;
    $courseId = isset($data['courseId']) ? filter_var($data['courseId'], FILTER_VALIDATE_INT) : 0;
    $enrollmentData = $data['enrollmentData'] ?? [];

    if ($studentId === false || $studentId <= 0 || $courseId === false || $courseId <= 0) { send_response(false, 'Dados de matrícula inválidos (IDs).', 400); }
    if (empty($enrollmentData['aluno_rg']) || empty($enrollmentData['aluno_cpf'])) { send_response(false, 'RG e CPF do aluno são obrigatórios.', 400); }
    $isMinorFlow = !empty($enrollmentData['guardianName']);
    if ($isMinorFlow && ( empty($enrollmentData['guardianName']) || empty($enrollmentData['guardianRG']) || empty($enrollmentData['guardianCPF']) || empty($enrollmentData['guardianEmail']) || empty($enrollmentData['guardianPhone']) )) { send_response(false, 'Todos os dados do responsável são obrigatórios para menores de idade.', 400); }
    if (empty($enrollmentData['acceptContract'])) { send_response(false, 'É necessário aceitar o Contrato de Prestação de Serviços.', 400); }

    $conn->beginTransaction();
    try {
        // 1. Atualiza usuário
        $fieldsToUpdate = ['rg = :rg', 'cpf = :cpf'];
        $params = [ ':rg' => $enrollmentData['aluno_rg'], ':cpf' => $enrollmentData['aluno_cpf'], ':studentId' => $studentId ];
        if ($isMinorFlow) {
            $fieldsToUpdate = array_merge($fieldsToUpdate, [ 'guardianName = :guardianName', 'guardianRG = :guardianRG', 'guardianCPF = :guardianCPF', 'guardianEmail = :guardianEmail', 'guardianPhone = :guardianPhone' ]);
            $params[':guardianName'] = $enrollmentData['guardianName']; $params[':guardianRG'] = $enrollmentData['guardianRG']; $params[':guardianCPF'] = $enrollmentData['guardianCPF']; $params[':guardianEmail'] = $enrollmentData['guardianEmail']; $params[':guardianPhone'] = $enrollmentData['guardianPhone'];
        }
        $updateUserSql = "UPDATE users SET " . implode(', ', $fieldsToUpdate) . " WHERE id = :studentId";
        $stmtUser = $conn->prepare($updateUserSql); $stmtUser->execute($params);

        // 2. Verifica matrícula existente
        $stmtCheck = $conn->prepare("SELECT status FROM enrollments WHERE studentId = ? AND courseId = ?");
        $stmtCheck->execute([$studentId, $courseId]);
        $existingEnrollment = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        $now = date('Y-m-d H:i:s');
        $contractAcceptedAt = !empty($enrollmentData['acceptContract']) ? $now : null;
        $termsAcceptedAt = !empty($enrollmentData['acceptImageTerms']) ? $now : null;
        $message = '';

        if ($existingEnrollment) {
            if ($existingEnrollment['status'] === 'Aprovada' || $existingEnrollment['status'] === 'Pendente') {
                 $message = 'Seus dados foram atualizados. Sua matrícula continua ' . strtolower($existingEnrollment['status']) . '.';
            } elseif ($existingEnrollment['status'] === 'Cancelada') {
                $updateEnrollStmt = $conn->prepare("UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL, contractAcceptedAt = ?, termsAcceptedAt = ? WHERE studentId = ? AND courseId = ?");
                $updateEnrollStmt->execute([$contractAcceptedAt, $termsAcceptedAt, $studentId, $courseId]);
                $message = 'Sua matrícula neste curso foi reativada e está aguardando aprovação.';
            }
        } else {
            $insertEnrollStmt = $conn->prepare("INSERT INTO enrollments (studentId, courseId, status, contractAcceptedAt, termsAcceptedAt) VALUES (?, ?, 'Pendente', ?, ?)");
            $insertEnrollStmt->execute([$studentId, $courseId, $contractAcceptedAt, $termsAcceptedAt]);
            $message = 'Solicitação de matrícula enviada com sucesso e aguardando aprovação.';
        }

        $conn->commit();
        send_response(true, ['message' => $message]);

    } catch (Exception $e) {
        $conn->rollBack(); error_log("Erro em handle_submit_enrollment: " . $e->getMessage()); send_response(false, 'Erro ao processar matrícula: ' . $e->getMessage(), 500);
    }
}

// --- APROVAÇÃO DE MATRÍCULA E GERAÇÃO INICIAL DE PAGAMENTOS ---
function handle_approve_enrollment($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];
    $billingStartChoice = $data['billingStartChoice']; // 'this_month' or 'next_month'
    $overrideFee = isset($data['overrideFee']) && is_numeric($data['overrideFee']) ? (float)$data['overrideFee'] : null;

    $conn->beginTransaction();
    try {
        // Define a data de início da cobrança
        $billingDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); // Use timezone local
        if ($billingStartChoice === 'next_month') {
            $billingDate->modify('first day of next month');
        } else {
            $billingDate->modify('first day of this month');
        }
        $billingStartDate = $billingDate->format('Y-m-d'); // Formato YYYY-MM-DD

        // Atualiza a matrícula para Aprovada e salva a data de início da cobrança e taxa personalizada
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada', billingStartDate = ?, customMonthlyFee = ? WHERE studentId = ? AND courseId = ? AND status = 'Pendente'");
        $stmt->execute([$billingStartDate, $overrideFee, $studentId, $courseId]);

        // Verifica se realmente atualizou (evita gerar pagamentos duplicados)
        if ($stmt->rowCount() == 0) {
             $conn->rollBack();
             $checkStmt = $conn->prepare("SELECT status FROM enrollments WHERE studentId = ? AND courseId = ?");
             $checkStmt->execute([$studentId, $courseId]);
             $currentStatus = $checkStmt->fetchColumn();
             if ($currentStatus === 'Aprovada') { send_response(true, ['message' => 'Esta matrícula já estava aprovada.']); }
             else { throw new Exception('Matrícula não encontrada ou não estava pendente.'); }
             return;
        }

        // Busca detalhes DO CURSO e DA MATRÍCULA para calcular valor e número de parcelas
        $stmtDetails = $conn->prepare("
            SELECT c.monthlyFee, c.paymentType, c.installments, e.customMonthlyFee, e.scholarshipPercentage
            FROM courses c JOIN enrollments e ON c.id = e.courseId
            WHERE e.studentId = ? AND e.courseId = ?
        ");
        $stmtDetails->execute([$studentId, $courseId]);
        $details = $stmtDetails->fetch();

        // Busca o dia de vencimento padrão
        $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1");
        $settings = $stmtSettings->fetch();
        $dueDay = isset($settings['defaultDueDay']) ? (int)$settings['defaultDueDay'] : 10;
        $dueDay = max(1, min(28, $dueDay)); // Garante 1-28

        // Gera pagamentos apenas se houver valor a cobrar
        if ($details && ($details['monthlyFee'] > 0 || $details['customMonthlyFee'] !== null) && ($details['scholarshipPercentage'] === null || $details['scholarshipPercentage'] < 100)) {

            $baseAmount = $details['customMonthlyFee'] !== null ? $details['customMonthlyFee'] : $details['monthlyFee'];
            $scholarshipPercentage = $details['scholarshipPercentage'] ?? 0;
            $finalAmount = round($baseAmount * (1 - ($scholarshipPercentage / 100)), 2);

            if ($finalAmount > 0) {
                $limit = 0; // Número de pagamentos a gerar

                // ***** LÓGICA DE CÁLCULO DO LIMITE CORRIGIDA *****
                if ($details['paymentType'] === 'parcelado' && !empty($details['installments']) && $details['installments'] > 0) {
                    // Para parcelado, o limite é o número de parcelas definido no curso
                    $limit = (int)$details['installments'];
                    error_log("Gerando $limit pagamentos (Parcelado) para Matrícula: Aluno $studentId, Curso $courseId");
                } else {
                    // Para recorrente, o limite é sempre 12 (um ano de pagamentos)
                    $limit = 12;
                    error_log("Gerando $limit pagamentos (Recorrente) para Matrícula: Aluno $studentId, Curso $courseId");
                }
                // ***** FIM DA CORREÇÃO *****

                $cursorDate = clone $billingDate; // Usa a data de início de cobrança definida
                for ($i = 0; $i < $limit; $i++) {
                    $refDate = $cursorDate->format('Y-m-01'); // Mês de referência
                    $lastDayOfMonth = (int)$cursorDate->format('t');
                    $actualDueDay = min($dueDay, $lastDayOfMonth); // Dia de vencimento real
                    $dueDate = $cursorDate->format('Y-m-') . str_pad($actualDueDay, 2, '0', STR_PAD_LEFT); // Data de vencimento

                    // Insere o pagamento
                    $stmtInsertPayment = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                    $stmtInsertPayment->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]);

                    $cursorDate->modify('+1 month'); // Avança para o próximo mês
                }
            } else {
                 error_log("Valor final do pagamento é zero ou negativo após bolsa/taxa. Nenhum pagamento gerado para Aluno $studentId, Curso $courseId.");
            }
        } else {
             error_log("Sem valor base (mensalidade/taxa) ou bolsa de 100%. Nenhum pagamento gerado para Aluno $studentId, Curso $courseId.");
        }

        $conn->commit();
        send_response(true, ['message' => 'Matrícula aprovada e pagamentos gerados com sucesso.']);

    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Erro ao aprovar matrícula para Aluno $studentId, Curso $courseId: " . $e->getMessage());
        send_response(false, 'Erro ao aprovar matrícula: ' . $e->getMessage(), 500);
    }
}


function handle_cancel_enrollment($conn, $data) {
    // ... (código existente, sem alterações necessárias para esta correção) ...
     $studentId = isset($data['studentId']) ? (int)$data['studentId'] : null; $courseId = isset($data['courseId']) ? (int)$data['courseId'] : null; if (!$studentId || !$courseId) { send_response(false, 'ID do aluno e do curso são obrigatórios.', 400); }
    $conn->beginTransaction(); try { $stmt = $conn->prepare("UPDATE enrollments SET status = 'Cancelada' WHERE studentId = ? AND courseId = ? AND status = 'Aprovada'"); $stmt->execute([$studentId, $courseId]); if ($stmt->rowCount() == 0) { throw new Exception('Nenhuma matrícula aprovada encontrada para cancelar.'); }
    $settingsStmt = $conn->query("SELECT enableTerminationFine, terminationFineMonths FROM system_settings WHERE id = 1"); $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC); $fineEnabled = isset($settings['enableTerminationFine']) && $settings['enableTerminationFine'] == 1; $fineMonths = isset($settings['terminationFineMonths']) ? (int)$settings['terminationFineMonths'] : 0; $message = 'Matrícula trancada.';
    $paymentsStmt = $conn->prepare("SELECT id FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado') ORDER BY dueDate ASC"); $paymentsStmt->execute([$studentId, $courseId]); $futurePayments = $paymentsStmt->fetchAll(PDO::FETCH_COLUMN); $paymentsToCancelIds = [];
    if (count($futurePayments) > 0) { if ($fineEnabled && $fineMonths > 0) { $paymentsToCancelIds = array_slice($futurePayments, $fineMonths); $keptCount = count($futurePayments) - count($paymentsToCancelIds); if ($keptCount > 0) $message .= " Multa rescisória de {$keptCount} mensalidade(s) mantida."; if (!empty($paymentsToCancelIds)) $message .= " Demais pagamentos futuros cancelados."; } else { $paymentsToCancelIds = $futurePayments; $message .= ' Pagamentos futuros pendentes cancelados.'; } if (!empty($paymentsToCancelIds)) { $placeholders = implode(',', array_fill(0, count($paymentsToCancelIds), '?')); $cancelSql = "UPDATE payments SET status = 'Cancelado', paymentDate = NULL WHERE id IN ($placeholders)"; $cancelStmt = $conn->prepare($cancelSql); $cancelStmt->execute($paymentsToCancelIds); } } else { $message .= ' Não havia pagamentos futuros pendentes.'; }
    $conn->commit(); send_response(true, ['message' => $message]); } catch (Exception $e) { $conn->rollBack(); error_log("Erro ao trancar matrícula: " . $e->getMessage()); send_response(false, 'Erro ao trancar matrícula: ' . $e->getMessage(), 500); }
}

function handle_reactivate_enrollment($conn, $data) {
    // ... (código existente, sem alterações necessárias para esta correção) ...
     $studentId = isset($data['studentId']) ? (int)$data['studentId'] : null; $courseId = isset($data['courseId']) ? (int)$data['courseId'] : null; if (!$studentId || !$courseId) { send_response(false, 'ID do aluno e do curso obrigatórios.', 400); }
    $conn->beginTransaction(); try { $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada' WHERE studentId = ? AND courseId = ? AND status = 'Cancelada'"); $stmt->execute([$studentId, $courseId]); if ($stmt->rowCount() == 0) { throw new Exception('Nenhuma matrícula cancelada encontrada.'); }
    $paymentsStmt = $conn->prepare("SELECT id, dueDate FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Cancelado'"); $paymentsStmt->execute([$studentId, $courseId]); $cancelledPayments = $paymentsStmt->fetchAll(PDO::FETCH_ASSOC); $today = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); $today->setTime(0,0,0);
    foreach ($cancelledPayments as $payment) { $dueDate = new DateTime($payment['dueDate'], new DateTimeZone('America/Sao_Paulo')); $dueDate->setTime(0,0,0); $newStatus = ($dueDate < $today) ? 'Atrasado' : 'Pendente'; $updatePaymentStmt = $conn->prepare("UPDATE payments SET status = ? WHERE id = ?"); $updatePaymentStmt->execute([$newStatus, $payment['id']]); }
    $conn->commit(); send_response(true, ['message' => 'Matrícula reativada. Pagamentos restaurados.']); } catch (Exception $e) { $conn->rollBack(); error_log("Erro ao reativar matrícula: " . $e->getMessage()); send_response(false, 'Erro ao reativar matrícula: ' . $e->getMessage(), 500); }
}

function handle_update_enrollment_details($conn, $data) {
    // ... (código existente, a lógica de regerar pagamentos aqui já considera o limite correto) ...
    $studentId = filter_var($data['studentId'], FILTER_VALIDATE_INT); $courseId = filter_var($data['courseId'], FILTER_VALIDATE_INT);
    $scholarship = isset($data['scholarshipPercentage']) && is_numeric($data['scholarshipPercentage']) ? (float)$data['scholarshipPercentage'] : 0.0; if ($scholarship < 0 || $scholarship > 100) $scholarship = 0.0;
    $customFee = isset($data['customMonthlyFee']) && $data['customMonthlyFee'] !== '' && is_numeric($data['customMonthlyFee']) && (float)$data['customMonthlyFee'] >= 0 ? (float)$data['customMonthlyFee'] : null;
    if ($studentId === false || $courseId === false) { send_response(false, 'IDs inválidos.', 400); }

    $conn->beginTransaction(); try {
    $updateStmt = $conn->prepare("UPDATE enrollments SET scholarshipPercentage = ?, customMonthlyFee = ? WHERE studentId = ? AND courseId = ?"); $updateStmt->execute([$scholarship, $customFee, $studentId, $courseId]);
    $deleteStmt = $conn->prepare("DELETE FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado')"); $deleteStmt->execute([$studentId, $courseId]);
    $stmtDetails = $conn->prepare("SELECT c.monthlyFee, c.paymentType, c.installments, e.billingStartDate FROM courses c JOIN enrollments e ON c.id = e.courseId WHERE e.studentId = ? AND e.courseId = ? AND e.status = 'Aprovada'"); $stmtDetails->execute([$studentId, $courseId]); $details = $stmtDetails->fetch();
    if ($details) { $dueDay = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1")->fetchColumn() ?? 10; $dueDay = max(1, min(28, (int)$dueDay));
    if ($scholarship < 100) { $baseAmount = $customFee !== null ? $customFee : ($details['monthlyFee'] ?? 0); $finalAmount = round($baseAmount * (1 - ($scholarship / 100)), 2);
    if ($finalAmount > 0) { $lastPaidStmt = $conn->prepare("SELECT MAX(referenceDate) as lastDate FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Pago'"); $lastPaidStmt->execute([$studentId, $courseId]); $lastPaidDateStr = $lastPaidStmt->fetchColumn(); $startDate = null;
    if ($lastPaidDateStr) { $startDate = new DateTime($lastPaidDateStr, new DateTimeZone('America/Sao_Paulo')); $startDate->modify('first day of next month'); } elseif ($details['billingStartDate']) { $startDate = new DateTime($details['billingStartDate'], new DateTimeZone('America/Sao_Paulo')); $startDate->modify('first day of this month'); $nowDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); if ($startDate < $nowDate) { $startDate = $nowDate; $startDate->modify('first day of this month'); } }
    if ($startDate) { $paidCountStmt = $conn->prepare("SELECT COUNT(id) FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Pago'"); $paidCountStmt->execute([$studentId, $courseId]); $paymentsMadeCount = $paidCountStmt->fetchColumn(); $limit = 0;
    if ($details['paymentType'] === 'parcelado' && !empty($details['installments']) && $details['installments'] > 0) { $remaining = (int)$details['installments'] - $paymentsMadeCount; $limit = max(0, $remaining); } else { $limit = 12; } // Gera 12 para recorrente
    $cursorDate = clone $startDate; for ($i = 0; $i < $limit; $i++) { $refDate = $cursorDate->format('Y-m-01'); $lastDay = (int)$cursorDate->format('t'); $actualDue = min($dueDay, $lastDay); $dueDate = $cursorDate->format('Y-m-') . str_pad($actualDue, 2, '0', STR_PAD_LEFT); $insertStmt = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')"); $insertStmt->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]); $cursorDate->modify('+1 month'); } } else { error_log("Falha ao determinar startDate para $studentId, $courseId"); } } } }
    $conn->commit(); send_response(true, ['message' => 'Detalhes atualizados. Pagamentos recalculados.']); } catch (Exception $e) { $conn->rollBack(); error_log("Erro updateEnrollmentDetails: " . $e->getMessage()); send_response(false, 'Erro ao atualizar: ' . $e->getMessage(), 500); }
}


// --- REMATRÍCULA AUTOMÁTICA ---
function handle_submit_reenrollment($conn, $data) {
    // ... (código existente, já calcula o limite corretamente como 12 para recorrente) ...
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0; $courseId = isset($data['courseId']) ? filter_var($data['courseId'], FILTER_VALIDATE_INT) : 0; $enrollmentData = $data['enrollmentData'] ?? [];
    if ($studentId <= 0 || $courseId <= 0) { send_response(false, 'IDs inválidos.', 400); } if (empty($enrollmentData['acceptContract'])) { send_response(false, 'Aceite o Contrato.', 400); }
    $conn->beginTransaction(); try {
    $stmtCheck = $conn->prepare("SELECT id FROM enrollments WHERE studentId = ? AND courseId = ? AND status = 'Aprovada'"); $stmtCheck->execute([$studentId, $courseId]); $enrollmentId = $stmtCheck->fetchColumn(); if (!$enrollmentId) { throw new Exception('Matrícula não ativa.'); }
    $now = date('Y-m-d H:i:s'); $contractAcceptedAt = $now; $termsAcceptedAt = !empty($enrollmentData['acceptImageTerms']) ? $now : null;
    $updateEnrollStmt = $conn->prepare("UPDATE enrollments SET contractAcceptedAt = ?, termsAcceptedAt = ? WHERE id = ?"); $updateEnrollStmt->execute([$contractAcceptedAt, $termsAcceptedAt, $enrollmentId]);
    $deleteStmt = $conn->prepare("DELETE FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado')"); $deleteStmt->execute([$studentId, $courseId]); $deletedCount = $deleteStmt->rowCount();
    $stmtDetails = $conn->prepare("SELECT c.monthlyFee, c.paymentType, c.installments, e.customMonthlyFee, e.scholarshipPercentage FROM courses c JOIN enrollments e ON c.id = e.courseId WHERE e.id = ?"); $stmtDetails->execute([$enrollmentId]); $details = $stmtDetails->fetch();
    $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1"); $settings = $stmtSettings->fetch(); $dueDay = isset($settings['defaultDueDay']) ? max(1, min(28,(int)$settings['defaultDueDay'])) : 10;
    $generatedCount = 0;
    if ($details && ($details['monthlyFee'] > 0 || $details['customMonthlyFee'] !== null) && ($details['scholarshipPercentage'] === null || $details['scholarshipPercentage'] < 100)) {
        $baseAmount = $details['customMonthlyFee'] !== null ? $details['customMonthlyFee'] : $details['monthlyFee']; $scholarshipPercentage = $details['scholarshipPercentage'] ?? 0; $finalAmount = round($baseAmount * (1 - ($scholarshipPercentage / 100)), 2);
    if ($finalAmount > 0) { $lastPaymentStmt = $conn->prepare("SELECT MAX(referenceDate) as lastDate FROM payments WHERE studentId = ? AND courseId = ?"); $lastPaymentStmt->execute([$studentId, $courseId]); $lastPaymentDateStr = $lastPaymentStmt->fetchColumn(); $startDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
    if ($lastPaymentDateStr) { $startDate = new DateTime($lastPaymentDateStr, new DateTimeZone('America/Sao_Paulo')); $startDate->modify('first day of next month'); } else { $billingStartStmt = $conn->prepare("SELECT billingStartDate FROM enrollments WHERE id = ?"); $billingStartStmt->execute([$enrollmentId]); $billingStartDate = $billingStartStmt->fetchColumn(); if ($billingStartDate) { $startDate = new DateTime($billingStartDate, new DateTimeZone('America/Sao_Paulo')); $startDate->modify('first day of this month'); $nowDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); if ($startDate < $nowDate) { $startDate = $nowDate; $startDate->modify('first day of this month'); } } else { $startDate->modify('first day of this month'); } }
    $limit = 0;
    if ($details['paymentType'] === 'parcelado' && !empty($details['installments']) && $details['installments'] > 0) { $paidCountStmt = $conn->prepare("SELECT COUNT(id) FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Pago'"); $paidCountStmt->execute([$studentId, $courseId]); $paidCount = $paidCountStmt->fetchColumn(); $limit = max(0, (int)$details['installments'] - $paidCount); } else { $limit = 12; } // 12 para recorrente
    $cursorDate = clone $startDate; for ($i = 0; $i < $limit; $i++) { $refDate = $cursorDate->format('Y-m-01'); $lastDay = (int)$cursorDate->format('t'); $actualDue = min($dueDay, $lastDay); $dueDate = $cursorDate->format('Y-m-') . str_pad($actualDue, 2, '0', STR_PAD_LEFT); $insertStmt = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')"); $insertStmt->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]); $generatedCount++; $cursorDate->modify('+1 month'); } } }
    $conn->commit(); send_response(true, [ 'message' => "Rematrícula confirmada! " . ($generatedCount > 0 ? "$generatedCount pagamentos gerados." : "Nenhum pagamento gerado.") . ($deletedCount > 0 ? " $deletedCount pagamentos anteriores removidos." : "") ]);
    } catch (Exception $e) { $conn->rollBack(); error_log("Erro submitReenrollment: " . $e->getMessage()); send_response(false, 'Erro rematrícula: ' . $e->getMessage(), 500); }
}

?>
