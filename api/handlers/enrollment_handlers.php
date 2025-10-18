<?php
// Função antiga mantida caso seja usada em outro fluxo, mas não pelo modal principal
function handle_enroll($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];

    // Verifica se já existe uma matrícula para este aluno e curso
    $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?");
    $stmt->execute([$studentId, $courseId]);
    $existingEnrollment = $stmt->fetch();

    if ($existingEnrollment) {
        // Se já existe e está Pendente ou Aprovada, informa o usuário
        if ($existingEnrollment['status'] === 'Pendente' || $existingEnrollment['status'] === 'Aprovada') {
            send_response(false, 'Você já possui uma matrícula ativa ou pendente para este curso.', 409);
        }
        // Se existe e está Cancelada, reativa para Pendente (este fluxo pode ser redundante com submitEnrollment agora)
        elseif ($existingEnrollment['status'] === 'Cancelada') {
             // ATENÇÃO: A lógica principal de reativação agora está em handle_submit_enrollment.
             // Esta parte pode ser removida se handle_enroll não for mais chamada diretamente.
            $updateStmt = $conn->prepare("UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL, contractAcceptedAt = NULL, termsAcceptedAt = NULL WHERE studentId = ? AND courseId = ?");
            $updateStmt->execute([$studentId, $courseId]);
            send_response(true, ['message' => 'Sua matrícula cancelada foi reaberta e está aguardando aprovação. Complete os dados se necessário.']); // Mensagem ajustada
        }
    } else {
        // Se não existe matrícula, cria uma nova como Pendente
        $insertStmt = $conn->prepare("INSERT INTO enrollments (studentId, courseId, status) VALUES (?, ?, 'Pendente')");
        $insertStmt->execute([$studentId, $courseId]);
        send_response(true, ['message' => 'Solicitação de matrícula inicial criada. Complete os dados e aceite os termos.']); // Mensagem ajustada
    }
}


