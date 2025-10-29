<?php
// api/handlers/course_handlers.php

// Funções handle_create_course, handle_update_course, handle_end_course, handle_reopen_course, handle_get_course_details
// permanecem iguais às que você enviou...

function handle_create_course($conn, $data) {
    $courseData = $data['courseData'];
    $name = trim($courseData['courseName']);
    $description = trim($courseData['courseDescription']);
    $teacherId = filter_var($courseData['teacherId'], FILTER_VALIDATE_INT);
    $totalSlots = !empty($courseData['totalSlots']) ? filter_var($courseData['totalSlots'], FILTER_VALIDATE_INT) : null;
    $monthlyFee = filter_var($courseData['monthlyFee'], FILTER_VALIDATE_FLOAT);
    $paymentType = $courseData['paymentType'];
    $installments = ($paymentType === 'parcelado' && !empty($courseData['installments'])) ? filter_var($courseData['installments'], FILTER_VALIDATE_INT) : null;
    $dayOfWeek = !empty($courseData['dayOfWeek']) ? trim($courseData['dayOfWeek']) : null;
    $startTime = !empty($courseData['startTime']) ? trim($courseData['startTime']) : null;
    $endTime = !empty($courseData['endTime']) ? trim($courseData['endTime']) : null;
    $carga_horaria = !empty($courseData['carga_horaria']) ? trim($courseData['carga_horaria']) : null; 

    $sql = "INSERT INTO courses (name, description, teacherId, totalSlots, status, monthlyFee, paymentType, installments, dayOfWeek, startTime, endTime, carga_horaria)
            VALUES (?, ?, ?, ?, 'Aberto', ?, ?, ?, ?, ?, ?, ?)"; 

    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $teacherId, $totalSlots, $monthlyFee, $paymentType, $installments, $dayOfWeek, $startTime, $endTime, $carga_horaria]); 
    send_response(true, ['message' => 'Curso criado com sucesso.']);
}

function handle_update_course($conn, $data) {
    $courseData = $data['courseData'];
    $courseId = filter_var($courseData['courseId'], FILTER_VALIDATE_INT);
    $name = trim($courseData['courseName']);
    $description = trim($courseData['courseDescription']);
    $teacherId = filter_var($courseData['teacherId'], FILTER_VALIDATE_INT);
    $totalSlots = ($courseData['totalSlots'] !== null && $courseData['totalSlots'] !== '') ? filter_var($courseData['totalSlots'], FILTER_VALIDATE_INT) : null;
    $monthlyFee = filter_var($courseData['monthlyFee'], FILTER_VALIDATE_FLOAT);
    $paymentType = $courseData['paymentType'];
    $installments = ($paymentType === 'parcelado' && $courseData['installments'] !== null && $courseData['installments'] !== '') ? filter_var($courseData['installments'], FILTER_VALIDATE_INT) : null;
    $dayOfWeek = ($courseData['dayOfWeek'] !== null && $courseData['dayOfWeek'] !== '') ? trim($courseData['dayOfWeek']) : null;
    $startTime = ($courseData['startTime'] !== null && $courseData['startTime'] !== '') ? trim($courseData['startTime']) : null;
    $endTime = ($courseData['endTime'] !== null && $courseData['endTime'] !== '') ? trim($courseData['endTime']) : null;
    $carga_horaria = ($courseData['carga_horaria'] !== null && $courseData['carga_horaria'] !== '') ? trim($courseData['carga_horaria']) : null; 

    $sql = "UPDATE courses SET name = ?, description = ?, teacherId = ?, totalSlots = ?, monthlyFee = ?, paymentType = ?, installments = ?, dayOfWeek = ?, startTime = ?, endTime = ?, carga_horaria = ?
            WHERE id = ?"; 

    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $teacherId, $totalSlots, $monthlyFee, $paymentType, $installments, $dayOfWeek, $startTime, $endTime, $carga_horaria, $courseId]); 
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

