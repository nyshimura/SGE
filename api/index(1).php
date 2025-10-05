<?php
/**
 * Ponto de Entrada da API (Roteador Principal)
 *
 * Responsável por:
 * 1. Incluir a configuração do banco de dados.
 * 2. Receber e identificar a 'ação' solicitada pelo frontend.
 * 3. Rotear a solicitação para a função correspondente.
 * 4. Lidar com os dados de entrada (JSON do corpo da requisição ou parâmetros GET).
 * 5. Capturar exceções e retornar respostas de erro padronizadas.
 */

// Inclui o arquivo de configuração que já estabelece a conexão com o BD ($conn)
require_once '/sge/api/config.php';

// --- FUNÇÃO AUXILIAR PARA ENVIAR RESPOSTAS ---
/**
 * Envia uma resposta JSON padronizada e encerra o script.
 * @param bool $success - Indica se a operação foi bem-sucedida.
 * @param mixed $data - Os dados a serem enviados (em caso de sucesso) ou uma mensagem de erro.
 * @param int $statusCode - O código de status HTTP (padrão 200).
 */
function send_response($success, $data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(['success' => $success, 'data' => $data]);
    exit();
}

// --- ROTEDOR PRINCIPAL ---

// Pega a ação da requisição (seja GET ou POST)
$action = $_REQUEST['action'] ?? null;

// Pega o corpo da requisição (para dados enviados via POST em formato JSON)
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {
        case 'login':
            handle_login($conn, $input);
            break;
        case 'register':
            handle_register($conn, $input);
            break;
        case 'getDashboardData':
             handle_get_dashboard_data($conn, $_GET);
            break;
        case 'getSchoolProfile':
            handle_get_school_profile($conn);
            break;
        case 'getTeachers':
            handle_get_teachers($conn);
            break;
        case 'enroll':
            handle_enroll($conn, $input);
            break;
        case 'approveEnrollment':
            handle_approve_enrollment($conn, $input);
            break;
        case 'createCourse':
            handle_create_course($conn, $input['courseData']);
            break;
        case 'updateCourse':
            handle_update_course($conn, $input['courseData']);
            break;
        case 'endCourse':
            handle_end_course($conn, $input);
            break;
        case 'reopenCourse':
            handle_reopen_course($conn, $input);
            break;
        case 'getFilteredUsers':
            handle_get_filtered_users($conn, $input);
            break;
        case 'updateUserRole':
            handle_update_user_role($conn, $input);
            break;
        case 'getAttendanceData':
            handle_get_attendance_data($conn, $_GET);
            break;
        case 'saveAttendance':
            handle_save_attendance($conn, $input);
            break;
        case 'getCourseDetails':
            handle_get_course_details($conn, $_GET);
            break;
        case 'getProfileData':
            handle_get_profile_data($conn, $_GET);
            break;
        case 'updateProfile':
            handle_update_profile($conn, $input);
            break;
        case 'updateSchoolProfile':
            handle_update_school_profile($conn, $input['profileData']);
            break;
        case 'getFinancialDashboardData':
            handle_get_financial_dashboard_data($conn, $_GET);
            break;
        case 'getActiveStudents':
            handle_get_active_students($conn);
            break;
        case 'getStudentPayments':
            handle_get_student_payments($conn, $_GET);
            break;
        case 'updatePaymentStatus':
            handle_update_payment_status($conn, $input);
            break;
        case 'getSystemSettings':
            handle_get_system_settings($conn);
            break;
        case 'updateSystemSettings':
            handle_update_system_settings($conn, $input['settingsData']);
            break;
        case 'exportDatabase':
            handle_export_database($conn);
            break;

        default:
            send_response(false, 'Ação desconhecida ou não especificada.', 400);
            break;
    }
} catch (PDOException $e) {
    // Captura erros específicos do banco de dados
    send_response(false, "Erro no banco de dados: " . $e->getMessage(), 500);
} catch (Exception $e) {
    // Captura outros erros gerais
    send_response(false, "Erro interno do servidor: " . $e->getMessage(), 500);
}

// --- IMPLEMENTAÇÃO DAS FUNÇÕES HANDLER ---

