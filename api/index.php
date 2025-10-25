<?php
/**
 * Ponto de Entrada da API (Roteador Principal)
 */

ini_set('display_errors', 1); // 1 para desenvolvimento, 0 para produção
ini_set('display_startup_errors', 1); // 1 para desenvolvimento, 0 para produção
error_reporting(E_ALL);

// Garante que o config.php seja incluído primeiro
require_once __DIR__ . '/config.php';

// --- FUNÇÃO AUXILIAR PARA ENVIAR RESPOSTAS ---
if (!function_exists('send_response')) {
    function send_response($success, $data, $statusCode = 200) {
        // Define o código de status ANTES de qualquer output
        http_response_code($statusCode);
        // Define o cabeçalho ANTES de qualquer output
        header('Content-Type: application/json; charset=UTF-8');
        // Tenta codificar o JSON, tratando erros potenciais
        $jsonOutput = json_encode(['success' => $success, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_INVALID_UTF8_SUBSTITUTE);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Se houver erro no JSON, loga e envia um erro genérico seguro
            error_log("Erro ao codificar JSON: " . json_last_error_msg());
            http_response_code(500); // Garante que seja 500 em caso de falha no JSON
            echo json_encode(['success' => false, 'data' => ['message' => 'Erro interno ao processar a resposta.']]);
        } else {
            echo $jsonOutput;
        }
        exit();
    }
}


// --- ROTEDOR PRINCIPAL ---
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : null;
$inputData = json_decode(file_get_contents('php://input'), true);
$input = is_array($inputData) ? $inputData : [];

// Inclui os handlers (Usando __DIR__ para caminhos mais robustos)
require_once __DIR__ . '/handlers/auth_handlers.php';
require_once __DIR__ . '/handlers/user_handlers.php';
require_once __DIR__ . '/handlers/course_handlers.php';
require_once __DIR__ . '/handlers/enrollment_handlers.php';
require_once __DIR__ . '/handlers/financial_handlers.php';
require_once __DIR__ . '/handlers/system_handlers.php';
require_once __DIR__ . '/handlers/ai_handlers.php';
require_once __DIR__ . '/handlers/contract_handler.php';
require_once __DIR__ . '/handlers/image_term_handler.php';
require_once __DIR__ . '/handlers/receipt_handler.php';
require_once __DIR__ . '/handlers/certificate_handler.php'; // <-- Handler já incluído

// Verifica se a conexão PDO está disponível (deve ter sido criada em config.php)
if (!isset($conn) || !$conn instanceof PDO) {
    // Log do erro crítico
    error_log("Falha crítica: Conexão PDO não disponível no index.php.");
    // Envia resposta de erro sem depender da conexão
    send_response(false, ['message' => 'Erro crítico na configuração do servidor (conexão BD).'], 500);
}