function handle_get_course_details($conn, $data) {
    $courseId = $data['courseId'];
    $stmtTeacher = $conn->prepare("SELECT u.firstName, u.lastName FROM users u JOIN courses c ON u.id = c.teacherId WHERE c.id = ?");
    $stmtTeacher->execute([$courseId]);
    $teacher = $stmtTeacher->fetch();

    // Pega alunos com matrícula Aprovada ou Cancelada
    $stmtStudents = $conn->prepare("SELECT u.id, u.firstName, u.lastName, u.email, e.status FROM users u JOIN enrollments e ON u.id = e.studentId WHERE e.courseId = ? AND e.status IN ('Aprovada', 'Cancelada', 'Pendente')");
    $stmtStudents->execute([$courseId]);
    $students = $stmtStudents->fetchAll();

    $stmtCourse = $conn->prepare("SELECT closed_by_admin_id, closed_date FROM courses WHERE id = ?");
    $stmtCourse->execute([$courseId]);
    $courseData = $stmtCourse->fetch();
    $admin = null;
    if ($courseData && $courseData['closed_by_admin_id']) {
        $stmtAdmin = $conn->prepare("SELECT firstName FROM users WHERE id = ?");
        $stmtAdmin->execute([$courseData['closed_by_admin_id']]);
        $admin = $stmtAdmin->fetch();
    }

    // Adiciona data de encerramento
    $response = ['teacher' => $teacher, 'students' => $students, 'admin' => $admin, 'closed_date' => $courseData['closed_date'] ?? null];
    send_response(true, $response);
}


// <<< FUNÇÃO MODIFICADA E CORRIGIDA (com try...catch e COLLATE) >>>
function handle_get_attendance_data($conn, $data) {
    try { 
        $courseId = $data['courseId'];
        $month = $data['month'] ?? date('Y-m');
        $date = $data['date'] ?? date('Y-m-d');

        // Busca dados do curso
        $stmtCourse = $conn->prepare("SELECT * FROM courses WHERE id = ?");
        $stmtCourse->execute([$courseId]);
        $course = $stmtCourse->fetch();
        if (!$course) {
            send_response(false, 'Curso não encontrado.', 404);
            return;
        }

        // Busca alunos aprovados (*** COLLATE ADICIONADO ***)
        $stmtStudents = $conn->prepare("SELECT u.id, u.firstName, u.lastName FROM users u JOIN enrollments e ON u.id = e.studentId WHERE e.courseId = ? AND e.status COLLATE utf8mb4_unicode_ci = 'Aprovada' ORDER BY u.firstName");
        $stmtStudents->execute([$courseId]);
        $students = $stmtStudents->fetchAll();

        // Busca registros para a DATA específica (*** COLLATE ADICIONADO ***)
        $stmtRecordsForDate = $conn->prepare("SELECT studentId, status FROM attendance WHERE courseId = ? AND date COLLATE utf8mb4_unicode_ci = ?");
        $stmtRecordsForDate->execute([$courseId, $date]);
        $recordsForDate = $stmtRecordsForDate->fetchAll();

        // Busca TODOS os registros de frequência para o MÊS selecionado (*** COLLATE ADICIONADO ***)
        $stmtMonthlyRecords = $conn->prepare("SELECT studentId, date, status FROM attendance WHERE courseId = ? AND DATE_FORMAT(date, '%Y-%m') COLLATE utf8mb4_unicode_ci = ? ORDER BY date, studentId");
        $stmtMonthlyRecords->execute([$courseId, $month]);
        $monthlyRecords = $stmtMonthlyRecords->fetchAll();

        // Retorna os dados
        send_response(true, [
            'course' => $course,
            'students' => $students,
            'recordsForDate' => $recordsForDate,
            'monthlyRecords' => $monthlyRecords
        ]);

    } catch (Exception $e) { 
        // Se qualquer consulta falhar, captura o erro e envia uma resposta 500 limpa
        error_log("Erro em handle_get_attendance_data: " . $e->getMessage()); // Log do erro real
        send_response(false, 'Erro no banco de dados ao buscar dados de frequência: ' . $e->getMessage(), 500);
    }
}

function handle_save_attendance($conn, $data) {
    $courseId = $data['courseId'];
    $date = $data['date'];
    $absentStudentIds = isset($data['absentStudentIds']) ? $data['absentStudentIds'] : [];

    // Validação básica da data
    if (empty($date)) {
        send_response(false, 'Data inválida para salvar frequência.', 400);
        return;
    }

    $conn->beginTransaction();
    try {
        // Deleta registros existentes para esta data e curso
        $stmtDelete = $conn->prepare("DELETE FROM attendance WHERE courseId = ? AND date = ?");
        $stmtDelete->execute([$courseId, $date]);

        // Pega todos os IDs de alunos aprovados no curso
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
        error_log("Erro em handle_save_attendance: " . $e->getMessage()); // Log do erro
        send_response(false, 'Erro ao salvar frequência: ' . $e->getMessage(), 500);
    }
}
?>