function handle_login($conn, $data) {
    $email = $data['email'] ?? null;
    $password = $data['password'] ?? null;

    if (!$email || !$password) {
        send_response(false, 'Email e senha são obrigatórios.', 400);
    }

    $stmt = $conn->prepare("SELECT id, firstName, lastName, email, role, profilePicture, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        unset($user['password_hash']); // Nunca envie o hash da senha para o cliente
        send_response(true, ['user' => $user]);
    } else {
        send_response(false, 'Email ou senha inválidos.', 401);
    }
}

function handle_register($conn, $data) {
    $name = $data['name'] ?? null;
    $email = $data['email'] ?? null;
    $password = $data['password'] ?? null;

    if (!$name || !$email || !$password) {
        send_response(false, 'Nome, email e senha são obrigatórios.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(false, 'Formato de email inválido.', 400);
    }

    // Verifica se o email já existe
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        send_response(false, 'Este email já está em uso.', 409);
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (firstName, email, password_hash, role) VALUES (?, ?, ?, 'unassigned')");
    $success = $stmt->execute([$name, $email, $password_hash]);

    if ($success) {
        send_response(true, ['message' => 'Usuário cadastrado com sucesso.']);
    } else {
        send_response(false, 'Falha ao cadastrar usuário.', 500);
    }
}

function handle_get_dashboard_data($conn, $data) {
    $userId = $data['userId'] ?? null;
    $role = $data['role'] ?? null;

    $response = [
        'courses' => [],
        'enrollments' => [],
        'attendance' => [],
        'payments' => [],
        'users' => [],
        'teachers' => [],
    ];
    
    // Todos os perfis precisam de cursos
    $response['courses'] = $conn->query("SELECT * FROM courses ORDER BY name ASC")->fetchAll();
    
    switch ($role) {
        case 'student':
            $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ?");
            $stmt->execute([$userId]);
            $response['enrollments'] = $stmt->fetchAll();

            $stmt = $conn->prepare("SELECT * FROM attendance WHERE studentId = ? ORDER BY date DESC");
            $stmt->execute([$userId]);
            $response['attendance'] = $stmt->fetchAll();

            $stmt = $conn->prepare("SELECT * FROM payments WHERE studentId = ? ORDER BY referenceDate DESC");
            $stmt->execute([$userId]);
            $response['payments'] = $stmt->fetchAll();
            
            $response['teachers'] = $conn->query("SELECT id, firstName, lastName FROM users WHERE role = 'teacher'")->fetchAll();
            break;

        case 'admin':
        case 'superadmin':
            $response['enrollments'] = $conn->query("SELECT * FROM enrollments")->fetchAll();
            $response['users'] = $conn->query("SELECT id, firstName, lastName, email, role FROM users")->fetchAll();
            break;
        
        case 'teacher':
             $stmt = $conn->prepare("SELECT * FROM courses WHERE teacherId = ? AND status = 'Aberto'");
             $stmt->execute([$userId]);
             $response['courses'] = $stmt->fetchAll();
            break;
    }

    send_response(true, $response);
}

function handle_get_school_profile($conn) {
    $profile = $conn->query("SELECT * FROM school_profile WHERE id = 1")->fetch();
    send_response(true, ['profile' => $profile]);
}

function handle_get_teachers($conn) {
    $teachers = $conn->query("SELECT id, firstName, lastName FROM users WHERE role = 'teacher' ORDER BY firstName ASC")->fetchAll();
    send_response(true, ['teachers' => $teachers]);
}

function handle_enroll($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];

    // Evitar duplicidade de matrícula pendente/aprovada
    $stmt = $conn->prepare("SELECT * FROM enrollments WHERE studentId = ? AND courseId = ? AND (status = 'Pendente' OR status = 'Aprovada')");
    $stmt->execute([$studentId, $courseId]);
    if ($stmt->fetch()) {
        send_response(false, 'Você já possui uma matrícula ativa ou pendente para este curso.', 409);
    }
    
    $stmt = $conn->prepare("INSERT INTO enrollments (studentId, courseId, status) VALUES (?, ?, 'Pendente')");
    $stmt->execute([$studentId, $courseId]);

    send_response(true, ['message' => 'Solicitação de matrícula enviada.']);
}

