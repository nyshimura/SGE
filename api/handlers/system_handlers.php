<?php
// api/handlers/system_handlers.php

/**
 * Handlers para ações relacionadas ao sistema e perfil da escola.
 */

// Define handle_get_school_profile APENAS UMA VEZ
function handle_get_school_profile($conn, $data) {
    // error_log("Iniciando handle_get_school_profile..."); // Log removido
    if (!isset($conn) || !$conn instanceof PDO) { error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }
    try {
        $stmt = $conn->prepare("SELECT * FROM school_profile WHERE id = 1 LIMIT 1");
        $stmt->execute();
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($profile) {
            // error_log("Perfil da escola encontrado."); // Log removido
            send_response(true, ['profile' => $profile]);
        } else {
            error_log("Perfil da escola id=1 não encontrado. Tentando criar padrão...");
            // Tenta criar um perfil padrão se não existir
            try {
                // Use placeholders para segurança, mesmo sendo valores fixos
                $conn->prepare("INSERT INTO school_profile (id, name) VALUES (1, :name) ON DUPLICATE KEY UPDATE name=name")
                     ->execute([':name' => 'Nome da Escola Padrão']);
                
                $stmt->execute(); // Tenta buscar novamente
                $profile = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($profile) {
                     error_log("Perfil da escola padrão criado e retornado.");
                     send_response(true, ['profile' => $profile]);
                } else {
                     throw new Exception("Falha ao criar/buscar perfil padrão após inserção.");
                }
            } catch (Exception $e) {
                 error_log("Erro ao tentar criar/buscar perfil padrão: " . $e->getMessage());
                 send_response(false, ['message' => "Perfil não encontrado e falha ao criar padrão."], 404);
            }
        }
    } catch (PDOException $e) { error_log("Erro PDO handle_get_school_profile: " . $e->getMessage()); send_response(false, ['message' => "Erro ao consultar perfil."], 500);
    } catch (Exception $e) { error_log("Erro geral handle_get_school_profile: " . $e->getMessage()); send_response(false, ['message' => "Erro interno perfil."], 500); }
}

// Define handle_update_school_profile APENAS UMA VEZ
function handle_update_school_profile($conn, $data) {
    error_log("Iniciando handle_update_school_profile...");
    if (!isset($conn) || !$conn instanceof PDO) { error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }
    if (!isset($data['profileData']) || !is_array($data['profileData'])) { error_log("Dados do perfil ausentes."); send_response(false, ['message' => "Dados ausentes."], 400); return; }
    $profileData = $data['profileData']; $fields = []; $params = [':id' => 1];
    $allowedFields = ['name', 'cnpj', 'address', 'phone', 'pixKeyType', 'pixKey', 'profilePicture', 'signatureImage', 'schoolCity', 'state'];
    foreach($allowedFields as $field) {
        if (array_key_exists($field, $profileData)) {
            $fields[] = "`" . $field . "` = :" . $field;
            $params[":" . $field] = ($profileData[$field] === '') ? null : $profileData[$field];
        }
    }
    if (empty($fields)) { error_log("Nenhum campo válido para atualizar em school_profile."); $stmtCurrent = $conn->query("SELECT * FROM school_profile WHERE id = 1"); $currentProfile = $stmtCurrent->fetch(); send_response(true, ['message' => 'Nenhum dado válido para atualizar.', 'profile' => $currentProfile, 'success' => true]); return; } // Adicionado success aqui também por consistência
    $setFields = implode(', ', $fields); $sql = "UPDATE `school_profile` SET {$setFields} WHERE `id` = :id";
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        // Mesmo se rowCount for 0 (nenhuma linha alterada), buscamos e retornamos o perfil atual.
        $stmtSelect = $conn->prepare("SELECT * FROM `school_profile` WHERE `id` = 1 LIMIT 1");
        $stmtSelect->execute();
        $updatedProfile = $stmtSelect->fetch(PDO::FETCH_ASSOC);

        if ($updatedProfile) {
            error_log("Perfil da escola atualizado (ou verificado)."); // Log ligeiramente ajustado
            // --- INÍCIO DA MODIFICAÇÃO ---
            // Adiciona 'success' => true à resposta para o frontend
            send_response(true, ['message' => 'Perfil atualizado.', 'profile' => $updatedProfile, 'success' => true]);
            // --- FIM DA MODIFICAÇÃO ---
        } else {
            // Este caso só deve ocorrer se a tabela estiver vazia e a busca falhar
            error_log("Falha ao buscar perfil da escola após tentativa de update.");
            send_response(false, ['message' => 'Falha ao buscar dados após atualização.'], 500);
        }
    } catch (PDOException $e) { error_log("Erro PDO handle_update_school_profile: " . $e->getMessage()); send_response(false, ['message' => "Erro DB ao atualizar perfil."], 500);
    } catch (Exception $e) { error_log("Erro geral handle_update_school_profile: " . $e->getMessage()); send_response(false, ['message' => "Erro interno ao atualizar perfil."], 500); }
}

