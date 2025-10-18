<?php
/**
 * Handlers para ações relacionadas ao sistema e perfil da escola.
 */

function handle_get_school_profile($conn, $data) {
    // Log para verificar se a função está sendo chamada
    error_log("Iniciando handle_get_school_profile...");

    // Verifica se a conexão PDO é válida
     if (!isset($conn) || !$conn instanceof PDO) {
        error_log("Erro em handle_get_school_profile: Conexão PDO inválida ou não fornecida.");
        send_response(false, ['message' => 'Erro interno do servidor (DB Connection).'], 500);
        return; // Sai da função
    }


    try {
        // Prepara a consulta SQL
        $stmt = $conn->prepare("SELECT * FROM school_profile WHERE id = 1 LIMIT 1"); // Adiciona LIMIT 1 por segurança

        // Executa a consulta
        $stmt->execute();

        // Busca o resultado
        $profile = $stmt->fetch(PDO::FETCH_ASSOC); // Busca apenas uma linha

        // Verifica se encontrou o perfil
        if ($profile) {
            error_log("Perfil da escola encontrado com sucesso."); // Log de sucesso
            send_response(true, ['profile' => $profile]);
        } else {
            // Se não encontrou, pode ser um erro de configuração inicial
            error_log("Perfil da escola com id=1 não encontrado na tabela school_profile."); // Log de aviso
            send_response(false, ['message' => "Perfil da escola não encontrado. Verifique a configuração inicial."], 404);
        }
    } catch (PDOException $e) {
        // Captura e loga erros específicos do PDO durante a consulta
        error_log("Erro PDO em handle_get_school_profile: " . $e->getMessage());
        send_response(false, ['message' => "Erro ao consultar o perfil da escola."], 500);
    } catch (Exception $e) {
        // Captura outros erros inesperados
        error_log("Erro geral em handle_get_school_profile: " . $e->getMessage());
        send_response(false, ['message' => "Erro interno ao processar a solicitação do perfil."], 500);
    }
}


function handle_update_school_profile($conn, $data) {
     error_log("Iniciando handle_update_school_profile...");
      if (!isset($conn) || !$conn instanceof PDO) { /* ... (verificação da conexão) ... */ error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }

    // Verifica se os dados do perfil foram enviados
    if (!isset($data['profileData']) || !is_array($data['profileData'])) {
        error_log("Dados do perfil ausentes ou em formato inválido.");
        send_response(false, ['message' => "Dados do perfil ausentes ou inválidos."], 400);
        return;
    }

    $profileData = $data['profileData'];
    $fields = [];
    $params = [':id' => 1]; // Assume que sempre atualiza a linha com id=1

    // Lista de campos permitidos para atualização
    $allowedFields = ['name', 'cnpj', 'address', 'phone', 'pixKeyType', 'pixKey', 'profilePicture', 'signatureImage'];

    // Constrói a query dinamicamente apenas com os campos enviados
    foreach($allowedFields as $field) {
        // Usa array_key_exists para permitir envio de strings vazias (para limpar um campo)
        if (array_key_exists($field, $profileData)) {
            $fields[] = "`" . $field . "` = :" . $field; // Usa backticks para nomes de colunas
            // Define o valor como NULL se for uma string vazia, caso contrário usa o valor
            $params[":" . $field] = ($profileData[$field] === '') ? null : $profileData[$field];
        }
    }

    // Se nenhum campo permitido foi enviado, não há o que atualizar
    if (empty($fields)) {
        error_log("Nenhum campo válido para atualizar em handle_update_school_profile.");
        send_response(false, ['message' => "Nenhum campo válido para atualizar foi enviado."], 400);
        return;
    }

    $setFields = implode(', ', $fields);
    $sql = "UPDATE `school_profile` SET {$setFields} WHERE `id` = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        // Retorna o perfil atualizado para o frontend
        $stmtSelect = $conn->prepare("SELECT * FROM `school_profile` WHERE `id` = 1 LIMIT 1");
        $stmtSelect->execute();
        $updatedProfile = $stmtSelect->fetch(PDO::FETCH_ASSOC);

        if ($updatedProfile) {
             error_log("Perfil da escola atualizado com sucesso.");
             send_response(true, ['message' => 'Perfil da escola atualizado com sucesso.', 'profile' => $updatedProfile]);
        } else {
             // Isso não deveria acontecer se a linha id=1 existe
             error_log("Falha ao buscar perfil atualizado após UPDATE.");
             send_response(false, ['message' => 'Perfil atualizado, mas falha ao retornar os dados.'], 500);
        }

    } catch (PDOException $e) {
        error_log("Erro PDO em handle_update_school_profile: " . $e->getMessage());
        send_response(false, ['message' => "Erro ao atualizar perfil da escola no banco de dados."], 500);
    } catch (Exception $e) {
        error_log("Erro geral em handle_update_school_profile: " . $e->getMessage());
        send_response(false, ['message' => "Erro interno ao atualizar perfil da escola."], 500);
    }
}