// --- NOVA FUNÇÃO ---
// Função para submeter a matrícula com dados do responsável e aceite de termos
function handle_submit_enrollment($conn, $data) {
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0;
    $courseId = isset($data['courseId']) ? filter_var($data['courseId'], FILTER_VALIDATE_INT) : 0;
    $enrollmentData = $data['enrollmentData'] ?? [];

    // Validações básicas
    if ($studentId === false || $studentId <= 0 || $courseId === false || $courseId <= 0) {
        send_response(false, 'Dados de matrícula inválidos (IDs).', 400);
    }
    if (empty($enrollmentData['aluno_rg']) || empty($enrollmentData['aluno_cpf'])) {
         send_response(false, 'RG e CPF do aluno são obrigatórios.', 400);
    }
     // Valida dados do responsável apenas se ele foi informado (indicando menor de idade)
    $isMinorFlow = !empty($enrollmentData['guardianName']); // Assumimos que se guardianName foi enviado, era menor
    if ($isMinorFlow && (
        empty($enrollmentData['guardianName']) || empty($enrollmentData['guardianRG']) ||
        empty($enrollmentData['guardianCPF']) || empty($enrollmentData['guardianEmail']) ||
        empty($enrollmentData['guardianPhone']) ))
    {
        send_response(false, 'Todos os dados do responsável são obrigatórios para menores de idade.', 400);
    }
     if (empty($enrollmentData['acceptContract'])) {
        send_response(false, 'É necessário aceitar o Contrato de Prestação de Serviços.', 400);
    }


    $conn->beginTransaction();
    try {
        // 1. Atualiza os dados do aluno (RG/CPF) e do responsável (se houver) na tabela de usuários
        $fieldsToUpdate = ['rg = :rg', 'cpf = :cpf'];
        $params = [
            ':rg' => $enrollmentData['aluno_rg'],
            ':cpf' => $enrollmentData['aluno_cpf'],
            ':studentId' => $studentId
        ];

        if ($isMinorFlow) {
            $fieldsToUpdate = array_merge($fieldsToUpdate, [
                'guardianName = :guardianName',
                'guardianRG = :guardianRG',
                'guardianCPF = :guardianCPF',
                'guardianEmail = :guardianEmail',
                'guardianPhone = :guardianPhone'
            ]);
            $params[':guardianName'] = $enrollmentData['guardianName'];
            $params[':guardianRG'] = $enrollmentData['guardianRG'];
            $params[':guardianCPF'] = $enrollmentData['guardianCPF'];
            $params[':guardianEmail'] = $enrollmentData['guardianEmail'];
            $params[':guardianPhone'] = $enrollmentData['guardianPhone'];
        } else {
             // Se não for menor, garante que os campos do responsável fiquem nulos
             // (caso tenham sido preenchidos anteriormente e o aluno agora seja maior)
             // Nota: Isso depende se você quer limpar os dados antigos. Alternativamente, pode apenas não atualizá-los.
            /*
            $fieldsToUpdate = array_merge($fieldsToUpdate, [
                'guardianName = NULL', 'guardianRG = NULL', 'guardianCPF = NULL',
                'guardianEmail = NULL', 'guardianPhone = NULL'
            ]);
            */
        }

        $updateUserSql = "UPDATE users SET " . implode(', ', $fieldsToUpdate) . " WHERE id = :studentId";
        $stmtUser = $conn->prepare($updateUserSql);
        $stmtUser->execute($params);


        // 2. Verifica se já existe matrícula
        $stmtCheck = $conn->prepare("SELECT status FROM enrollments WHERE studentId = ? AND courseId = ?");
        $stmtCheck->execute([$studentId, $courseId]);
        $existingEnrollment = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        $now = date('Y-m-d H:i:s');
        $contractAcceptedAt = !empty($enrollmentData['acceptContract']) ? $now : null;
        $termsAcceptedAt = !empty($enrollmentData['acceptImageTerms']) ? $now : null;

        $message = '';

        if ($existingEnrollment) {
            // Se já aprovada ou pendente, não faz nada na matrícula, só atualizou user
            if ($existingEnrollment['status'] === 'Aprovada' || $existingEnrollment['status'] === 'Pendente') {
                 $message = 'Seus dados foram atualizados. Sua matrícula continua ' . strtolower($existingEnrollment['status']) . '.';
                 // Não atualiza as datas de aceite se já está aprovado/pendente, a menos que seja regra de negócio
            }
            // Se estava cancelada, reativa para Pendente
            elseif ($existingEnrollment['status'] === 'Cancelada') {
                $updateEnrollStmt = $conn->prepare("
                    UPDATE enrollments SET status = 'Pendente', billingStartDate = NULL,
                           contractAcceptedAt = ?, termsAcceptedAt = ?
                    WHERE studentId = ? AND courseId = ?
                ");
                $updateEnrollStmt->execute([$contractAcceptedAt, $termsAcceptedAt, $studentId, $courseId]);
                $message = 'Sua matrícula neste curso foi reativada e está aguardando aprovação.';
            }
        } else {
            // Se não existe, cria nova matrícula como Pendente
            $insertEnrollStmt = $conn->prepare("
                INSERT INTO enrollments (studentId, courseId, status, contractAcceptedAt, termsAcceptedAt)
                VALUES (?, ?, 'Pendente', ?, ?)
            ");
            $insertEnrollStmt->execute([$studentId, $courseId, $contractAcceptedAt, $termsAcceptedAt]);
            $message = 'Solicitação de matrícula enviada com sucesso e aguardando aprovação.';
        }

        $conn->commit();
        send_response(true, ['message' => $message]);

    } catch (Exception $e) {
        $conn->rollBack();
         error_log("Erro em handle_submit_enrollment: " . $e->getMessage()); // Log do erro
        send_response(false, 'Erro ao processar matrícula: ' . $e->getMessage(), 500);
    }
}


// Funções approve, cancel, reactivate, updateDetails (mantidas como estão)
function handle_approve_enrollment($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];
    $billingStartChoice = $data['billingStartChoice'];
    $overrideFee = isset($data['overrideFee']) && is_numeric($data['overrideFee']) ? (float)$data['overrideFee'] : null; // Captura mensalidade personalizada

    $conn->beginTransaction();
    try {
        $billingDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); // Usar fuso horário local
        if ($billingStartChoice === 'next_month') {
            $billingDate->modify('first day of next month');
        } else {
            $billingDate->modify('first day of this month');
        }
        $billingStartDate = $billingDate->format('Y-m-d');

        // Atualiza a matrícula para Aprovada, define data de início da cobrança e salva a mensalidade personalizada (se houver)
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada', billingStartDate = ?, customMonthlyFee = ? WHERE studentId = ? AND courseId = ? AND status = 'Pendente'");
        $stmt->execute([$billingStartDate, $overrideFee, $studentId, $courseId]);

        // Verifica se a matrícula foi realmente atualizada (evita gerar pagamentos duplicados se já estava aprovada)
        if ($stmt->rowCount() == 0) {
             $conn->rollBack(); // Desfaz a transação se nada foi atualizado
             // Verifica se já estava aprovada
             $checkStmt = $conn->prepare("SELECT status FROM enrollments WHERE studentId = ? AND courseId = ?");
             $checkStmt->execute([$studentId, $courseId]);
             $currentStatus = $checkStmt->fetchColumn();
             if ($currentStatus === 'Aprovada') {
                 send_response(true, ['message' => 'Esta matrícula já estava aprovada.']);
             } else {
                 throw new Exception('Matrícula não encontrada ou não estava pendente.');
             }
             return; // Sai da função
        }


        // Busca detalhes DO CURSO e DA MATRÍCULA para calcular valor final
        $stmtDetails = $conn->prepare("SELECT c.monthlyFee, c.paymentType, c.installments, e.customMonthlyFee, e.scholarshipPercentage
                                      FROM courses c JOIN enrollments e ON c.id = e.courseId
                                      WHERE e.studentId = ? AND e.courseId = ?");
        $stmtDetails->execute([$studentId, $courseId]);
        $details = $stmtDetails->fetch();

        $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1");
        $settings = $stmtSettings->fetch();
        $dueDay = isset($settings['defaultDueDay']) ? (int)$settings['defaultDueDay'] : 10;
        // Garante que dueDay esteja entre 1 e 28
        $dueDay = max(1, min(28, $dueDay));


        // Gera pagamentos SE houver valor a cobrar E bolsa não for 100%
        if ($details && ($details['monthlyFee'] > 0 || $details['customMonthlyFee'] !== null) && ($details['scholarshipPercentage'] === null || $details['scholarshipPercentage'] < 100)) {

            // Prioriza customMonthlyFee se definido, senão usa monthlyFee do curso
            $baseAmount = $details['customMonthlyFee'] !== null ? $details['customMonthlyFee'] : $details['monthlyFee'];
            $scholarshipPercentage = $details['scholarshipPercentage'] ?? 0; // Assume 0 se for null
            $finalAmount = round($baseAmount * (1 - ($scholarshipPercentage / 100)), 2);


            if ($finalAmount > 0) {
                $limit = 0; // Número de parcelas a gerar

                if ($details['paymentType'] === 'parcelado' && !empty($details['installments']) && $details['installments'] > 0) {
                    $limit = (int)$details['installments'];
                } else { // Recorrente (gera até o final do ano corrente)
                    $currentYear = $billingDate->format('Y');
                    $endOfYear = new DateTime("{$currentYear}-12-31", $billingDate->getTimezone()); // Usa o mesmo timezone
                    // Calcula a diferença em meses
                    $interval = $billingDate->diff($endOfYear);
                    // +1 porque inclui o mês de início
                    $limit = (($interval->y * 12) + $interval->m) + 1;

                }

                $cursorDate = clone $billingDate; // Clona para não modificar a data original
                for ($i = 0; $i < $limit; $i++) {
                    $refDate = $cursorDate->format('Y-m-01'); // Mês de referência é sempre o dia 1
                    // Define o dia do vencimento, cuidando para não passar do fim do mês
                    $dueDateFormatted = $cursorDate->format('Y-m-') . str_pad($dueDay, 2, '0', STR_PAD_LEFT);
                     // Verifica se o dia de vencimento calculado é válido para o mês atual
                    $lastDayOfMonth = (int)$cursorDate->format('t');
                    $actualDueDay = min($dueDay, $lastDayOfMonth);
                    $dueDate = $cursorDate->format('Y-m-') . str_pad($actualDueDay, 2, '0', STR_PAD_LEFT);


                    $stmtInsertPayment = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                    $stmtInsertPayment->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]);

                    $cursorDate->modify('+1 month'); // Avança para o próximo mês
                }
            }
        }

        $conn->commit();
        send_response(true, ['message' => 'Matrícula aprovada e pagamentos gerados com sucesso.']);
    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Erro ao aprovar matrícula: " . $e->getMessage()); // Log do erro
        send_response(false, 'Erro ao aprovar matrícula: ' . $e->getMessage(), 500);
    }
}