// Define handle_get_system_settings APENAS UMA VEZ
function handle_get_system_settings($conn, $data) {
    error_log("Iniciando handle_get_system_settings...");
    if (!isset($conn) || !$conn instanceof PDO) { error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }
    try {
        $stmt = $conn->prepare("SELECT * FROM `system_settings` WHERE `id` = 1 LIMIT 1");
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($settings) {
            // Converte tipos e garante existência de campos
            $settings['enableTerminationFine'] = isset($settings['enableTerminationFine']) ? (bool)$settings['enableTerminationFine'] : false;
            $settings['terminationFineMonths'] = isset($settings['terminationFineMonths']) ? (int)$settings['terminationFineMonths'] : 1;
            $settings['defaultDueDay'] = isset($settings['defaultDueDay']) ? (int)$settings['defaultDueDay'] : 10;
            $settings['site_url'] = $settings['site_url'] ?? null;
            $settings['email_approval_subject'] = $settings['email_approval_subject'] ?? null;
            $settings['email_approval_body'] = $settings['email_approval_body'] ?? null;
            $settings['email_reset_subject'] = $settings['email_reset_subject'] ?? null;
            $settings['email_reset_body'] = $settings['email_reset_body'] ?? null;
            $settings['enrollmentContractText'] = $settings['enrollmentContractText'] ?? null;
            $settings['imageTermsText'] = $settings['imageTermsText'] ?? null;
            $settings['certificate_template_text'] = $settings['certificate_template_text'] ?? null;
            $settings['certificate_background_image'] = $settings['certificate_background_image'] ?? null;

            error_log("Configurações do sistema encontradas.");
            send_response(true, ['settings' => $settings]);
        } else {
             error_log("Configurações do sistema id=1 não encontradas. Tentando criar padrão...");
             // Tenta criar settings padrão
             try {
                  $conn->exec("INSERT INTO system_settings (id, language, timeZone, currencySymbol, defaultDueDay) VALUES (1, 'pt-BR', 'America/Sao_Paulo', 'R$', 10) ON DUPLICATE KEY UPDATE language=language");
                  $stmt->execute(); // Tenta buscar novamente
                  $settings = $stmt->fetch(PDO::FETCH_ASSOC);
                  if ($settings) {
                       // Preenche campos nulos para a resposta
                       $settings['enableTerminationFine'] = false; $settings['terminationFineMonths'] = 1; /*...*/ $settings['certificate_background_image'] = null;
                       error_log("Configurações padrão criadas e retornadas.");
                       send_response(true, ['settings' => $settings]);
                  } else {
                       throw new Exception("Falha ao criar/buscar settings padrão.");
                  }
             } catch (Exception $e) {
                 error_log("Erro ao tentar criar/buscar settings padrão: " . $e->getMessage());
                 send_response(false, ['message' => "Configurações não encontradas e falha ao criar padrão."], 404);
             }
        }
    } catch (PDOException $e) { error_log("Erro PDO handle_get_system_settings: " . $e->getMessage()); send_response(false, ['message' => "Erro ao consultar configurações."], 500);
    } catch (Exception $e) { error_log("Erro geral handle_get_system_settings: " . $e->getMessage()); send_response(false, ['message' => "Erro interno configurações."], 500); }
}

