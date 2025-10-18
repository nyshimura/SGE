<?php
function handle_get_dashboard_data($conn, $data) {
    $userId = isset($data['userId']) ? $data['userId'] : null;
    $role = isset($data['role']) ? $data['role'] : null;
    $response = ['courses' => [], 'enrollments' => [], 'attendance' => [], 'payments' => [], 'users' => [], 'teachers' => []];
    $response['courses'] = $conn->query("SELECT * FROM courses ORDER BY name ASC")->fetchAll();
    if ($role === 'admin' || $role === 'superadmin') {
        $response['enrollments'] = $conn->query("SELECT e.*, c.name as courseName, u.firstName, u.lastName FROM enrollments e JOIN courses c ON e.courseId = c.id JOIN users u ON e.studentId = u.id")->fetchAll();
        $response['users'] = $conn->query("SELECT id, firstName, lastName, email, role FROM users")->fetchAll();
    } else {
         $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ?");
         $stmt->execute([$userId]);
         $response['enrollments'] = $stmt->fetchAll();
    }
    switch ($role) {
        case 'student':
            $stmt = $conn->prepare("SELECT * FROM attendance WHERE studentId = ? ORDER BY date DESC");
            $stmt->execute([$userId]);
            $response['attendance'] = $stmt->fetchAll();
            $stmt = $conn->prepare("SELECT * FROM payments WHERE studentId = ? ORDER BY referenceDate DESC");
            $stmt->execute([$userId]);
            $response['payments'] = $stmt->fetchAll();
            $response['teachers'] = $conn->query("SELECT id, firstName, lastName FROM users WHERE role = 'teacher'")->fetchAll();
            break;
        case 'teacher':
             $stmt = $conn->prepare("SELECT * FROM courses WHERE teacherId = ? AND status = 'Aberto'");
             $stmt->execute([$userId]);
             $response['courses'] = $stmt->fetchAll();
            break;
    }
    send_response(true, $response);
}

function handle_get_profile_data($conn, $data) {
    $userId = $data['userId'] ?? 0;

    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        send_response(false, "Usuário não encontrado.", 404);
    }

    $enrollments = [];
    $payments = [];
    if ($user['role'] === 'student') {
        $enrollStmt = $conn->prepare("
            SELECT e.*, c.name as courseName 
            FROM enrollments e 
            JOIN courses c ON e.courseId = c.id 
            WHERE e.studentId = ?
        ");
        $enrollStmt->execute([$userId]);
        $enrollments = $enrollStmt->fetchAll(PDO::FETCH_ASSOC);

        $paymentStmt = $conn->prepare("SELECT * FROM payments WHERE studentId = ? ORDER BY referenceDate DESC");
        $paymentStmt->execute([$userId]);
        $payments = $paymentStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    send_response(true, [
        'user' => $user,
        'enrollments' => $enrollments,
        'payments' => $payments
    ]);
}

function handle_update_profile($conn, $data) {
    $userId = $data['userId'] ?? 0;
    $profileData = $data['profileData'] ?? [];

    if ($userId <= 0) {
        send_response(false, "ID de usuário inválido.", 400);
    }

    $allowedFields = [
        'firstName', 'lastName', 'age', 'address', 'rg', 'cpf',
        'guardianName', 'guardianRG', 'guardianCPF', 'guardianEmail', 'guardianPhone'
    ];
    $fieldsToUpdate = [];
    $params = [':id' => $userId];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $profileData)) { // Use array_key_exists to allow empty strings
            $fieldsToUpdate[] = "$field = :$field";
            $params[":$field"] = $profileData[$field] === '' ? null : $profileData[$field];
        }
    }
    
    if (isset($profileData['profilePicture'])) {
        $fieldsToUpdate[] = "profilePicture = :profilePicture";
        $params[':profilePicture'] = $profileData['profilePicture'];
    }

    if (empty($fieldsToUpdate)) {
        send_response(true, ['message' => 'Nenhum dado para atualizar.']);
        return;
    }

    $sql = "UPDATE users SET " . implode(', ', $fieldsToUpdate) . " WHERE id = :id";
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        send_response(true, ['message' => 'Perfil atualizado com sucesso.']);
    } catch (Exception $e) {
        send_response(false, "Erro ao atualizar perfil: " . $e->getMessage(), 500);
    }
}

function handle_get_teachers($conn, $data) {
    $teachers = $conn->query("SELECT id, firstName, lastName FROM users WHERE role = 'teacher' ORDER BY firstName ASC")->fetchAll();
    send_response(true, ['teachers' => $teachers]);
}

function handle_get_active_students($conn, $data) {
    $sql = "SELECT DISTINCT u.id, u.firstName, u.lastName, u.email FROM users u 
            JOIN enrollments e ON u.id = e.studentId 
            WHERE e.status = 'Aprovada' ORDER BY u.firstName ASC";
    $students = $conn->query($sql)->fetchAll();
    send_response(true, ['students' => $students]);
}

function handle_get_filtered_users($conn, $filters) {
    $name = isset($filters['name']) ? $filters['name'] : '';
    $role = isset($filters['role']) ? $filters['role'] : 'all';
    $courseId = isset($filters['courseId']) ? $filters['courseId'] : 'all';
    $enrollmentStatus = isset($filters['enrollmentStatus']) ? $filters['enrollmentStatus'] : 'all';
    $query = "SELECT u.id, u.firstName, u.lastName, u.email, u.role FROM users u";
    $params = [];
    $whereClauses = [];
    if ($courseId !== 'all') {
        $query .= " JOIN enrollments e ON u.id = e.studentId";
        $whereClauses[] = "e.courseId = ?";
        $params[] = $courseId;
        if ($enrollmentStatus !== 'all') {
            $whereClauses[] = "e.status = ?";
            $params[] = $enrollmentStatus;
        }
    }
    if (!empty($name)) {
        $whereClauses[] = "(u.firstName LIKE ? OR u.lastName LIKE ?)";
        $params[] = "%$name%";
        $params[] = "%$name%";
    }
    if ($role !== 'all') {
        $whereClauses[] = "u.role = ?";
        $params[] = $role;
    }
    if (!empty($whereClauses)) {
        $query .= " WHERE " . implode(" AND ", $whereClauses);
    }
    $query .= " GROUP BY u.id ORDER BY u.firstName ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    $courses = $conn->query("SELECT id, name FROM courses ORDER BY name ASC")->fetchAll();
    send_response(true, ['users' => $users, 'courses' => $courses]);
}

function handle_update_user_role($conn, $data) {
    $userId = $data['userId'];
    $newRole = $data['newRole'];
    $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->execute([$newRole, $userId]);
    send_response(true, ['message' => 'Função do usuário atualizada.']);
}
?>