function handle_cancel_enrollment($conn, $data) {
    // ... (código existente, sem alterações) ...
     $studentId = isset($data['studentId']) ? (int)$data['studentId'] : null;
    $courseId = isset($data['courseId']) ? (int)$data['courseId'] : null;
    if (!$studentId || !$courseId) {
        send_response(false, 'ID do aluno e do curso são obrigatórios.', 400);
    }
    $conn->beginTransaction();
    try {
        // Só permite cancelar se estiver Aprovada
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Cancelada' WHERE studentId = ? AND courseId = ? AND status = 'Aprovada'");
        $stmt->execute([$studentId, $courseId]);
        if ($stmt->rowCount() == 0) {
             throw new Exception('Nenhuma matrícula aprovada encontrada para cancelar.');
        }

        // Busca configurações de multa
        $settingsStmt = $conn->query("SELECT enableTerminationFine, terminationFineMonths FROM system_settings WHERE id = 1");
        $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC);
        $fineEnabled = isset($settings['enableTerminationFine']) && $settings['enableTerminationFine'] == 1;
        $fineMonths = isset($settings['terminationFineMonths']) ? (int)$settings['terminationFineMonths'] : 0;
        $message = 'Matrícula trancada.'; // Mensagem base

        // Busca pagamentos Pendentes ou Atrasados futuros (ordenados por vencimento)
        $paymentsStmt = $conn->prepare("SELECT id FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado') ORDER BY dueDate ASC");
        $paymentsStmt->execute([$studentId, $courseId]);
        $futurePayments = $paymentsStmt->fetchAll(PDO::FETCH_COLUMN);

        $paymentsToCancelIds = []; // IDs dos pagamentos a serem cancelados

        if (count($futurePayments) > 0) {
            if ($fineEnabled && $fineMonths > 0) {
                 // Mantém os primeiros N pagamentos como multa (não cancela)
                 // Cancela apenas os pagamentos *após* o número de meses da multa
                $paymentsToCancelIds = array_slice($futurePayments, $fineMonths);
                 $keptCount = count($futurePayments) - count($paymentsToCancelIds);
                 if ($keptCount > 0) {
                    $message .= " Uma multa rescisória referente a {$keptCount} mensalidade(s) futura(s) foi mantida.";
                 }
                 if (!empty($paymentsToCancelIds)) {
                     $message .= " Os demais pagamentos futuros foram cancelados.";
                 } else if ($keptCount > 0) {
                     // Não havia mais pagamentos para cancelar além da multa
                 } else {
                      // Havia pagamentos mas a multa cobria todos ou mais
                      $message .= " A multa rescisória cobre todos os pagamentos futuros existentes.";
                 }


            } else {
                // Se multa desabilitada, cancela todos os futuros
                $paymentsToCancelIds = $futurePayments;
                $message .= ' Todos os pagamentos futuros pendentes foram cancelados.';
            }

            // Executa o cancelamento dos pagamentos selecionados
            if (!empty($paymentsToCancelIds)) {
                $placeholders = implode(',', array_fill(0, count($paymentsToCancelIds), '?'));
                $cancelSql = "UPDATE payments SET status = 'Cancelado', paymentDate = NULL WHERE id IN ($placeholders)";
                $cancelStmt = $conn->prepare($cancelSql);
                $cancelStmt->execute($paymentsToCancelIds);
            }
        } else {
            $message .= ' Não havia pagamentos futuros pendentes para cancelar.';
        }


        $conn->commit();
        send_response(true, ['message' => $message]);
    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Erro ao trancar matrícula: " . $e->getMessage()); // Log
        send_response(false, 'Erro ao trancar matrícula: ' . $e->getMessage(), 500);
    }
}

