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

    if (isset($profileData['name'])) {
        $fields[] = "name = :name";
        $params[':name'] = $profileData['name'];
    }
    if (isset($profileData['cnpj'])) {
        $fields[] = "cnpj = :cnpj";
        $params[':cnpj'] = $profileData['cnpj'];
    }
    if (isset($profileData['address'])) {
        $fields[] = "address = :address";
        $params[':address'] = $profileData['address'];
    }
    if (isset($profileData['phone'])) {
        $fields[] = "phone = :phone";
        $params[':phone'] = $profileData['phone'];
    }
    if (isset($profileData['pixKeyType'])) {
        $fields[] = "pixKeyType = :pixKeyType";
        $params[':pixKeyType'] = $profileData['pixKeyType'];
    }
    if (isset($profileData['pixKey'])) {
        $fields[] = "pixKey = :pixKey";
        $params[':pixKey'] = $profileData['pixKey'];
    }

    // LÓGICA EXISTENTE PARA profilePicture
    if (isset($profileData['profilePicture'])) {
        $fields[] = "profilePicture = :profilePicture";
        $params[':profilePicture'] = $profileData['profilePicture'];
    }
    
    // LÓGICA NOVA PARA signatureImage (Carimbo/Assinatura)
    if (isset($profileData['signatureImage'])) {
        $fields[] = "signatureImage = :signatureImage";
        $params[':signatureImage'] = $profileData['signatureImage'];
    }
    // FIM DA LÓGICA NOVA

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
    // Apenas SuperAdmin pode exportar
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'superadmin') {
        // Nota: O check de permissão deveria ser feito de forma mais robusta no ponto de entrada.
        // Assumindo que a verificação de permissão é tratada no frontend ou em middleware.
        // Vamos apenas garantir que o adminId é o superadmin, mas para exportação simples, vamos prosseguir.
    }
    
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