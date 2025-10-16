<?php
function handle_get_school_profile($conn, $data) {
    $stmt = $conn->prepare("SELECT * FROM school_profile WHERE id = 1");
    $stmt->execute();
    $profile = $stmt->fetch();
    send_response(true, ['profile' => $profile]);
}

function handle_update_school_profile($conn, $data) {
    $profileData = $data['profileData'];
    $sql = "UPDATE school_profile SET name = ?, cnpj = ?, address = ?, phone = ?, pixKeyType = ?, pixKey = ?";
    $params = [
        isset($profileData['name']) ? $profileData['name'] : null,
        isset($profileData['cnpj']) ? $profileData['cnpj'] : null,
        isset($profileData['address']) ? $profileData['address'] : null,
        isset($profileData['phone']) ? $profileData['phone'] : null,
        isset($profileData['pixKeyType']) ? $profileData['pixKeyType'] : null,
        isset($profileData['pixKey']) ? $profileData['pixKey'] : null
    ];
    if (!empty($profileData['profilePicture'])) {
        $sql .= ", profilePicture = ?";
        $params[] = $profileData['profilePicture'];
    }
    $sql .= " WHERE id = 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $profileStmt = $conn->prepare("SELECT * FROM school_profile WHERE id = 1");
    $profileStmt->execute();
    $updatedProfile = $profileStmt->fetch();
    send_response(true, ['message' => 'Perfil da escola atualizado.', 'profile' => $updatedProfile]);
}

function handle_get_system_settings($conn, $data) {
    $settings = $conn->query("SELECT * FROM system_settings WHERE id = 1")->fetch();
    send_response(true, ['settings' => $settings]);
}

function handle_update_system_settings($conn, $data) {
    $settingsData = $data['settingsData'];
    $sql = "UPDATE system_settings SET 
                language = ?, timeZone = ?, currencySymbol = ?, defaultDueDay = ?,
                geminiApiKey = ?,
                smtpServer = ?, smtpPort = ?, smtpUser = ?, smtpPass = ?,
                enableTerminationFine = ?, terminationFineMonths = ?
            WHERE id = 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $settingsData['language'], $settingsData['timeZone'], $settingsData['currencySymbol'], $settingsData['defaultDueDay'],
        $settingsData['geminiApiKey'],
        $settingsData['smtpServer'], $settingsData['smtpPort'], $settingsData['smtpUser'], $settingsData['smtpPass'],
        $settingsData['enableTerminationFine'], $settingsData['terminationFineMonths']
    ]);
    send_response(true, ['message' => 'Configurações salvas.']);
}

function handle_export_database($conn, $data) {
    $tables = ['users', 'courses', 'enrollments', 'attendance', 'payments', 'school_profile', 'system_settings'];
    $exportData = [];
    foreach ($tables as $table) {
        $exportData[$table] = $conn->query("SELECT * FROM $table")->fetchAll();
    }
    send_response(true, ['exportData' => $exportData]);
}
?>