function handle_reactivate_enrollment($conn, $data) {
    // ... (código existente, sem alterações) ...
     $studentId = isset($data['studentId']) ? (int)$data['studentId'] : null;
    $courseId = isset($data['courseId']) ? (int)$data['courseId'] : null;
    if (!$studentId || !$courseId) {
        send_response(false, 'ID do aluno e do curso são obrigatórios.', 400);
    }
    $conn->beginTransaction();
    try {
        // Só permite reativar se estiver Cancelada
        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada' WHERE studentId = ? AND courseId = ? AND status = 'Cancelada'");
        $stmt->execute([$studentId, $courseId]);
        if ($stmt->rowCount() == 0) {
            throw new Exception('Nenhuma matrícula cancelada encontrada para reativar.');
        }

        // Busca pagamentos que foram Cancelados durante o trancamento
        $paymentsStmt = $conn->prepare("SELECT id, dueDate FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Cancelado'");
        $paymentsStmt->execute([$studentId, $courseId]);
        $cancelledPayments = $paymentsStmt->fetchAll(PDO::FETCH_ASSOC);

        $today = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); // Use timezone local
        $today->setTime(0, 0, 0); // Compara apenas a data

        foreach ($cancelledPayments as $payment) {
            $dueDate = new DateTime($payment['dueDate'], new DateTimeZone('America/Sao_Paulo')); // Use timezone local
            $dueDate->setTime(0, 0, 0); // Compara apenas a data

            // Se a data de vencimento for passada, marca como Atrasado, senão Pendente
            $newStatus = ($dueDate < $today) ? 'Atrasado' : 'Pendente';

            $updatePaymentStmt = $conn->prepare("UPDATE payments SET status = ? WHERE id = ?");
            $updatePaymentStmt->execute([$newStatus, $payment['id']]);
        }

        $conn->commit();
        send_response(true, ['message' => 'Matrícula reativada. Pagamentos cancelados foram restaurados como Pendentes ou Atrasados.']);
    } catch (Exception $e) {
        $conn->rollBack();
         error_log("Erro ao reativar matrícula: " . $e->getMessage()); // Log
        send_response(false, 'Erro ao reativar matrícula: ' . $e->getMessage(), 500);
    }
}