function handle_approve_enrollment($conn, $data) {
    $studentId = $data['studentId'];
    $courseId = $data['courseId'];
    $billingStartChoice = $data['billingStartChoice'];

    $conn->beginTransaction();

    try {
        $today = new DateTime('now', new DateTimeZone('UTC'));
        if ($billingStartChoice === 'next_month') {
            $today->modify('first day of next month');
        } else {
            $today->modify('first day of this month');
        }
        $billingStartDate = $today->format('Y-m-d');

        $stmt = $conn->prepare("UPDATE enrollments SET status = 'Aprovada', billingStartDate = ? WHERE studentId = ? AND courseId = ?");
        $stmt->execute([$billingStartDate, $studentId, $courseId]);
        
        // --- Lógica de Geração de Pagamentos ---
        $stmtCourse = $conn->prepare("SELECT monthlyFee, paymentType, installments FROM courses WHERE id = ?");
        $stmtCourse->execute([$courseId]);
        $course = $stmtCourse->fetch();
        
        $stmtSettings = $conn->query("SELECT defaultDueDay FROM system_settings WHERE id = 1");
        $settings = $stmtSettings->fetch();
        $dueDay = $settings['defaultDueDay'] ?? 10;

        if ($course && $course['monthlyFee'] > 0) {
            $limit = ($course['paymentType'] === 'parcelado' && $course['installments'] > 0) ? $course['installments'] : 12; // Gera até 12 parcelas recorrentes
            
            $cursorDate = new DateTime($billingStartDate, new DateTimeZone('UTC'));

            for ($i = 0; $i < $limit; $i++) {
                $refDate = $cursorDate->format('Y-m-01');
                $dueDate = $cursorDate->format('Y-m-') . str_pad($dueDay, 2, '0', STR_PAD_LEFT);
                
                $stmtInsertPayment = $conn->prepare("INSERT INTO payments (studentId, courseId, amount, referenceDate, dueDate, status) VALUES (?, ?, ?, ?, ?, 'Pendente')");
                $stmtInsertPayment->execute([$studentId, $courseId, $course['monthlyFee'], $refDate, $dueDate]);
                
                $cursorDate->modify('+1 month');
            }
        }
        
        $conn->commit();
        send_response(true, ['message' => 'Matrícula aprovada e pagamentos gerados.']);

    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao aprovar matrícula: ' . $e->getMessage(), 500);
    }
}


function handle_create_course($conn, $data) {
    // Extrai e sanitiza os dados de entrada
    $name = trim($data['courseName']);
    $description = trim($data['courseDescription']);
    $teacherId = filter_var($data['teacherId'], FILTER_VALIDATE_INT);
    $totalSlots = !empty($data['totalSlots']) ? filter_var($data['totalSlots'], FILTER_VALIDATE_INT) : null;
    $monthlyFee = filter_var($data['monthlyFee'], FILTER_VALIDATE_FLOAT);
    $paymentType = $data['paymentType'];
    $installments = ($paymentType === 'parcelado' && !empty($data['installments'])) ? filter_var($data['installments'], FILTER_VALIDATE_INT) : null;
    $dayOfWeek = !empty($data['dayOfWeek']) ? trim($data['dayOfWeek']) : null;
    $startTime = !empty($data['startTime']) ? trim($data['startTime']) : null;
    $endTime = !empty($data['endTime']) ? trim($data['endTime']) : null;

    $sql = "INSERT INTO courses (name, description, teacherId, totalSlots, status, monthlyFee, paymentType, installments, dayOfWeek, startTime, endTime) 
            VALUES (?, ?, ?, ?, 'Aberto', ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $teacherId, $totalSlots, $monthlyFee, $paymentType, $installments, $dayOfWeek, $startTime, $endTime]);
    
    send_response(true, ['message' => 'Curso criado com sucesso.']);
}

function handle_update_course($conn, $data) {
    $courseId = filter_var($data['courseId'], FILTER_VALIDATE_INT);
    $name = trim($data['courseName']);
    $description = trim($data['courseDescription']);
    $teacherId = filter_var($data['teacherId'], FILTER_VALIDATE_INT);
    $totalSlots = !empty($data['totalSlots']) ? filter_var($data['totalSlots'], FILTER_VALIDATE_INT) : null;
    $monthlyFee = filter_var($data['monthlyFee'], FILTER_VALIDATE_FLOAT);
    $paymentType = $data['paymentType'];
    $installments = ($paymentType === 'parcelado' && !empty($data['installments'])) ? filter_var($data['installments'], FILTER_VALIDATE_INT) : null;
    $dayOfWeek = !empty($data['dayOfWeek']) ? trim($data['dayOfWeek']) : null;
    $startTime = !empty($data['startTime']) ? trim($data['startTime']) : null;
    $endTime = !empty($data['endTime']) ? trim($data['endTime']) : null;

    $sql = "UPDATE courses SET name = ?, description = ?, teacherId = ?, totalSlots = ?, monthlyFee = ?, paymentType = ?, installments = ?, dayOfWeek = ?, startTime = ?, endTime = ?
            WHERE id = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $teacherId, $totalSlots, $monthlyFee, $paymentType, $installments, $dayOfWeek, $startTime, $endTime, $courseId]);

    send_response(true, ['message' => 'Curso atualizado com sucesso.']);
}