// Define handle_update_system_settings APENAS UMA VEZ
function handle_update_system_settings($conn, $data) {
    error_log("Iniciando handle_update_system_settings...");
    if (!isset($conn) || !$conn instanceof PDO) { error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }
    if (!isset($data['settingsData']) || !is_array($data['settingsData'])) { error_log("Dados das configurações ausentes."); send_response(false, ['message' => "Dados ausentes."], 400); return; }

    $settingsData = $data['settingsData'];

    // *** LOG PARA VERIFICAR IMAGEM RECEBIDA ***
    $receivedBase64 = $settingsData['certificate_background_image'] ?? 'NÃO RECEBIDO';
    error_log("Imagem Base64 RECEBIDA (primeiros 100): " . substr($receivedBase64, 0, 100));
    error_log("Tamanho da string Base64 RECEBIDA: " . strlen($receivedBase64));
    // *******************************************

    $fields = [];
    $params = [':id' => 1];

    // *** REMOVIDOS CAMPOS DE DOCUMENT TEMPLATES DESTA FUNÇÃO ***
    $allowedFields = [
        'language', 'timeZone', 'currencySymbol', 'defaultDueDay', 'geminiApiKey', 'geminiApiEndpoint',
        'smtpServer', 'smtpPort', 'smtpUser', 'smtpPass', 'enableTerminationFine', 'terminationFineMonths',
        'site_url', 'email_approval_subject', 'email_approval_body', 'email_reset_subject', 'email_reset_body',
        'certificate_template_text', 'certificate_background_image' // Campos do certificado permanecem
    ];
    $fieldTypes = [
        'defaultDueDay' => 'int', 'terminationFineMonths' => 'int',
        'enableTerminationFine' => 'bool',
    ];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $settingsData)) {
            $value = $settingsData[$field];
            $paramName = ":" . $field;
            $type = $fieldTypes[$field] ?? 'string_nullable';

            switch ($type) {
                case 'int':
                     $value = filter_var($value, FILTER_VALIDATE_INT);
                     if ($field === 'defaultDueDay') { $value = max(1, min(28, $value === false ? 10 : $value)); }
                     elseif ($field === 'terminationFineMonths') { $value = max(1, $value === false ? 1 : $value); }
                     else { $value = ($value === false) ? 0 : $value; }
                     break;
                case 'bool':
                     $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                     $value = $value ? 1 : 0;
                     break;
                case 'string_nullable':
                     if ($field === 'smtpPass' || $field === 'certificate_background_image') {
                          $value = $settingsData[$field];
                          if ($value === '') $value = null; // Garante null se for string vazia
                     } else {
                          $value = ($value === null || trim((string)$value) === '') ? null : trim((string)$value);
                     }
                     break;
                case 'string': default: $value = trim((string)$value); break;
            }

            // *** LOG PARA VERIFICAR VALOR ANTES DE IR PARA O PARÂMETRO ***
            if ($field === 'certificate_background_image') {
                 error_log("Parâmetro :certificate_background_image PREPARADO como: " . ($value === null ? 'NULL' : substr($value, 0, 100) . '... (Tamanho: ' . strlen($value) . ')'));
            }
            // ************************************************************

            $fields[] = "`" . $field . "` = " . $paramName;
            $params[$paramName] = $value; // Adiciona o valor (possivelmente null) ao array de parâmetros
        }
    }

    if (empty($fields)) { error_log("Nenhum campo válido para atualizar em system_settings."); send_response(true, ['message' => 'Nenhum dado válido para atualizar.', 'success' => true]); return; } // Adicionado success aqui também
    $setFields = implode(', ', $fields);
    $sql = "UPDATE `system_settings` SET {$setFields} WHERE `id` = :id";
    error_log("SQL Query (sem params): " . $sql); // Log da query

    try {
        $stmt = $conn->prepare($sql);
        $executeResult = $stmt->execute($params); // Executa com os parâmetros
        if ($executeResult) {
             if ($stmt->rowCount() > 0) { error_log("Configurações do sistema atualizadas."); }
             else { error_log("Nenhuma alteração detectada nas configurações do sistema."); }
             send_response(true, ['message' => 'Configurações salvas com sucesso.', 'success' => true]); // Adicionado success aqui também
        } else {
             error_log("Falha na execução do UPDATE para system_settings.");
             send_response(false, ['message' => "Falha ao executar atualização no banco de dados."], 500);
        }
    } catch (PDOException $e) { error_log("Erro PDO handle_update_system_settings: " . $e->getMessage() . " Params: " . print_r($params, true)); send_response(false, ['message' => "Erro DB ao atualizar configurações."], 500);
    } catch (Exception $e) { error_log("Erro geral handle_update_system_settings: " . $e->getMessage()); send_response(false, ['message' => "Erro interno ao atualizar configurações."], 500); }
}