try {
    // Mapeamento de ações para funções
    $actionMap = [
        // Auth
        'login' => 'handle_login',
        'register' => 'handle_register',
        'changePassword' => 'handle_change_password',
        'requestPasswordReset' => 'handle_request_password_reset',
        'resetPassword' => 'handle_reset_password',
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
        'enroll' => 'handle_enroll',
        'submitEnrollment' => 'handle_submit_enrollment',
        'submitReenrollment' => 'handle_submit_reenrollment',
        'approveEnrollment' => 'handle_approve_enrollment',
        'cancelEnrollment' => 'handle_cancel_enrollment',
        'reactivateEnrollment' => 'handle_reactivate_enrollment',
        'updateEnrollmentDetails' => 'handle_update_enrollment_details',
        'getEnrollmentDocuments' => 'handle_get_enrollment_documents',
        // Financial
        'getFinancialDashboardData' => 'handle_get_financial_dashboard_data',
        'getStudentPayments' => 'handle_get_student_payments',
        'updatePaymentStatus' => 'handle_update_payment_status',
        'getDefaultersReport' => 'handle_get_defaulters_report',
        'bulkUpdatePaymentStatus' => 'handle_bulk_update_payment_status',
        // Documents (Geração de PDF)
        'generateReceipt' => 'handle_generate_receipt',
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
        // --- ROTAS DE CERTIFICADO ---
        'generateCertificate' => 'handle_generate_certificate',
        'generateBulkCertificates' => 'handle_generate_bulk_certificates',
        'verifyCertificate' => 'handle_verify_certificate',
        'getStudentCertificates' => 'handle_get_student_certificates', // <-- NOVA AÇÃO ADICIONADA AQUI
    ];

    // Verifica se a ação existe no mapa E se a função correspondente existe
    if (isset($actionMap[$action]) && function_exists($actionMap[$action])) {

        // --- DEFINIÇÃO DE ROTAS PÚBLICAS (NÃO REQUEREM LOGIN) ---
        // Ajustar conforme a implementação de autenticação
        $publicActions = ['login', 'register', 'requestPasswordReset', 'resetPassword', 'verifyCertificate'];

        // --- VERIFICAÇÃO DE AUTENTICAÇÃO (Exemplo) ---
        // if (!in_array($action, $publicActions)) {
        //     // Incluir aqui a lógica para verificar o token/sessão do usuário
        //     // Exemplo: $userId = verify_token($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        //     // if (!$userId) {
        //     //     send_response(false, ['message' => 'Acesso não autorizado ou token inválido.'], 401);
        //     // }
        //     // Se a rota for específica de aluno (como getStudentCertificates),
        //     // verificar se o $userId corresponde ao studentId solicitado ou se é admin
        //     // if ($action === 'getStudentCertificates' && isset($_GET['studentId'])) {
        //     //      $requestedStudentId = filter_var($_GET['studentId'], FILTER_VALIDATE_INT);
        //     //      // Recuperar role do usuário $userId
        //     //      // $userRole = get_user_role($conn, $userId);
        //     //      // if ($userRole !== 'admin' && $userRole !== 'superadmin' && $userId !== $requestedStudentId) {
        //     //      //     send_response(false, ['message' => 'Você não tem permissão para ver os certificados deste aluno.'], 403);
        //     //      // }
        //     // }
        // }

        // Determina a origem dos parâmetros (GET ou JSON body)
         $isGetAction = in_array($action, [
            'getDashboardData', 'getProfileData', 'getTeachers', 'getActiveStudents',
            'getCourseDetails', 'getAttendanceData', 'getFinancialDashboardData',
            'getStudentPayments', 'getDefaultersReport', 'getSchoolProfile',
            'getSystemSettings', 'exportDatabase', 'generateReceipt',
            'generateContractPdf', 'generateImageTermsPdf', 'getEnrollmentDocuments',
            'verifyCertificate', // <-- VERIFICAR É PÚBLICO E GET
            'getStudentCertificates' // <-- NOVA AÇÃO GET ADICIONADA AQUI
        ]);
        $isJsonPostAction = in_array($action, [
            'login', 'register', 'changePassword', 'requestPasswordReset', 'resetPassword',
            'getFilteredUsers', 'updateUserRole', 'updateProfile', 'createCourse',
            'updateCourse', 'endCourse', 'reopenCourse', 'saveAttendance', 'enroll',
            'submitEnrollment', 'submitReenrollment', 'approveEnrollment',
            'cancelEnrollment', 'reactivateEnrollment', 'updateEnrollmentDetails',
            'updatePaymentStatus', 'bulkUpdatePaymentStatus', 'updateSchoolProfile',
            'updateSystemSettings', 'updateDocumentTemplates', 'generateAiDescription'
        ]);
        // Ações de Geração podem ser GET (para links diretos/downloads) ou POST (para formulários complexos)
        $isFlexibleAction = in_array($action, ['generateCertificate', 'generateBulkCertificates']);

        $params = [];
        if ($isGetAction && $_SERVER['REQUEST_METHOD'] === 'GET') {
            $params = $_GET;
        } elseif ($isJsonPostAction && ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT')) {
            $params = $input; // Recebe dados do corpo JSON da requisição
        } elseif ($isFlexibleAction) {
            // Aceita GET ou POST JSON
            if ($_SERVER['REQUEST_METHOD'] === 'GET') $params = $_GET;
            elseif ($_SERVER['REQUEST_METHOD'] === 'POST') $params = $input;
            else { send_response(false, ['message' => 'Método HTTP não suportado para esta ação flexível.'], 405); }
        }
        // Fallback para outros métodos ou ações não mapeadas explicitamente
        else {
             error_log("Ação '$action' chamada com método HTTP '{$_SERVER['REQUEST_METHOD']}' não esperado ou não mapeado explicitamente para GET/POST JSON.");
             // Tenta pegar de $_REQUEST como último recurso, mas prioriza GET/POST JSON se possível
             if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($input)) $params = $input;
             elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET)) $params = $_GET;
             else $params = $_REQUEST; // Pode conter dados de GET, POST (form-data), etc.
        }

        // Remove 'action' dos parâmetros para não passar para a função handler
        unset($params['action']);

        // Chama a função handler correspondente, passando a conexão PDO e os parâmetros
        call_user_func($actionMap[$action], $conn, $params);

    } else {
        // Ação não encontrada ou função não definida
        error_log("Ação inválida ou função não encontrada: " . ($action ?? 'Nenhuma ação fornecida'));
        send_response(false, ['message' => 'Ação inválida ou não implementada: ' . htmlspecialchars($action ?? 'Nenhuma')], 400);
    }

} catch (PDOException $e) {
    // Erro específico do banco de dados
    error_log("Erro PDO no index.php [Ação: $action]: " . $e->getMessage());
    send_response(false, ['message' => "Erro no banco de dados ao processar sua solicitação."], 500);
} catch (Exception $e) {
    // Outros erros gerais no PHP
    error_log("Erro Geral no index.php [Ação: $action]: " . $e->getMessage() . " em " . $e->getFile() . ":" . $e->getLine());
    send_response(false, ['message' => "Erro interno do servidor: " . ($e->getMessage() ?: 'Erro desconhecido')], 500);
} finally {
    // Garante que a conexão seja fechada
    $conn = null;
}
?>