function handle_update_enrollment_details($conn, $data) {
    // ... (código existente, sem alterações) ...
    $studentId = filter_var($data['studentId'], FILTER_VALIDATE_INT);
    $courseId = filter_var($data['courseId'], FILTER_VALIDATE_INT);
    // Permite 0 como valor válido para bolsa e taxa
    $scholarship = isset($data['scholarshipPercentage']) && is_numeric($data['scholarshipPercentage']) ? (float)$data['scholarshipPercentage'] : 0.0;
    if ($scholarship < 0 || $scholarship > 100) $scholarship = 0.0; // Garante que esteja no range

    // Aceita 0 ou valores positivos. Usa null se vazio ou não numérico.
    $customFee = isset($data['customMonthlyFee']) && $data['customMonthlyFee'] !== '' && is_numeric($data['customMonthlyFee']) && (float)$data['customMonthlyFee'] >= 0
                   ? (float)$data['customMonthlyFee']
                   : null;


    if ($studentId === false || $courseId === false) {
        send_response(false, 'IDs de aluno/curso inválidos.', 400);
    }

    $conn->beginTransaction();
    try {
        // 1. Atualiza bolsa e taxa personalizada na matrícula
        $updateStmt = $conn->prepare("UPDATE enrollments SET scholarshipPercentage = ?, customMonthlyFee = ? WHERE studentId = ? AND courseId = ?");
        $updateStmt->execute([$scholarship, $customFee, $studentId, $courseId]);

        // 2. Deleta pagamentos FUTUROS (Pendente ou Atrasado) para recalcular
        // NÃO deleta pagamentos já Pagos ou Cancelados manualmente.
        $deleteStmt = $conn->prepare("DELETE FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado')");
        $deleteStmt->execute([$studentId, $courseId]);

        // 3. Busca detalhes necessários para gerar os novos pagamentos
        $stmtDetails = $conn->prepare("
            SELECT c.monthlyFee, c.paymentType, c.installments, e.billingStartDate
            FROM courses c JOIN enrollments e ON c.id = e.courseId
            WHERE e.studentId = ? AND e.courseId = ? AND e.status = 'Aprovada' -- Garante que a matrícula esteja ativa
        ");
        $stmtDetails->execute([$studentId, $courseId]);
        $details = $stmtDetails->fetch();

        if ($details) { // Só gera pagamentos se a matrícula estiver ativa
            $dueDay = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1")->fetchColumn() ?? 10;
            $dueDay = max(1, min(28, (int)$dueDay)); // Garante 1-28


            // Calcula o valor final APÓS aplicar a bolsa
            if ($scholarship < 100) {
                 // Prioriza customFee se definido, senão usa mensalidade do curso
                $baseAmount = $customFee !== null ? $customFee : ($details['monthlyFee'] ?? 0);
                $finalAmount = round($baseAmount * (1 - ($scholarship / 100)), 2);

                if ($finalAmount > 0) {
                     // 4. Determina a data de início para os novos pagamentos
                     // Pega a data do ÚLTIMO pagamento PAGO ou o billingStartDate se não houver pagos
                    $lastPaidStmt = $conn->prepare("SELECT MAX(referenceDate) as lastDate FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Pago'");
                    $lastPaidStmt->execute([$studentId, $courseId]);
                    $lastPaidDateStr = $lastPaidStmt->fetchColumn();

                    $startDate = null;
                    if ($lastPaidDateStr) {
                        $startDate = new DateTime($lastPaidDateStr, new DateTimeZone('America/Sao_Paulo'));
                        $startDate->modify('first day of next month'); // Começa no mês seguinte ao último pago
                    } elseif ($details['billingStartDate']) {
                        $startDate = new DateTime($details['billingStartDate'], new DateTimeZone('America/Sao_Paulo'));
                        // Garante que comece no primeiro dia do mês
                        $startDate->modify('first day of this month');
                    }

                     // Se startDate ainda for nulo, algo deu errado (não deveria acontecer se aprovado)
                     if ($startDate) {
                         // 5. Determina quantos pagamentos gerar
                        $paymentsMadeStmt = $conn->prepare("SELECT COUNT(id) FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Pago'");
                        $paymentsMadeStmt->execute([$studentId, $courseId]);
                        $paymentsMadeCount = $paymentsMadeStmt->fetchColumn();


                        $limit = 0;
                        if ($details['paymentType'] === 'parcelado' && !empty($details['installments']) && $details['installments'] > 0) {
                            $remainingInstallments = (int)$details['installments'] - $paymentsMadeCount;
                            $limit = max(0, $remainingInstallments); // Garante não negativo
                        } else { // Recorrente - gera até o fim do ano corrente A PARTIR da startDate
                            $currentYear = $startDate->format('Y');
                            $endOfYear = new DateTime("{$currentYear}-12-31", $startDate->getTimezone());
                            $interval = $startDate->diff($endOfYear);
                             // +1 para incluir o mês de início
                            $limit = (($interval->y * 12) + $interval->m) + 1;

                        }

                        // 6. Gera os novos pagamentos
                        $cursorDate = clone $startDate;
                        for ($i = 0; $i < $limit; $i++) {
                            $refDate = $cursorDate->format('Y-m-01');
                            $lastDayOfMonth = (int)$cursorDate->format('t');
                            $actualDueDay = min($dueDay, $lastDayOfMonth);
                            $dueDate = $cursorDate->format('Y-m-') . str_pad($actualDueDay, 2, '0', STR_PAD_LEFT);


                            $insertStmt = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                            $insertStmt->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]);

                            $cursorDate->modify('+1 month');
                        }
                     } else {
                         error_log("Não foi possível determinar a data de início para regerar pagamentos para studentId: $studentId, courseId: $courseId");
                     }
                } // else finalAmount <= 0 (não gera pagamentos)
            } // else scholarship == 100 (não gera pagamentos)
        } // else matrícula não está ativa

        $conn->commit();
        send_response(true, ['message' => 'Bolsa e/ou mensalidade personalizada atualizadas. Pagamentos futuros foram recalculados.']);

    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Erro ao atualizar detalhes da matrícula: " . $e->getMessage()); // Log
        send_response(false, 'Erro ao atualizar detalhes da matrícula: ' . $e->getMessage(), 500);
    }
}


