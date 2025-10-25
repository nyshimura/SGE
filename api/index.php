<?php
/**
 * Ponto de Entrada da API (Roteador Principal)
 */

ini_set('display_errors', 1); // 1 para desenvolvimento, 0 para produção
ini_set('display_startup_errors', 1); // 1 para desenvolvimento, 0 para produção
error_reporting(E_ALL);

// <<< INÍCIO ALTERAÇÃO 1: Iniciar a sessão no começo >>>
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
// <<< FIM ALTERAÇÃO 1 >>>

// <<< INÍCIO ALTERAÇÃO 2: Adicionar Log da Sessão >>>
error_log("[INDEX.PHP] Requisição recebida. Ação: " . ($_REQUEST['action'] ?? 'Nenhuma') . ". ID da Sessão: " . session_id() . ". Conteúdo da Sessão: " . print_r($_SESSION, true));
// <<< FIM ALTERAÇÃO 2 >>>


// Garante que o config.php seja incluído primeiro
require_once __DIR__ . '/config.php';

// --- FUNÇÃO AUXILIAR PARA ENVIAR RESPOSTAS ---
if (!function_exists('send_response')) {
    function send_response($success, $data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        $jsonOutput = json_encode(['success' => $success, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_INVALID_UTF8_SUBSTITUTE);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Erro ao codificar JSON: " . json_last_error_msg());
            http_response_code(500);
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

// Inclui os handlers
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
require_once __DIR__ . '/handlers/certificate_handler.php';

// Verifica conexão PDO
if (!isset($conn) || !$conn instanceof PDO) {
    error_log("Falha crítica: Conexão PDO não disponível no index.php.");
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
        'getSchoolProfile' => 'handle_get_school_profile', // <<< ERA ESSA AÇÃO
        'updateSchoolProfile' => 'handle_update_school_profile',
        'getSystemSettings' => 'handle_get_system_settings',
        'updateSystemSettings' => 'handle_update_system_settings',
        'updateDocumentTemplates' => 'handle_update_document_templates',
        'exportDatabase' => 'handle_export_database',
        // AI
        'generateAiDescription' => 'handle_generate_ai_description',
        // Certificates
        'generateCertificate' => 'handle_generate_certificate', // Admin
        'generateBulkCertificates' => 'handle_generate_bulk_certificates', // Admin
        'verifyCertificate' => 'handle_verify_certificate', // Public
        'getStudentCertificates' => 'handle_get_student_certificates', // Student/Admin
        'viewCertificate' => 'handle_view_certificate', // Student/Admin
    ];

    // Verifica se a ação existe no mapa E se a função correspondente existe
    if (isset($actionMap[$action]) && function_exists($actionMap[$action])) {

        // --- DEFINIÇÃO DE ROTAS PÚBLICAS (NÃO REQUEREM LOGIN) ---
        // <<< Adicionado 'getSchoolProfile' aqui >>>
        $publicActions = [
            'login',
            'register',
            'requestPasswordReset',
            'resetPassword',
            'verifyCertificate',
            'getSchoolProfile' // Informações básicas da escola podem ser públicas
         ];

        // --- VERIFICAÇÃO DE AUTENTICAÇÃO E AUTORIZAÇÃO ---
        if (!in_array($action, $publicActions)) {
            // Verifica se o usuário está logado
            if (!isset($_SESSION['user_id'])) {
                send_response(false, ['message' => 'Acesso não autorizado. Faça login novamente.'], 401); // 401 Unauthorized
            }

            // Pega dados da sessão
            $loggedInUserId = $_SESSION['user_id'];
            $loggedInUserRole = $_SESSION['user_role'] ?? 'student'; // Assume 'student' como padrão

            // Define papéis de administrador
            $adminRoles = ['admin', 'superadmin'];

            // ---- VERIFICAÇÕES ESPECÍFICAS DE AUTORIZAÇÃO POR AÇÃO ----

            // Ações restritas a Admin/Superadmin
            $adminOnlyActions = [
                'getFilteredUsers', 'updateUserRole', 'createCourse', 'updateCourse',
                'endCourse', 'reopenCourse', 'saveAttendance', 'approveEnrollment',
                'cancelEnrollment', 'reactivateEnrollment', 'updateEnrollmentDetails',
                'getFinancialDashboardData', 'updatePaymentStatus', 'getDefaultersReport',
                'bulkUpdatePaymentStatus', 'updateSchoolProfile', 'getSystemSettings',
                'updateSystemSettings', 'updateDocumentTemplates', 'exportDatabase',
                'generateCertificate', 'generateBulkCertificates'
            ];

            if (in_array($action, $adminOnlyActions) && !in_array($loggedInUserRole, $adminRoles)) {
                send_response(false, ['message' => 'Acesso negado. Permissão insuficiente.'], 403); // 403 Forbidden
            }

            // Ações que envolvem dados de um aluno específico (requerem ser o próprio aluno ou admin)
            $studentDataAccessActions = [
                'getStudentPayments',
                'generateReceipt',
                'generateContractPdf',
                'generateImageTermsPdf',
                'getEnrollmentDocuments',
                'getStudentCertificates',
                'viewCertificate' //
            ];

            if (in_array($action, $studentDataAccessActions)) {
                // Tenta obter o studentId dos parâmetros (prioriza GET, depois POST/JSON)
                $requestedStudentId = null;
                if (isset($_GET['studentId'])) {
                    $requestedStudentId = filter_var($_GET['studentId'], FILTER_VALIDATE_INT);
                } elseif (isset($input['studentId'])) {
                    $requestedStudentId = filter_var($input['studentId'], FILTER_VALIDATE_INT);
                }
                // TODO: Adicionar lógica para buscar studentId a partir de enrollmentId se necessário

                if ($requestedStudentId > 0) {
                    if (!in_array($loggedInUserRole, $adminRoles) && $loggedInUserId != $requestedStudentId) {
                         send_response(false, ['message' => 'Você não tem permissão para acessar os dados deste aluno.'], 403);
                    }
                } else {
                     if (!in_array($loggedInUserRole, $adminRoles)) {
                        error_log("Ação '$action' chamada sem studentId válido por usuário não-admin (ID: $loggedInUserId).");
                        send_response(false, ['message' => 'ID do aluno ausente ou inválido.'], 400);
                    }
                }
            }
        }


        // Determina a origem dos parâmetros (GET ou JSON body)
         $isGetAction = in_array($action, [
            'getDashboardData', 'getProfileData', 'getTeachers', 'getActiveStudents',
            'getCourseDetails', 'getAttendanceData', 'getFinancialDashboardData',
            'getStudentPayments', 'getDefaultersReport', 'getSchoolProfile', // <<< É GET
            'getSystemSettings', 'exportDatabase', 'generateReceipt',
            'generateContractPdf', 'generateImageTermsPdf', 'getEnrollmentDocuments',
            'verifyCertificate', // Public
            'getStudentCertificates', // Student/Admin
            'viewCertificate'         // Student/Admin
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
        $isFlexibleAction = in_array($action, ['generateCertificate', 'generateBulkCertificates']);

        $params = [];
        if ($isGetAction && $_SERVER['REQUEST_METHOD'] === 'GET') {
            $params = $_GET;
        } elseif ($isJsonPostAction && ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT')) {
            $params = $input;
        } elseif ($isFlexibleAction) {
            if ($_SERVER['REQUEST_METHOD'] === 'GET') $params = $_GET;
            elseif ($_SERVER['REQUEST_METHOD'] === 'POST') $params = $input;
            else { send_response(false, ['message' => 'Método HTTP não suportado.'], 405); }
        }
        else {
             error_log("Ação '$action' chamada com método HTTP '{$_SERVER['REQUEST_METHOD']}' não esperado.");
             if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($input)) $params = $input;
             elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET)) $params = $_GET;
             else $params = $_REQUEST;
        }

        unset($params['action']); // Remove 'action' dos parâmetros

        // Chama a função handler correspondente
        call_user_func($actionMap[$action], $conn, $params);

    } else {
        error_log("Ação inválida ou função não encontrada: " . ($action ?? 'Nenhuma ação fornecida'));
        send_response(false, ['message' => 'Ação inválida ou não implementada: ' . htmlspecialchars($action ?? 'Nenhuma')], 400);
    }

} catch (PDOException $e) {
    error_log("Erro PDO no index.php [Ação: $action]: " . $e->getMessage());
    send_response(false, ['message' => "Erro no banco de dados."], 500);
} catch (Exception $e) {
    error_log("Erro Geral no index.php [Ação: $action]: " . $e->getMessage() . " em " . $e->getFile() . ":" . $e->getLine());
    send_response(false, ['message' => "Erro interno do servidor."], 500);
} finally {
    $conn = null;
}
?>