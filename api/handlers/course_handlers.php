<?php
// api/handlers/course_handlers.php

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
    $carga_horaria = !empty($courseData['carga_horaria']) ? trim($courseData['carga_horaria']) : null; // <-- NOVO

    $sql = "INSERT INTO courses (name, description, teacherId, totalSlots, status, monthlyFee, paymentType, installments, dayOfWeek, startTime, endTime, carga_horaria) 
            VALUES (?, ?, ?, ?, 'Aberto', ?, ?, ?, ?, ?, ?, ?)"; // <-- Adicionado ?
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $teacherId, $totalSlots, $monthlyFee, $paymentType, $installments, $dayOfWeek, $startTime, $endTime, $carga_horaria]); // <-- Adicionado var
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
    $carga_horaria = ($courseData['carga_horaria'] !== null && $courseData['carga_horaria'] !== '') ? trim($courseData['carga_horaria']) : null; // <-- NOVO

    $sql = "UPDATE courses SET name = ?, description = ?, teacherId = ?, totalSlots = ?, monthlyFee = ?, paymentType = ?, installments = ?, dayOfWeek = ?, startTime = ?, endTime = ?, carga_horaria = ?
            WHERE id = ?"; // <-- Adicionado ?
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $teacherId, $totalSlots, $monthlyFee, $paymentType, $installments, $dayOfWeek, $startTime, $endTime, $carga_horaria, $courseId]); // <-- Adicionado var
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
    $stmtHistory = $conn->prepare("SELECT date, status, COUNT(*) as count FROM attendance WHERE courseId = ? GROUP BY date, status ORDER BY date DESC");
    $stmtHistory->execute([$courseId]);
    $rawHistory = $stmtHistory->fetchAll();
    $history = [];
    foreach ($rawHistory as $row) {
        if (!isset($history[$row['date']])) { $history[$row['date']] = ['presentes' => 0, 'faltas' => 0]; }
        if ($row['status'] === 'Presente') { $history[$row['date']]['presentes'] = $row['count']; } else { $history[$row['date']]['faltas'] = $row['count']; }
    }
    send_response(true, ['course' => $course, 'students' => $students, 'recordsForDate' => $recordsForDate, 'history' => $history]);
}

function handle_save_attendance($conn, $data) {
    $courseId = $data['courseId'];
    $date = $data['date'];
    $absentStudentIds = isset($data['absentStudentIds']) ? $data['absentStudentIds'] : [];
    $conn->beginTransaction();
    try {
        $stmtDelete = $conn->prepare("DELETE FROM attendance WHERE courseId = ? AND date = ?");
        $stmtDelete->execute([$courseId, $date]);
        $stmtStudents = $conn->prepare("SELECT studentId FROM enrollments WHERE courseId = ? AND status = 'Aprovada'");
        $stmtStudents->execute([$courseId]);
        $allStudentIds = $stmtStudents->fetchAll(PDO::FETCH_COLUMN);
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
?>