function handle_end_course($conn, $data) {
    $courseId = $data['courseId'];
    $adminId = $data['adminId'];
    $date = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("UPDATE courses SET status = 'Encerrado', closed_by_admin_id = ?, closed_date = ? WHERE id = ?");
    $stmt->execute([$adminId, $date, $courseId]);

    send_response(true, ['message' => 'Curso encerrado.']);
}

function handle_reopen_course($conn, $data) {
    $courseId = $data['courseId'];
    $stmt = $conn->prepare("UPDATE courses SET status = 'Aberto', closed_by_admin_id = NULL, closed_date = NULL WHERE id = ?");
    $stmt->execute([$courseId]);
    send_response(true, ['message' => 'Curso reaberto.']);
}

function handle_get_filtered_users($conn, $filters) {
    $name = $filters['name'] ?? '';
    $role = $filters['role'] ?? 'all';
    $courseId = $filters['courseId'] ?? 'all';
    $enrollmentStatus = $filters['enrollmentStatus'] ?? 'all';
    
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

function handle_get_attendance_data($conn, $data) {
    $courseId = $data['courseId'];
    $date = $data['date'];
    
    $stmtCourse = $conn->prepare("SELECT * FROM courses WHERE id = ?");
    $stmtCourse->execute([$courseId]);
    $course = $stmtCourse->fetch();

    $stmtStudents = $conn->prepare("SELECT u.id, u.firstName, u.lastName FROM users u JOIN enrollments e ON u.id = e.studentId WHERE e.courseId = ? AND e.status = 'Aprovada' ORDER BY u.firstName");
    $stmtStudents->execute([$courseId]);
    $students = $stmtStudents->fetchAll();

    $stmtRecords = $conn->prepare("SELECT * FROM attendance WHERE courseId = ? AND date = ?");
    $stmtRecords->execute([$courseId, $date]);
    $recordsForDate = $stmtRecords->fetchAll();

    // Histórico
    $stmtHistory = $conn->prepare("SELECT date, status, COUNT(*) as count FROM attendance WHERE courseId = ? GROUP BY date, status ORDER BY date DESC");
    $stmtHistory->execute([$courseId]);
    $rawHistory = $stmtHistory->fetchAll();
    
    $history = [];
    foreach ($rawHistory as $row) {
        if (!isset($history[$row['date']])) {
            $history[$row['date']] = ['presentes' => 0, 'faltas' => 0];
        }
        if ($row['status'] === 'Presente') {
            $history[$row['date']]['presentes'] = $row['count'];
        } else {
            $history[$row['date']]['faltas'] = $row['count'];
        }
    }

    send_response(true, [
        'course' => $course,
        'students' => $students,
        'recordsForDate' => $recordsForDate,
        'history' => $history
    ]);
}

function handle_save_attendance($conn, $data) {
    $courseId = $data['courseId'];
    $date = $data['date'];
    $absentStudentIds = $data['absentStudentIds'] ?? [];

    $conn->beginTransaction();
    try {
        // Apaga registros existentes para essa data para permitir edição
        $stmtDelete = $conn->prepare("DELETE FROM attendance WHERE courseId = ? AND date = ?");
        $stmtDelete->execute([$courseId, $date]);

        // Pega todos os alunos aprovados no curso
        $stmtStudents = $conn->prepare("SELECT studentId FROM enrollments WHERE courseId = ? AND status = 'Aprovada'");
        $stmtStudents->execute([$courseId]);
        $allStudentIds = $stmtStudents->fetchAll(PDO::FETCH_COLUMN);
        
        // Insere os novos registros
        $stmtInsert = $conn->prepare("INSERT INTO attendance (courseId, studentId, date, status) VALUES (?, ?, ?, ?)");
        foreach ($allStudentIds as $studentId) {
            $status = in_array($studentId, $absentStudentIds) ? 'Falta' : 'Presente';
            $stmtInsert->execute([$courseId, $studentId, $date, $status]);
        }
        
        $conn->commit();
        send_response(true, ['message' => 'Frequência salva com sucesso.']);
    } catch (Exception $e) {
        $conn->rollBack();
        send_response(false, 'Erro ao salvar frequência: ' . $e->getMessage(), 500);
    }
}

function handle_get_course_details($conn, $data) {
    $courseId = $data['courseId'];
    
    $stmtTeacher = $conn->prepare("SELECT u.firstName, u.lastName FROM users u JOIN courses c ON u.id = c.teacherId WHERE c.id = ?");
    $stmtTeacher->execute([$courseId]);
    $teacher = $stmtTeacher->fetch();
    
    $stmtStudents = $conn->prepare("SELECT u.id, u.firstName, u.lastName, u.email FROM users u JOIN enrollments e ON u.id = e.studentId WHERE e.courseId = ? AND e.status = 'Aprovada'");
    $stmtStudents->execute([$courseId]);
    $students = $stmtStudents->fetchAll();
    
    // Pega o admin que encerrou, se houver
    $stmtCourse = $conn->prepare("SELECT closed_by_admin_id FROM courses WHERE id = ?");
    $stmtCourse->execute([$courseId]);
    $courseData = $stmtCourse->fetch();
    
    $admin = null;
    if ($courseData && $courseData['closed_by_admin_id']) {
        $stmtAdmin = $conn->prepare("SELECT firstName FROM users WHERE id = ?");
        $stmtAdmin->execute([$courseData['closed_by_admin_id']]);
        $admin = $stmtAdmin->fetch();
    }
    
    send_response(true, ['teacher' => $teacher, 'students' => $students, 'admin' => $admin]);
}

function handle_get_profile_data($conn, $data) {
    $userId = $data['userId'];
    
    $stmtUser = $conn->prepare("SELECT id, firstName, lastName, email, role, age, profilePicture, address FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();
    
    $enrollments = [];
    $payments = [];
    if ($user && $user['role'] === 'student') {
        $stmtEnroll = $conn->prepare("SELECT e.status, c.name as courseName FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE e.studentId = ?");
        $stmtEnroll->execute([$userId]);
        $enrollments = $stmtEnroll->fetchAll();

        $stmtPay = $conn->prepare("SELECT * FROM payments WHERE studentId = ?");
        $stmtPay->execute([$userId]);
        $payments = $stmtPay->fetchAll();
    }
    
    send_response(true, ['user' => $user, 'enrollments' => $enrollments, 'payments' => $payments]);
}

function handle_update_profile($conn, $data) {
    $userId = $data['userId'];
    $profileData = $data['profileData'];
    
    // Constrói a query dinamicamente para não atualizar campos vazios desnecessariamente
    $fields = [];
    $params = [];
    
    $allowedFields = ['firstName', 'lastName', 'age', 'address', 'profilePicture'];
    foreach ($allowedFields as $field) {
        if (isset($profileData[$field])) {
            $fields[] = "$field = ?";
            $params[] = $profileData[$field] === '' ? null : $profileData[$field];
        }
    }
    
    if (count($fields) > 0) {
        $params[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
    }
    
    send_response(true, ['message' => 'Perfil atualizado com sucesso.']);
}

function handle_update_school_profile($conn, $data) {
    $sql = "UPDATE school_profile SET name = ?, cnpj = ?, address = ?, phone = ?, pixKeyType = ?, pixKey = ?";
    $params = [
        $data['name'], $data['cnpj'], $data['address'], $data['phone'], $data['pixKeyType'], $data['pixKey']
    ];

    if (!empty($data['profilePicture'])) {
        $sql .= ", profilePicture = ?";
        $params[] = $data['profilePicture'];
    }

    $sql .= " WHERE id = 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    send_response(true, ['message' => 'Perfil da escola atualizado.']);
}

function handle_get_financial_dashboard_data($conn, $data) {
    $month = $data['month']; // Formato YYYY-MM
    
    // Resumo do mês selecionado
    $stmtMonth = $conn->prepare("SELECT SUM(amount) as total, status FROM payments WHERE referenceDate LIKE ? GROUP BY status");
    $stmtMonth->execute(["$month%"]);
    $monthData = $stmtMonth->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $collectedRevenue = $monthData['Pago'] ?? 0;
    $pendingRevenue = $monthData['Pendente'] ?? 0;
    $overdueRevenue = $monthData['Atrasado'] ?? 0;
    $outstandingRevenue = $pendingRevenue + $overdueRevenue;
    $expectedRevenue = $collectedRevenue + $outstandingRevenue + ($monthData['Cancelado'] ?? 0);

    // Receita por curso (mês selecionado)
    $stmtCourse = $conn->prepare("SELECT c.name, SUM(p.amount) as total FROM payments p JOIN courses c ON p.courseId = c.id WHERE p.referenceDate LIKE ? AND p.status = 'Pago' GROUP BY c.name");
    $stmtCourse->execute(["$month%"]);
    $revenueByCourseData = $stmtCourse->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Evolução da receita (últimos 6 meses)
    $evolutionData = [];
    $date = new DateTime("$month-01");
    $date->modify('-5 months');
    for ($i = 0; $i < 6; $i++) {
        $m = $date->format('Y-m');
        $stmtEvo = $conn->prepare("SELECT SUM(CASE WHEN status = 'Pago' THEN amount ELSE 0 END) as collected, SUM(amount) as expected FROM payments WHERE referenceDate LIKE ?");
        $stmtEvo->execute(["$m%"]);
        $row = $stmtEvo->fetch();
        
        $evolutionData[] = [
            'month' => $date->format('M'),
            'collected' => $row['collected'] ?? 0,
            'expected' => $row['expected'] ?? 0,
        ];
        $date->modify('+1 month');
    }
    
    send_response(true, [
        'expectedRevenue' => $expectedRevenue,
        'collectedRevenue' => $collectedRevenue,
        'outstandingRevenue' => $outstandingRevenue,
        'revenueByCourseData' => $revenueByCourseData,
        'evolutionData' => $evolutionData
    ]);
}

function handle_get_active_students($conn) {
    $sql = "SELECT DISTINCT u.id, u.firstName, u.lastName, u.email FROM users u 
            JOIN enrollments e ON u.id = e.studentId 
            WHERE e.status = 'Aprovada' ORDER BY u.firstName ASC";
    $students = $conn->query($sql)->fetchAll();
    send_response(true, ['students' => $students]);
}

function handle_get_student_payments($conn, $data) {
    $studentId = $data['studentId'];
    $stmt = $conn->prepare("SELECT * FROM payments WHERE studentId = ? ORDER BY referenceDate DESC");
    $stmt->execute([$studentId]);
    $payments = $stmt->fetchAll();
    send_response(true, ['payments' => $payments]);
}

function handle_update_payment_status($conn, $data) {
    $paymentId = $data['paymentId'];
    $status = $data['status'];
    $paymentDate = ($status === 'Pago') ? date('Y-m-d') : null;

    $stmt = $conn->prepare("UPDATE payments SET status = ?, paymentDate = ? WHERE id = ?");
    $stmt->execute([$status, $paymentDate, $paymentId]);
    send_response(true, ['message' => 'Status do pagamento atualizado.']);
}

function handle_get_system_settings($conn) {
    $settings = $conn->query("SELECT * FROM system_settings WHERE id = 1")->fetch();
    send_response(true, ['settings' => $settings]);
}

function handle_update_system_settings($conn, $data) {
    $sql = "UPDATE system_settings SET 
                smtpServer = ?, smtpPort = ?, smtpUser = ?, smtpPass = ?, 
                language = ?, timeZone = ?, currencySymbol = ?, defaultDueDay = ?,
                dbHost = ?, dbUser = ?, dbPass = ?, dbName = ?, dbPort = ?
            WHERE id = 1";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['smtpServer'], $data['smtpPort'], $data['smtpUser'], $data['smtpPass'],
        $data['language'], $data['timeZone'], $data['currencySymbol'], $data['defaultDueDay'],
        $data['dbHost'], $data['dbUser'], $data['dbPass'], $data['dbName'], $data['dbPort']
    ]);
    send_response(true, ['message' => 'Configurações salvas.']);
}

function handle_export_database($conn) {
    $tables = ['users', 'courses', 'enrollments', 'attendance', 'payments', 'school_profile', 'system_settings'];
    $exportData = [];
    foreach ($tables as $table) {
        $exportData[$table] = $conn->query("SELECT * FROM $table")->fetchAll();
    }
    send_response(true, ['exportData' => $exportData]);
}
?>