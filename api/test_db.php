<?php
// Habilitar a exibição de todos os erros para um diagnóstico claro
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- SUAS CREDENCIAIS ---
$db_host = 'localhost'; // Tente 'localhost' primeiro. Se não funcionar, tente o IP '195.179.238.154'
$db_name = 'u821635548_sistema';
$db_user = 'u821635548_base';
$db_pass = '100Senha!S';
$db_charset = 'utf8mb4';

// --- INÍCIO DO TESTE ---
header('Content-Type: text/html; charset=utf-p');
echo "<!DOCTYPE html><html><head><title>Teste de Conexão</title>";
echo "<style>body { font-family: sans-serif; padding: 20px; } pre { background-color: #f0f0f0; border: 1px solid #ccc; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }</style>";
echo "</head><body>";
echo "<h1>Teste de Conexão com Banco de Dados</h1>";
echo "<p>Tentando conectar ao host: <strong>$db_host</strong></p><hr>";

try {
    // Tentativa de conexão usando PDO
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // Se a conexão foi bem-sucedida
    echo '<h2 style="color: green;">SUCESSO!</h2>';
    echo '<p>A conexão com o banco de dados foi estabelecida com sucesso usando as credenciais fornecidas.</p>';
    echo '<p>Isso significa que o problema não está nas credenciais, mas pode ser um erro de sintaxe ou outro problema no arquivo <strong>api/index.php</strong>.</p>';

} catch (\PDOException $e) {
    // Se a conexão falhou
    echo '<h2 style="color: red;">FALHA NA CONEXÃO!</h2>';
    echo '<p>O PHP não conseguiu se conectar ao banco de dados. Esta é a causa do erro 500.</p>';
    echo '<p><strong>A mensagem de erro exata do servidor é:</strong></p>';
    echo '<pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
    
    echo "<h3>O que fazer agora?</h3>";
    echo "<ul>";
    echo "<li><strong>Verifique se as credenciais (usuário, senha, nome do banco) estão 100% corretas.</strong> Qualquer erro de digitação causará falha.</li>";
    echo "<li>Se você usou 'localhost' no teste, tente editar o arquivo `test_db.php` e usar o IP <strong>'195.179.238.154'</strong> como `$db_host`, e vice-versa.</li>";
    echo "<li>Verifique no painel da sua hospedagem se o usuário <strong>'$db_user'</strong> tem permissões para acessar a base <strong>'$db_name'</strong>.</li>";
    echo "<li>Contate o suporte da sua hospedagem e mostre a eles a mensagem de erro acima.</li>";
    echo "</ul>";
}
echo "</body></html>";
?>