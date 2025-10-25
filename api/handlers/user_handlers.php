<?php
// Helper para validar data no formato YYYY-MM-DD
function validateDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date); // Linha 4 CORRIGIDA
    return $d && $d->format($format) === $date;     // Linha 5 CORRIGIDA
}

function handle_get_dashboard_data($conn, $data) {
    // ... (código inalterado) ...
    $userId = isset($data['userId']) ? $data['userId'] : null;
    $role = isset($data['role']) ? $data['role'] : null;
    $response = ['courses' => [], 'enrollments' => [], 'attendance' => [], 'payments' => [], 'users' => [], 'teachers' => []];
    $response['courses'] = $conn->query("SELECT c.*, u.firstName as teacherFirstName, u.lastName as teacherLastName FROM courses c LEFT JOIN users u ON c.teacherId = u.id ORDER BY c.name ASC")->fetchAll(PDO::FETCH_ASSOC);
    if ($role === 'admin' || $role === 'superadmin') {
        $response['enrollments'] = $conn->query("SELECT e.*, c.name as courseName, u.firstName, u.lastName FROM enrollments e JOIN courses c ON e.courseId = c.id JOIN users u ON e.studentId = u.id")->fetchAll(PDO::FETCH_ASSOC);
        $response['users'] = $conn->query("SELECT id, firstName, lastName, email, role, birthDate FROM users")->fetchAll(PDO::FETCH_ASSOC);
    } else {
         $stmt = $conn->prepare("SELECT e.*, c.name as courseName FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE e.studentId = ?");
         $stmt->execute([$userId]);
         $response['enrollments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    switch ($role) {
        case 'student':
            $stmt = $conn->prepare("SELECT a.*, c.name as courseName FROM attendance a JOIN courses c ON a.courseId = c.id WHERE a.studentId = ? ORDER BY a.date DESC");
            $stmt->execute([$userId]);
            $response['attendance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt = $conn->prepare("SELECT p.*, c.name as courseName FROM payments p JOIN courses c ON p.courseId = c.id WHERE p.studentId = ? ORDER BY p.referenceDate DESC");
            $stmt->execute([$userId]);
            $response['payments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response['teachers'] = $conn->query("SELECT id, firstName, lastName FROM users WHERE role = 'teacher'")->fetchAll(PDO::FETCH_ASSOC);
            break;
        case 'teacher':
             // Assumindo que a tabela 'courses' tem uma coluna 'status'
             $stmt = $conn->prepare("SELECT c.*, u.firstName as teacherFirstName, u.lastName as teacherLastName FROM courses c LEFT JOIN users u ON c.teacherId = u.id WHERE c.teacherId = ? AND c.status = 'Aberto'");
             $stmt->execute([$userId]);
             $response['courses'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
    }
    send_response(true, $response);
}

function handle_get_profile_data($conn, $data) {
    // ... (código inalterado) ...
    $userId = $data['userId'] ?? 0;
    // Removida a coluna 'status' que não existe
    $stmt = $conn->prepare("SELECT id, firstName, lastName, email, role, age, profilePicture, address, rg, cpf, birthDate, guardianName, guardianRG, guardianCPF, guardianEmail, guardianPhone, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) { send_response(false, ['message' => "Usuário não encontrado."], 404); return; }
    unset($user['password_hash']); unset($user['reset_token']); unset($user['reset_token_expires_at']);
    $enrollments = []; $payments = [];
    if ($user['role'] === 'student') {
        $enrollStmt = $conn->prepare("SELECT e.*, c.name as courseName FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE e.studentId = ?");
        $enrollStmt->execute([$userId]); $enrollments = $enrollStmt->fetchAll(PDO::FETCH_ASSOC);
        $paymentStmt = $conn->prepare("SELECT p.*, c.name as courseName FROM payments p JOIN courses c ON p.courseId = c.id WHERE p.studentId = ? ORDER BY referenceDate DESC");
        $paymentStmt->execute([$userId]); $payments = $paymentStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    send_response(true, ['user' => $user, 'enrollments' => $enrollments, 'payments' => $payments]);
}

// <<< FUNÇÃO MODIFICADA (LOGS REMOVIDOS) >>>
function handle_update_profile($conn, $data) {
    $userId = $data['userId'] ?? 0;
    $profileData = $data['profileData'] ?? [];

    if ($userId <= 0) { send_response(false, ['message' => "ID de usuário inválido."], 400); return; }

    $allowedFields = [
        'firstName', 'lastName', 'address', 'rg', 'cpf', 'birthDate',
        'guardianName', 'guardianRG', 'guardianCPF', 'guardianEmail', 'guardianPhone'
    ];
    $fieldsToUpdate = [];
    $params = [':id' => $userId]; // Inicia com o ID
    $hasValidFields = false;

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $profileData)) {
            $value = $profileData[$field];
            $paramValue = null;

            if ($field === 'birthDate') {
                if ($value === '' || $value === null) {
                    $paramValue = null;
                } elseif (validateDate($value, 'Y-m-d')) {
                     $paramValue = $value;
                } else {
                     // error_log("Formato inválido para birthDate userId $userId: " . print_r($value, true)); // Mantido caso queira logar só o erro de data
                     send_response(false, ['message' => "Formato inválido para Data de Nascimento. Use AAAA-MM-DD."], 400);
                     return;
                }
            } else {
                 $optionalNullableFields = ['lastName', 'address', 'rg', 'cpf', 'guardianName', 'guardianRG', 'guardianCPF', 'guardianEmail', 'guardianPhone'];
                 if (in_array($field, $optionalNullableFields) && trim($value ?? '') === '') {
                     $paramValue = null;
                 } else {
                    $paramValue = trim($value ?? '');
                 }
            }
            $fieldsToUpdate[] = "`$field` = :$field";
            $params[":$field"] = $paramValue; // Adiciona o parâmetro ao array $params
            $hasValidFields = true;
        }
    }

    if (array_key_exists('profilePicture', $profileData)) {
         $paramValue = ($profileData['profilePicture'] === '' || $profileData['profilePicture'] === null) ? null : $profileData['profilePicture'];
         $fieldsToUpdate[] = "`profilePicture` = :profilePicture";
         $params[':profilePicture'] = $paramValue;
         $hasValidFields = true;
    }

    // --- BLOCO DE CÁLCULO DE IDADE (RESTAURADO) ---
     if (array_key_exists('birthDate', $profileData)) {
         try {
             $age = null;
             $birthDateValue = $params[':birthDate'] ?? null;
             if ($birthDateValue !== null && validateDate($birthDateValue, 'Y-m-d')) {
                  $birth = new DateTime($birthDateValue);
                  $today = new DateTime('today');
                  $age = $birth->diff($today)->y;
             }
             $ageFieldExists = false;
             foreach ($fieldsToUpdate as $f) { if (strpos($f, '`age`') === 0) { $ageFieldExists = true; break; } }
             if (!$ageFieldExists) { $fieldsToUpdate[] = "`age` = :age"; }
             $params[':age'] = $age;
             $hasValidFields = true;
         } catch (Exception $e) {
             error_log("Erro ao calcular/processar idade para userId $userId: " . $e->getMessage());
         }
     }
    // --- FIM DO BLOCO ---


    if (!$hasValidFields) {
        // ** CORREÇÃO: Envia uma resposta de sucesso mesmo se nada mudou **
        // Isso evita o erro "Unexpected end of JSON input" no frontend
        $stmtGet = $conn->prepare("SELECT id, firstName, lastName, email, role, age, profilePicture, address, rg, cpf, birthDate, guardianName, guardianRG, guardianCPF, guardianEmail, guardianPhone, created_at FROM users WHERE id = ?");
        $stmtGet->execute([$userId]);
        $currentUser = $stmtGet->fetch(PDO::FETCH_ASSOC);
        if ($currentUser) {
            unset($currentUser['password_hash']);
            send_response(true, ['message' => 'Nenhum campo alterado.', 'updatedUser' => $currentUser, 'success' => true]);
        } else {
            send_response(false, ['message' => 'Usuário não encontrado.'], 404);
        }
        return;
    }

    $sql = "UPDATE `users` SET " . implode(', ', $fieldsToUpdate) . " WHERE `id` = :id";

    try {
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            $errorInfo = $conn->errorInfo();
            error_log("Falha ao PREPARAR SQL para userId $userId: " . ($errorInfo[2] ?? 'Erro desconhecido'));
            send_response(false, ['message' => 'Erro interno ao preparar a atualização: ' . ($errorInfo[2] ?? 'Verifique os logs')], 500);
            return;
        }

        $success = $stmt->execute($params);

        if ($success) {
             $stmtGet = $conn->prepare("SELECT id, firstName, lastName, email, role, age, profilePicture, address, rg, cpf, birthDate, guardianName, guardianRG, guardianCPF, guardianEmail, guardianPhone, created_at FROM users WHERE id = ?");
             $stmtGet->execute([$userId]);
             $updatedUser = $stmtGet->fetch(PDO::FETCH_ASSOC);
             if ($updatedUser) {
                  unset($updatedUser['password_hash']);
                  send_response(true, ['message' => 'Perfil salvo com sucesso.', 'updatedUser' => $updatedUser, 'success' => true]);
             } else { send_response(false, ['message' => 'Usuário não encontrado após atualização.'], 404); }
        } else {
            $errorInfo = $stmt->errorInfo();
            error_log("Falha ao EXECUTAR UPDATE do perfil userId $userId: " . ($errorInfo[2] ?? 'Erro desconhecido'));
            send_response(false, ['message' => 'Falha ao salvar no banco de dados: ' . ($errorInfo[2] ?? 'Verifique os logs')], 500);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO EXCEPTION em handle_update_profile userId $userId: " . $e->getMessage());
        send_response(false, ['message' => 'Erro Crítico de Banco de Dados: ' . $e->getMessage()], 500);
    }
    catch (Exception $e) {
        error_log("Erro GERAL EXCEPTION em handle_update_profile userId $userId: " . $e->getMessage());
        send_response(false, ['message' => 'Erro Geral no servidor: ' . $e->getMessage()], 500);
    }
}


// --- FUNÇÃO IMPLEMENTADA ---
function handle_get_teachers($conn, $data) {
    try {
        $stmt = $conn->query("SELECT id, firstName, lastName FROM users WHERE role = 'teacher' ORDER BY firstName, lastName");
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response(true, ['teachers' => $teachers]); // <<< Ajuste opcional para consistência
    } catch (PDOException $e) {
        error_log("Erro em handle_get_teachers: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao buscar professores.'], 500);
    }
}

// --- FUNÇÃO IMPLEMENTADA (CORRIGIDA) ---
function handle_get_active_students($conn, $data) {
    try {
        // Busca alunos (removida a filtragem por 'status' que não existe)
        $stmt = $conn->query("SELECT id, firstName, lastName, email FROM users WHERE role = 'student' ORDER BY firstName, lastName");
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // ** CORREÇÃO AQUI: Envia a resposta dentro de um objeto com a chave 'students' **
        send_response(true, ['students' => $students]);
    } catch (PDOException $e) {
        error_log("Erro em handle_get_active_students: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao buscar alunos ativos.'], 500);
    }
}

// --- FUNÇÃO IMPLEMENTADA (CORRIGIDA - sem 'status') ---
function handle_get_filtered_users($conn, $filters) {
    // Valores padrão para paginação e ordenação
    $page = isset($filters['page']) ? (int)$filters['page'] : 1;
    $limit = isset($filters['limit']) ? (int)$filters['limit'] : 20;
    $offset = ($page - 1) * $limit;

    // Garante que $limit não seja zero para evitar divisão por zero
    if ($limit <= 0) $limit = 20;

    $sortBy = $filters['sortBy'] ?? 'lastName';
    $sortOrder = $filters['sortOrder'] ?? 'ASC';

    // Lista segura de colunas para ordenação (removida a coluna 'status')
    $allowedSortColumns = ['id', 'firstName', 'lastName', 'email', 'role', 'created_at'];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'lastName';
    }
    if (strtoupper($sortOrder) !== 'ASC') {
        $sortOrder = 'DESC';
    }

    // Filtros
    $searchTerm = $filters['searchTerm'] ?? null;
    $role = $filters['role'] ?? null;
    // Removido o filtro de 'status'

    // Base da query
    $baseSql = "FROM users";
    $whereClauses = [];
    $params = [];

    // Adiciona filtros dinamicamente
    if ($searchTerm) {
        $whereClauses[] = "(firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)";
        $likeTerm = "%$searchTerm%";
        $params[] = $likeTerm;
        $params[] = $likeTerm;
        $params[] = $likeTerm;
    }

    if ($role && $role !== 'all') {
        $whereClauses[] = "role = ?";
        $params[] = $role;
    }

    // Removido o bloco if ($status ...)

    $whereSql = "";
    if (!empty($whereClauses)) {
        $whereSql = " WHERE " . implode(' AND ', $whereClauses);
    }

    try {
        // 1. Obter contagem total para paginação (com filtros)
        $countSql = "SELECT COUNT(*) as total $baseSql $whereSql";
        $countStmt = $conn->prepare($countSql);
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Obter usuários paginados (com filtros e ordenação)
        // Seleciona colunas seguras (removida a coluna 'status')
        $usersSql = "SELECT id, firstName, lastName, email, role, birthDate, created_at, profilePicture $baseSql $whereSql ORDER BY `$sortBy` $sortOrder LIMIT ? OFFSET ?";

        $userStmt = $conn->prepare($usersSql);

        // Precisamos usar bindValue para LIMIT/OFFSET por causa do tipo INT
        $paramIndex = 1;
        foreach ($params as $value) {
            $userStmt->bindValue($paramIndex, $value);
            $paramIndex++;
        }
        $userStmt->bindValue($paramIndex++, (int)$limit, PDO::PARAM_INT);
        $userStmt->bindValue($paramIndex++, (int)$offset, PDO::PARAM_INT);

        $userStmt->execute();
        $users = $userStmt->fetchAll(PDO::FETCH_ASSOC);

        // Prepara a resposta
        $response = [
            'users' => $users,
            'pagination' => [
                'totalItems' => $totalCount,
                'totalPages' => ceil($totalCount / $limit),
                'currentPage' => $page,
                'limit' => $limit
            ]
        ];

        send_response(true, $response);

    } catch (PDOException $e) {
        error_log("Erro em handle_get_filtered_users: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao buscar usuários: ' . $e->getMessage()], 500);
    }
}


// --- FUNÇÃO IMPLEMENTADA ---
function handle_update_user_role($conn, $data) {
    $userId = $data['userId'] ?? 0;
    $newRole = $data['newRole'] ?? '';

    // Validação simples
    if ($userId <= 0) {
        send_response(false, ['message' => 'ID de usuário inválido.'], 400);
        return;
    }
    $allowedRoles = ['student', 'teacher', 'admin', 'superadmin'];
    if (!in_array($newRole, $allowedRoles)) {
        send_response(false, ['message' => 'Cargo inválido selecionado.'], 400);
        return;
    }

    // TODO: Adicionar verificação de permissão (ex: somente superadmin pode definir outro superadmin)

    try {
        $sql = "UPDATE users SET role = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $success = $stmt->execute([$newRole, $userId]);

        if ($success) {
            send_response(true, ['message' => 'Cargo do usuário atualizado com sucesso.']);
        } else {
            send_response(false, ['message' => 'Falha ao atualizar o cargo do usuário.'], 500);
        }
    } catch (PDOException $e) {
        error_log("Erro em handle_update_user_role: " . $e->getMessage());
        send_response(false, ['message' => 'Erro de banco de dados ao atualizar cargo.'], 500);
    }
}

?>