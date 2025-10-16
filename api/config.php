<?php
/**
 * Arquivo de Configuração Principal
 */

// Configuração de erros para ambiente de produção.
// Desativa a exibição de erros na tela para não quebrar o JSON.
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
// Ativa o registro de erros em um arquivo de log no servidor.
ini_set('log_errors', 1);
// Reporta todos os tipos de erro para o log.
error_reporting(E_ALL);


// --- CONFIGURAÇÃO DE CORS (Cross-Origin Resource Sharing) ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CREDENCIAIS DO BANCO DE DADOS (CORRIGIDAS) ---
define('DB_HOST', 'localhost');
define('DB_USER', 'user_base'); 
define('DB_PASS', 'senha');    
define('DB_NAME', 'nome_bd'); 

// --- CONEXÃO COM O BANCO DE DADOS (USANDO PDO) ---
$conn = null;

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $conn = new PDO($dsn, DB_USER, DB_PASS, $options);

} catch (PDOException $e) {
    http_response_code(500);
    // Mesmo com display_errors=0, esta resposta de emergência é enviada se a conexão falhar.
    echo json_encode([
        'success' => false,
        'message' => 'Erro de Conexão com o Banco de Dados: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
?>