function handle_get_system_settings($conn, $data) {
     error_log("Iniciando handle_get_system_settings...");
     if (!isset($conn) || !$conn instanceof PDO) { /* ... (verificação da conexão) ... */ error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }

    try {
        $stmt = $conn->prepare("SELECT * FROM `system_settings` WHERE `id` = 1 LIMIT 1");
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            // Converte valores booleanos/numéricos do banco (geralmente 0/1 ou strings) para tipos corretos no PHP/JSON
            $settings['enableTerminationFine'] = isset($settings['enableTerminationFine']) ? (bool)$settings['enableTerminationFine'] : false; // Default false if null
            $settings['terminationFineMonths'] = isset($settings['terminationFineMonths']) ? (int)$settings['terminationFineMonths'] : 1; // Default 1 if null
            $settings['defaultDueDay'] = isset($settings['defaultDueDay']) ? (int)$settings['defaultDueDay'] : 10; // Default 10 if null
            // Garante que campos potencialmente nulos sejam nulos no JSON
            $settings['geminiApiKey'] = $settings['geminiApiKey'] ?? null;
            $settings['geminiApiEndpoint'] = $settings['geminiApiEndpoint'] ?? null;

             error_log("Configurações do sistema encontradas.");
            send_response(true, ['settings' => $settings]);
        } else {
             error_log("Configurações do sistema (id=1) não encontradas.");
            send_response(false, ['message' => "Configurações do sistema não encontradas."], 404);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO em handle_get_system_settings: " . $e->getMessage());
        send_response(false, ['message' => "Erro ao buscar configurações do sistema."], 500);
    } catch (Exception $e) {
        error_log("Erro geral em handle_get_system_settings: " . $e->getMessage());
        send_response(false, ['message' => "Erro interno ao buscar configurações."], 500);
    }
}


function handle_update_system_settings($conn, $data) {
     error_log("Iniciando handle_update_system_settings...");
     if (!isset($conn) || !$conn instanceof PDO) { /* ... (verificação da conexão) ... */ error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }


    if (!isset($data['settingsData']) || !is_array($data['settingsData'])) {
         error_log("Dados de settings ausentes ou inválidos.");
        send_response(false, ['message' => "Dados de configuração ausentes ou inválidos."], 400);
        return;
    }

    $settingsData = $data['settingsData'];
    $fields = [];
    $params = [':id' => 1]; // Assume id=1

    // Lista de campos permitidos e seus tipos esperados (para sanitização/conversão)
    $allowedFields = [
        'language' => 'string', 'timeZone' => 'string', 'currencySymbol' => 'string',
        'defaultDueDay' => 'int', 'geminiApiKey' => 'string_nullable', 'geminiApiEndpoint' => 'string_nullable',
        'smtpServer' => 'string_nullable', 'smtpPort' => 'string_nullable', 'smtpUser' => 'string_nullable', 'smtpPass' => 'string_nullable', // Senha pode ser string vazia
        'enableTerminationFine' => 'bool', 'terminationFineMonths' => 'int'
    ];

    foreach ($allowedFields as $field => $type) {
        if (array_key_exists($field, $settingsData)) {
            $value = $settingsData[$field];
            $paramName = ":" . $field;

            // Sanitiza/Converte o valor baseado no tipo esperado
            switch ($type) {
                case 'int':
                    $value = filter_var($value, FILTER_VALIDATE_INT);
                    // Aplica regras específicas se necessário (ex: dia vencimento)
                    if ($field === 'defaultDueDay') $value = max(1, min(28, $value === false ? 10 : $value));
                    if ($field === 'terminationFineMonths') $value = max(1, $value === false ? 1 : $value);
                    break;
                case 'bool':
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ? 1 : 0; // Converte para 1 ou 0
                    break;
                case 'string_nullable':
                    $value = ($value === null || trim((string)$value) === '') ? null : trim((string)$value);
                     // Não usa trim na senha SMTP
                     if ($field === 'smtpPass') {
                        $value = $settingsData[$field]; // Pega o valor original
                     }
                    break;
                case 'string':
                default:
                    $value = trim((string)$value);
                    break;
            }

            $fields[] = "`" . $field . "` = " . $paramName;
            $params[$paramName] = $value;
        }
    }


    if (empty($fields)) {
        error_log("Nenhum campo válido para atualizar em handle_update_system_settings.");
        send_response(false, ['message' => "Nenhum dado válido para atualizar."], 400);
        return;
    }

    $setFields = implode(', ', $fields);
    $sql = "UPDATE `system_settings` SET {$setFields} WHERE `id` = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            error_log("Configurações do sistema atualizadas com sucesso.");
            send_response(true, ['message' => 'Configurações do sistema atualizadas com sucesso.']);
        } else {
             error_log("Nenhuma linha afetada ao atualizar system_settings (id=1 pode não existir ou dados iguais).");
             // Considera sucesso mesmo se nada mudou, ou envia um status diferente?
             // Por segurança, vamos considerar sucesso, mas logamos.
            send_response(true, ['message' => 'Nenhuma alteração detectada nas configurações.']);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO em handle_update_system_settings: " . $e->getMessage());
        send_response(false, ['message' => "Erro ao salvar configurações no banco de dados."], 500);
    } catch (Exception $e) {
        error_log("Erro geral em handle_update_system_settings: " . $e->getMessage());
        send_response(false, ['message' => "Erro interno ao salvar configurações."], 500);
    }
}


