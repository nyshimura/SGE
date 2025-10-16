<?php
function handle_login($conn, $data) {
    $email = isset($data['email']) ? $data['email'] : null;
    $password = isset($data['password']) ? $data['password'] : null;
    if (!$email || !$password) { send_response(false, 'Email e senha são obrigatórios.', 400); }
    $stmt = $conn->prepare("SELECT id, firstName, lastName, email, role, profilePicture, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password_hash'])) {
        unset($user['password_hash']);
        send_response(true, ['user' => $user]);
    } else {
        send_response(false, 'Email ou senha inválidos.', 401);
    }
}

function handle_register($conn, $data) {
    $name = isset($data['name']) ? $data['name'] : null;
    $email = isset($data['email']) ? $data['email'] : null;
    $password = isset($data['password']) ? $data['password'] : null;
    if (!$name || !$email || !$password) { send_response(false, 'Nome, email e senha são obrigatórios.', 400); }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { send_response(false, 'Formato de email inválido.', 400); }
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) { send_response(false, 'Este email já está em uso.', 409); }
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (firstName, email, password_hash, role) VALUES (?, ?, ?, 'unassigned')");
    $success = $stmt->execute([$name, $email, $password_hash]);
    if ($success) {
        send_response(true, ['message' => 'Usuário cadastrado com sucesso.']);
    } else {
        send_response(false, 'Falha ao cadastrar usuário.', 500);
    }
}

function handle_change_password($conn, $data) {
    $userId = isset($data['userId']) ? (int)$data['userId'] : null;
    $currentPassword = isset($data['currentPassword']) ? $data['currentPassword'] : null;
    $newPassword = isset($data['newPassword']) ? $data['newPassword'] : null;
    if (!$userId || !$currentPassword || !$newPassword) { send_response(false, 'Todos os campos são obrigatórios.', 400); }
    $stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) { send_response(false, 'Usuário não encontrado.', 404); }
    if (password_verify($currentPassword, $user['password_hash'])) {
        $new_password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $success = $updateStmt->execute([$new_password_hash, $userId]);
        if ($success) {
            send_response(true, ['message' => 'Senha alterada com sucesso.']);
        } else {
            send_response(false, 'Falha ao atualizar a senha.', 500);
        }
    } else {
        send_response(false, 'A senha atual está incorreta.', 401);
    }
}
?>