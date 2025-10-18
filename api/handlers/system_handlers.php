<?php
/**
 * Handlers para ações relacionadas ao sistema e perfil da escola.
 */

function handle_get_school_profile($conn, $data) {
    try {
        $stmt = $conn->prepare("SELECT * FROM school_profile WHERE id = 1");
        $stmt->execute();
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($profile) {
            send_response(true, ['profile' => $profile]);
        } else {
            send_response(false, "Perfil da escola não encontrado.", 404);
        }
    } catch (Exception $e) {
        send_response(false, $e->getMessage(), 500);
    }
}

function handle_update_school_profile($conn, $data) {
    if (!isset($data['profileData'])) {
        send_response(false, "Dados do perfil ausentes.", 400);
    }

    $profileData = $data['profileData'];
    $fields = [];
    $params = [':id' => 1];

    $allowedFields = ['name', 'cnpj', 'address', 'phone', 'pixKeyType', 'pixKey', 'profilePicture', 'signatureImage'];

    foreach($allowedFields as $field) {
        if (isset($profileData[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $profileData[$field];
        }
    }

    if (empty($fields)) {
        send_response(false, "Nenhum campo para atualizar.", 400);
    }

    $setFields = implode(', ', $fields);
    $sql = "UPDATE school_profile SET {$setFields} WHERE id = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        // Retorna o perfil atualizado
        $stmt = $conn->prepare("SELECT * FROM school_profile WHERE id = 1");
        $stmt->execute();
        $updatedProfile = $stmt->fetch(PDO::FETCH_ASSOC);

        send_response(true, ['message' => 'Perfil da escola atualizado com sucesso.', 'profile' => $updatedProfile]);
    } catch (Exception $e) {
        send_response(false, "Erro ao atualizar perfil da escola: " . $e->getMessage(), 500);
    }
}

function handle_get_system_settings($conn, $data) {
    try {
        $stmt = $conn->prepare("SELECT * FROM system_settings WHERE id = 1");
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            // Converte os valores booleanos para o formato correto
            $settings['enableTerminationFine'] = (bool)$settings['enableTerminationFine'];
            $settings['terminationFineMonths'] = (int)$settings['terminationFineMonths'];
            send_response(true, ['settings' => $settings]);
        } else {
            send_response(false, "Configurações do sistema não encontradas.", 404);
        }
    } catch (Exception $e) {
        send_response(false, $e->getMessage(), 500);
    }
}

function handle_update_system_settings($conn, $data) {
    if (!isset($data['settingsData'])) {
        send_response(false, "Dados de configuração ausentes.", 400);
    }

    $settingsData = $data['settingsData'];
    $fields = [];
    $params = [':id' => 1];

    // Mapeia e sanitiza todos os campos de configuração
    $allowedFields = [
        'language', 'timeZone', 'currencySymbol', 'defaultDueDay',
        'geminiApiKey', 'geminiApiEndpoint', 'smtpServer', 'smtpPort', 
        'smtpUser', 'smtpPass', 'enableTerminationFine', 'terminationFineMonths'
    ];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $settingsData)) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $settingsData[$field];
        }
    }

    if (empty($fields)) {
        send_response(false, "Nenhum campo para atualizar.", 400);
    }

    $setFields = implode(', ', $fields);
    $sql = "UPDATE system_settings SET {$setFields} WHERE id = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        send_response(true, ['message' => 'Configurações do sistema atualizadas com sucesso.']);
    } catch (Exception $e) {
        send_response(false, "Erro ao atualizar configurações do sistema: " . $e->getMessage(), 500);
    }
}


function handle_export_database($conn, $data) {
    $exportData = [];
    $tablesToExport = ['users', 'courses', 'enrollments', 'payments', 'attendance', 'school_profile', 'system_settings']; 

    try {
        foreach ($tablesToExport as $table) {
            $stmt = $conn->query("SELECT * FROM $table");
            $exportData[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        send_response(true, ['exportData' => $exportData, 'message' => 'Dados exportados com sucesso.']);
    } catch (Exception $e) {
        send_response(false, "Erro ao exportar dados: " . $e->getMessage(), 500);
    }
}

function handle_update_document_templates($conn, $data) {
    $contractText = $data['enrollmentContractText'] ?? '';
    $termsText = $data['imageTermsText'] ?? '';

    $sql = "UPDATE system_settings SET enrollmentContractText = ?, imageTermsText = ? WHERE id = 1";
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute([$contractText, $termsText]);
        send_response(true, ['message' => 'Modelos de documentos salvos com sucesso.']);
    } catch (Exception $e) {
        send_response(false, "Erro ao salvar modelos: " . $e->getMessage(), 500);
    }
}
?>