function handle_export_database($conn, $data) {
     error_log("Iniciando handle_export_database...");
     if (!isset($conn) || !$conn instanceof PDO) { /* ... (verificação da conexão) ... */ error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }

    $exportData = [];
    // Lista de tabelas a serem exportadas (ajuste conforme necessário)
    $tablesToExport = ['users', 'courses', 'enrollments', 'payments', 'attendance', 'school_profile', 'system_settings'];

    try {
        $conn->beginTransaction(); // Garante consistência durante a leitura

        foreach ($tablesToExport as $table) {
             error_log("Exportando tabela: $table");
            // Verifica se a tabela existe antes de tentar selecionar
            $checkTableStmt = $conn->query("SHOW TABLES LIKE '$table'");
            if ($checkTableStmt->rowCount() > 0) {
                $stmt = $conn->query("SELECT * FROM `$table`"); // Usa backticks
                $exportData[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                 error_log("Aviso: Tabela $table não encontrada para exportação.");
                 $exportData[$table] = []; // Adiciona entrada vazia se a tabela não existir
            }
        }

        $conn->commit(); // Finaliza a transação (apenas leitura neste caso)

        error_log("Exportação de dados concluída com sucesso.");
        send_response(true, ['exportData' => $exportData, 'message' => 'Dados exportados com sucesso.']);

    } catch (PDOException $e) {
        $conn->rollBack(); // Desfaz se houver erro durante a leitura
        error_log("Erro PDO em handle_export_database: " . $e->getMessage());
        send_response(false, ['message' => "Erro ao exportar dados do banco: " . $e->getMessage()], 500);
    } catch (Exception $e) {
         $conn->rollBack();
         error_log("Erro geral em handle_export_database: " . $e->getMessage());
        send_response(false, ['message' => "Erro interno durante a exportação: " . $e->getMessage()], 500);
    }
}


function handle_update_document_templates($conn, $data) {
     error_log("Iniciando handle_update_document_templates...");
     if (!isset($conn) || !$conn instanceof PDO) { /* ... (verificação da conexão) ... */ error_log("Erro: Conexão PDO inválida."); send_response(false, ['message'=>'Erro Interno (DB)'], 500); return; }

    // Pega os textos do corpo da requisição, usa string vazia como default se não enviados
    $contractText = $data['enrollmentContractText'] ?? '';
    $termsText = $data['imageTermsText'] ?? '';

    // Atualiza os campos na tabela system_settings (assume id=1)
    $sql = "UPDATE `system_settings` SET `enrollmentContractText` = ?, `imageTermsText` = ? WHERE `id` = 1";

    try {
        $stmt = $conn->prepare($sql);
        // Executa com os textos (podem ser vazios)
        $stmt->execute([$contractText, $termsText]);

        if ($stmt->rowCount() > 0) {
            error_log("Modelos de documentos atualizados com sucesso.");
            send_response(true, ['message' => 'Modelos de documentos salvos com sucesso.']);
        } else {
             error_log("Nenhuma linha afetada ao atualizar modelos (id=1 pode não existir ou dados iguais).");
             // Considera sucesso mesmo se nada mudou
            send_response(true, ['message' => 'Nenhuma alteração detectada nos modelos.']);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO em handle_update_document_templates: " . $e->getMessage());
        send_response(false, ['message' => "Erro ao salvar modelos no banco de dados."], 500);
    } catch (Exception $e) {
         error_log("Erro geral em handle_update_document_templates: " . $e->getMessage());
        send_response(false, ['message' => "Erro interno ao salvar modelos."], 500);
    }
}

?>