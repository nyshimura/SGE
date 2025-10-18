<?php
/**
 * Ponto de Entrada da API (Roteador Principal)
 */

// A configuração de erros está centralizada no config.php
require_once 'config.php';

// --- FUNÇÃO AUXILIAR PARA ENVIAR RESPOSTAS ---
function send_response($success, $data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success' => $success, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit();
}

// --- ROTEDOR PRINCIPAL ---
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : null;
$inputData = json_decode(file_get_contents('php://input'), true);
$input = is_array($inputData) ? $inputData : [];

// Inclui os handlers
require_once 'handlers/auth_handlers.php';
require_once 'handlers/user_handlers.php';
require_once 'handlers/course_handlers.php';
require_once 'handlers/enrollment_handlers.php';
require_once 'handlers/financial_handlers.php';
require_once 'handlers/system_handlers.php';
require_once 'handlers/ai_handlers.php'; 
require_once 'handlers/document_handler.php';

try {
    // Mapeamento de ações para funções
    $actionMap = [
        // Auth
        'login' => 'handle_login',
        'register' => 'handle_register',
        'changePassword' => 'handle_change_password',
        // User & Profile
        'getDashboardData' => 'handle_get_dashboard_data',
        'getFilteredUsers' => 'handle_get_filtered_users',
        'updateUserRole' => 'handle_update_user_role',
        'getProfileData' => 'handle_get_profile_data',
        'updateProfile' => 'handle_update_profile',
        'getTeachers' => 'handle_get_teachers',
        'getActiveStudents' => 'handle_get_active_students',
        // Course
        'createCourse' => 'handle_create_course',
        'updateCourse' => 'handle_update_course',
        'endCourse' => 'handle_end_course',
        'reopenCourse' => 'handle_reopen_course',
        'getCourseDetails' => 'handle_get_course_details',
        'getAttendanceData' => 'handle_get_attendance_data',
        'saveAttendance' => 'handle_save_attendance',
        
        // Enrollment
        'enroll' => 'handle_enroll', // <-- AÇÃO ANTIGA RESTAURADA
        'submitEnrollment' => 'handle_submit_enrollment', // <-- AÇÃO NOVA
        'approveEnrollment' => 'handle_approve_enrollment',
        'cancelEnrollment' => 'handle_cancel_enrollment',
        'reactivateEnrollment' => 'handle_reactivate_enrollment',
        'updateEnrollmentDetails' => 'handle_update_enrollment_details',
        
        // Financial
        'getFinancialDashboardData' => 'handle_get_financial_dashboard_data',
        'getStudentPayments' => 'handle_get_student_payments',
        'updatePaymentStatus' => 'handle_update_payment_status',
        'getDefaultersReport' => 'handle_get_defaulters_report',
        'bulkUpdatePaymentStatus' => 'handle_bulk_update_payment_status',
        'generateReceipt' => 'handle_generate_receipt',
        
        // Documents
        'generateContractPdf' => 'handle_generate_contract_pdf',
        'generateImageTermsPdf' => 'handle_generate_image_terms_pdf',
        
        // System & School
        'getSchoolProfile' => 'handle_get_school_profile',
        'updateSchoolProfile' => 'handle_update_school_profile',
        'getSystemSettings' => 'handle_get_system_settings',
        'updateSystemSettings' => 'handle_update_system_settings',
        'updateDocumentTemplates' => 'handle_update_document_templates',
        'exportDatabase' => 'handle_export_database',
        // AI
        'generateAiDescription' => 'handle_generate_ai_description',
    ];

    if (isset($actionMap[$action]) && function_exists($actionMap[$action])) {
        $params = ($action === 'generateReceipt' || $action === 'generateContractPdf' || $action === 'generateImageTermsPdf') 
            ? $_GET 
            : ($_SERVER['REQUEST_METHOD'] === 'GET' ? $_GET : $input);
        call_user_func($actionMap[$action], $conn, $params);
    } else {
        send_response(false, 'Ação desconhecida ou não especificada: ' . htmlspecialchars($action), 400);
    }

} catch (PDOException $e) {
    send_response(false, "Erro no banco de dados: " . $e->getMessage(), 500);
} catch (Exception $e) {
    send_response(false, "Erro interno do servidor: " . $e->getMessage(), 500);
}
?>