// Define handle_export_database APENAS UMA VEZ
function handle_export_database($conn, $data) {
    error_log("Iniciando handle_export_database...");
    if (!isset($conn) || !$conn instanceof PDO) { error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }

    $exportData = [];
    $tablesToExport = ['users', 'courses', 'enrollments', 'payments', 'attendance', 'school_profile', 'system_settings', 'certificates'];

    try {
        $conn->beginTransaction(); // Usar transação para leitura consistente
        foreach ($tablesToExport as $table) {
            $check = $conn->query("SHOW TABLES LIKE '$table'");
            if ($check->rowCount() > 0) {
                $stmt = $conn->query("SELECT * FROM `$table`");
                $exportData[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $exportData[$table] = []; // Adiciona array vazio se a tabela não existir
            }
        }
        $conn->commit(); // Finaliza a transação (apenas leitura aqui)

        error_log("Exportação de dados concluída.");
        send_response(true, ['exportData' => $exportData, 'message' => 'Dados exportados com sucesso.']);
    } catch (PDOException $e) {
        $conn->rollBack(); error_log("Erro PDO durante exportação: " . $e->getMessage()); send_response(false, ['message' => "Erro DB durante a exportação."], 500);
    } catch (Exception $e) {
        $conn->rollBack(); error_log("Erro geral durante exportação: " . $e->getMessage()); send_response(false, ['message' => "Erro interno durante a exportação."], 500);
    }
}

// *** FUNÇÃO RESTAURADA E CORRIGIDA ***
// Define handle_update_document_templates APENAS UMA VEZ e com lógica correta
function handle_update_document_templates($conn, $data) {
    error_log("Iniciando handle_update_document_templates...");
    if (!isset($conn) || !$conn instanceof PDO) { error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }

    // Pega apenas os campos relevantes desta função
    $contractText = isset($data['enrollmentContractText']) ? ($data['enrollmentContractText'] === '' ? null : $data['enrollmentContractText']) : null;
    $termsText = isset($data['imageTermsText']) ? ($data['imageTermsText'] === '' ? null : $data['imageTermsText']) : null;

    // Prepara o SQL para atualizar apenas estes campos
    $fields = [];
    $params = [':id' => 1];
    if (array_key_exists('enrollmentContractText', $data)) {
        $fields[] = "`enrollmentContractText` = :contract";
        $params[':contract'] = $contractText;
    }
     if (array_key_exists('imageTermsText', $data)) {
        $fields[] = "`imageTermsText` = :terms";
        $params[':terms'] = $termsText;
    }

    // Só executa se houver campos para atualizar
    if (!empty($fields)) {
        $setFields = implode(', ', $fields);
        $sql = "UPDATE `system_settings` SET {$setFields} WHERE `id` = :id";
        error_log("SQL Query (document templates): " . $sql);

        try {
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            if ($stmt->rowCount() > 0) {
                error_log("Modelos de contrato/termos salvos.");
                send_response(true, ['message' => 'Modelos salvos com sucesso.', 'success' => true]); // Adicionado success aqui
            } else {
                error_log("Nenhuma alteração em modelos de contrato/termos.");
                send_response(true, ['message' => 'Nenhuma alteração detectada.', 'success' => true]); // Adicionado success aqui
            }
        } catch (PDOException $e) {
            error_log("Erro PDO em handle_update_document_templates: " . $e->getMessage());
            send_response(false, ['message' => "Erro DB ao salvar modelos."], 500);
        } catch (Exception $e) {
            error_log("Erro geral em handle_update_document_templates: " . $e->getMessage());
            send_response(false, ['message' => "Erro interno ao salvar modelos."], 500);
        }
    } else {
        error_log("Nenhum campo de template recebido para atualização.");
        send_response(true, ['message' => 'Nenhum dado de template recebido.', 'success' => true]); // Adicionado success aqui
    }
}
// **********************************

?>