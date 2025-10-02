<?php
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// A lógica de hash aqui replica a do seu protótipo para manter a compatibilidade.
// Em um projeto real, use as funções password_hash() e password_verify() do PHP.
$salt = 'SGE_PROTOTYPE_SALT_v1';
$hashedPassword = base64_encode($password . $salt);

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
$stmt->bind_param("ss", $email, $hashedPassword);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    unset($user['password']); // Nunca envie a senha de volta!
    echo json_encode($user);
} else {
    http_response_code(401); // Não autorizado
    echo json_encode(["error" => "Email ou senha inválidos."]);
}

$stmt->close();
$conn->close();
?>