// --- NOVA FUNÇÃO PARA REMATRÍCULA AUTOMÁTICA ---
function handle_submit_reenrollment($conn, $data) {
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0;
    $courseId = isset($data['courseId']) ? filter_var($data['courseId'], FILTER_VALIDATE_INT) : 0;
    $enrollmentData = $data['enrollmentData'] ?? []; // Contém acceptContract, acceptImageTerms

    // Validações básicas
    if ($studentId === false || $studentId <= 0 || $courseId === false || $courseId <= 0) {
        send_response(false, 'Dados de rematrícula inválidos (IDs).', 400);
    }
    if (empty($enrollmentData['acceptContract'])) {
        send_response(false, 'É necessário aceitar o Contrato atualizado para rematrícula.', 400);
    }

    $conn->beginTransaction();
    try {
        // 1. Verifica se a matrícula existe e está Aprovada (segurança extra)
        $stmtCheck = $conn->prepare("SELECT id FROM enrollments WHERE studentId = ? AND courseId = ? AND status = 'Aprovada'");
        $stmtCheck->execute([$studentId, $courseId]);
        $enrollmentId = $stmtCheck->fetchColumn();

        if (!$enrollmentId) {
            throw new Exception('Matrícula não encontrada ou não está ativa para rematrícula.');
        }

        // 2. Atualiza as datas de aceite na matrícula existente, MANTENDO o status 'Aprovada'
        $now = date('Y-m-d H:i:s');
        $contractAcceptedAt = $now; // Sempre atualiza na rematrícula
        $termsAcceptedAt = !empty($enrollmentData['acceptImageTerms']) ? $now : null; // Atualiza se aceito

        $updateEnrollStmt = $conn->prepare("
            UPDATE enrollments SET contractAcceptedAt = ?, termsAcceptedAt = ?
            WHERE id = ?
        ");
        $updateEnrollStmt->execute([$contractAcceptedAt, $termsAcceptedAt, $enrollmentId]);

        // 3. Exclui pagamentos FUTUROS (Pendente ou Atrasado) do ciclo anterior
        $deleteStmt = $conn->prepare("DELETE FROM payments WHERE studentId = ? AND courseId = ? AND status IN ('Pendente', 'Atrasado')");
        $deleteStmt->execute([$studentId, $courseId]);
        $deletedCount = $deleteStmt->rowCount(); // Guarda quantos foram deletados (informativo)

        // 4. Busca detalhes ATUALIZADOS do curso e da matrícula para gerar novos pagamentos
        $stmtDetails = $conn->prepare("
            SELECT c.monthlyFee, c.paymentType, c.installments, e.customMonthlyFee, e.scholarshipPercentage
            FROM courses c JOIN enrollments e ON c.id = e.courseId
            WHERE e.id = ?
        ");
        $stmtDetails->execute([$enrollmentId]);
        $details = $stmtDetails->fetch();

        // 5. Busca configurações do sistema (dia de vencimento)
        $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1");
        $settings = $stmtSettings->fetch();
        $dueDay = isset($settings['defaultDueDay']) ? (int)$settings['defaultDueDay'] : 10;
        $dueDay = max(1, min(28, $dueDay)); // Garante 1-28

        $generatedCount = 0; // Contador para novos pagamentos

        // 6. Gera novos pagamentos SE houver valor a cobrar E bolsa não for 100%
        if ($details && ($details['monthlyFee'] > 0 || $details['customMonthlyFee'] !== null) && ($details['scholarshipPercentage'] === null || $details['scholarshipPercentage'] < 100)) {

            $baseAmount = $details['customMonthlyFee'] !== null ? $details['customMonthlyFee'] : $details['monthlyFee'];
            $scholarshipPercentage = $details['scholarshipPercentage'] ?? 0;
            $finalAmount = round($baseAmount * (1 - ($scholarshipPercentage / 100)), 2);

            if ($finalAmount > 0) {
                // Determina a data de início para os novos pagamentos: mês seguinte ao último pagamento gerado (pago ou não) ou mês atual se nenhum existir
                $lastPaymentStmt = $conn->prepare("SELECT MAX(referenceDate) as lastDate FROM payments WHERE studentId = ? AND courseId = ?");
                $lastPaymentStmt->execute([$studentId, $courseId]);
                $lastPaymentDateStr = $lastPaymentStmt->fetchColumn();

                $startDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); // Começa do mês atual por padrão
                if ($lastPaymentDateStr) {
                    $startDate = new DateTime($lastPaymentDateStr, new DateTimeZone('America/Sao_Paulo'));
                    $startDate->modify('first day of next month'); // Começa no mês seguinte ao último gerado
                } else {
                     // Se NUNCA houve pagamentos, usa o billingStartDate ou o início do mês atual como fallback
                     $billingStartStmt = $conn->prepare("SELECT billingStartDate FROM enrollments WHERE id = ?");
                     $billingStartStmt->execute([$enrollmentId]);
                     $billingStartDate = $billingStartStmt->fetchColumn();
                     if ($billingStartDate) {
                         $startDate = new DateTime($billingStartDate, new DateTimeZone('America/Sao_Paulo'));
                         // Garante que comece no primeiro dia do mês da data de início de cobrança
                         $startDate->modify('first day of this month');
                         // Se a data de início for futura, usa ela
                         $nowDate = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
                         if ($startDate < $nowDate) {
                             $startDate = $nowDate; // Se já passou, começa no mês atual
                             $startDate->modify('first day of this month');
                         }

                     } else {
                          $startDate->modify('first day of this month'); // Fallback para início do mês atual
                     }
                }


                $limit = 0; // Número de parcelas a gerar

                if ($details['paymentType'] === 'parcelado' && !empty($details['installments']) && $details['installments'] > 0) {
                    // Conta quantos já foram PAGOS para saber quantos faltam
                    $paidCountStmt = $conn->prepare("SELECT COUNT(id) FROM payments WHERE studentId = ? AND courseId = ? AND status = 'Pago'");
                    $paidCountStmt->execute([$studentId, $courseId]);
                    $paidCount = $paidCountStmt->fetchColumn();
                    $limit = max(0, (int)$details['installments'] - $paidCount);
                } else { // Recorrente - gera por 12 meses a partir da startDate
                    $limit = 12;
                }

                // Gera os pagamentos
                $cursorDate = clone $startDate;
                for ($i = 0; $i < $limit; $i++) {
                    $refDate = $cursorDate->format('Y-m-01');
                    $lastDayOfMonth = (int)$cursorDate->format('t');
                    $actualDueDay = min($dueDay, $lastDayOfMonth);
                    $dueDate = $cursorDate->format('Y-m-') . str_pad($actualDueDay, 2, '0', STR_PAD_LEFT);

                    $insertStmt = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                    $insertStmt->execute([$studentId, $courseId, $finalAmount, $refDate, $dueDate]);
                    $generatedCount++;

                    $cursorDate->modify('+1 month');
                }
            } // else finalAmount <= 0
        } // else scholarship == 100 or no fee

        $conn->commit();
        send_response(true, [
            'message' => "Rematrícula confirmada com sucesso! " . ($generatedCount > 0 ? "$generatedCount novo(s) pagamento(s) gerado(s)." : "Nenhum novo pagamento gerado (isenção ou valor zero).") . ($deletedCount > 0 ? " $deletedCount pagamento(s) pendente(s) anterior(es) removido(s)." : "")
        ]);

    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Erro em handle_submit_reenrollment: " . $e->getMessage()); // Log do erro
        send_response(false, 'Erro ao processar rematrícula: ' . $e->getMessage(), 500);
    }
}

?>
