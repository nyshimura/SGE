<?php
/**
 * Arquivo de Configuração Principal
 *
 * Responsável por:
 * 1. Definir as credenciais do banco de dados.
 * 2. Configurar os cabeçalhos da API (CORS, Content-Type).
 * 3. Estabelecer a conexão segura com o banco de dados usando PDO.
 */

// Habilitar a exibição de todos os erros (útil durante o desenvolvimento)
// Em um ambiente de produção real, considere mudar para error_reporting(0);
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --- CONFIGURAÇÃO DE CORS (Cross-Origin Resource Sharing) ---
// Permite que o seu frontend acesse esta API.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// O navegador envia uma requisição OPTIONS "preflight" para verificar as permissões de CORS
// antes de enviar a requisição real (POST/GET). É necessário responder a ela com sucesso.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CREDENCIAIS DO BANCO DE DADOS ---
// Dados que você me forneceu.
define('DB_HOST', 'localhost');
define('DB_USER', 'user');
define('DB_PASS', 'senha');
define('DB_NAME', 'nomedibd');

// --- CONEXÃO COM O BANCO DE DADOS (USANDO PDO) ---
$conn = null; // Inicializa a variável de conexão

try {
    // DSN (Data Source Name) - define o host, o nome do banco e o charset
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";

    // Opções do PDO para uma conexão mais segura e robusta
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lança exceções em caso de erro, em vez de warnings.
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Retorna resultados como arrays associativos (ex: ['nome' => 'Ana']).
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Usa "prepared statements" nativos do banco de dados, que é mais seguro.
    ];

    // Cria a instância do PDO que representa a conexão com o banco de dados
    $conn = new PDO($dsn, DB_USER, DB_PASS, $options);

} catch (PDOException $e) {
    // Se a conexão falhar, o script para aqui e envia uma resposta de erro clara em formato JSON.
    http_response_code(500); // Erro Interno do Servidor
    echo json_encode([
        'success' => false,
        'message' => 'Erro de Conexão com o Banco de Dados: ' . $e->getMessage()
    ]);
    exit(); // Encerra a execução do script
}

// Se o script chegou até aqui, a variável $conn contém uma conexão válida com o banco de dados
// e pode ser usada pelos outros arquivos que incluírem este.
?>