<?php
// Inclui o helper de e-mail no início do arquivo, se ainda não estiver incluído
require_once __DIR__ . '/../helpers/email_helper.php';

function handle_login($conn, $data) {
    $email = isset($data['email']) ? trim($data['email']) : null; // Adiciona trim()
    $password = isset($data['password']) ? $data['password'] : null;
    if (!$email || !$password) { send_response(false, ['message' => 'Email e senha são obrigatórios.'], 400); return; } // Adiciona return

    try {
        // Corrigido: Seleciona password_hash em vez de password
        $stmt = $conn->prepare("SELECT id, firstName, lastName, email, role, profilePicture, password_hash FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC); // Usa FETCH_ASSOC

        // Corrigido: Verifica contra password_hash
        if ($user && password_verify($password, $user['password_hash'])) {
            // Senha correta, iniciar/regenerar sessão
            if (session_status() == PHP_SESSION_NONE) {
                session_start();
            }
            session_regenerate_id(true); // Regenera ID da sessão por segurança

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role']; // Certifique-se que 'role' é a coluna correta

            // <<< INÍCIO ALTERAÇÃO: Adicionar Log de Login >>>
            error_log("[AUTH_HANDLER] Login bem-sucedido. Sessão iniciada/regenerada. ID da Sessão: " . session_id() . ", User ID na Sessão: " . $_SESSION['user_id'] . ", User Role na Sessão: " . $_SESSION['user_role']);
            // <<< FIM ALTERAÇÃO >>>

            // Prepara dados do usuário para retornar (sem a senha!)
            unset($user['password_hash']);
            send_response(true, ['user' => $user, 'message' => 'Login bem-sucedido.']);

        } else {
            // Email não encontrado ou Senha incorreta
            error_log("[AUTH_HANDLER] Tentativa de login falhou (email não encontrado ou senha incorreta) para o email: " . $email);
            send_response(false, ['message' => 'E-mail ou senha inválidos.'], 401);
        }

    } catch (PDOException $e) {
        error_log("Erro PDO handle_login: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao tentar fazer login.'], 500);
    } catch (Exception $e) {
        error_log("Erro Geral handle_login: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao processar login.'], 500);
    }
}


function handle_register($conn, $data) {
    // Extrai e valida os dados de entrada
    $firstName = isset($data['firstName']) ? trim($data['firstName']) : '';
    $lastName = isset($data['lastName']) ? trim($data['lastName']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $password = isset($data['password']) ? $data['password'] : '';
    $role = isset($data['role']) ? $data['role'] : 'student'; // Papel padrão 'student'

    // Validações básicas
    if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
        send_response(false, ['message' => 'Todos os campos são obrigatórios (Nome, Sobrenome, Email, Senha).'], 400);
        return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(false, ['message' => 'Formato de e-mail inválido.'], 400);
        return;
    }
    // Adicionar validação de força da senha se necessário

    // Verifica se o email já existe
    try {
        $stmtCheck = $conn->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmtCheck->execute([$email]);
        if ($stmtCheck->fetchColumn() > 0) {
            send_response(false, ['message' => 'Este e-mail já está cadastrado.'], 409); // 409 Conflict
            return;
        }

        // Gera o hash da senha
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        // Insere o novo usuário
        $stmtInsert = $conn->prepare("INSERT INTO users (firstName, lastName, email, password_hash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
        $success = $stmtInsert->execute([$firstName, $lastName, $email, $password_hash, $role]);

        if ($success) {
            // Obter ID do usuário recém-criado para possível retorno ou log
             $userId = $conn->lastInsertId();
            error_log("[AUTH_HANDLER] Novo usuário registrado com sucesso. ID: $userId, Email: $email, Role: $role");
            send_response(true, ['message' => 'Usuário registrado com sucesso!', 'userId' => $userId]);
        } else {
             error_log("[AUTH_HANDLER] Falha ao inserir novo usuário no banco de dados. Email: $email");
            send_response(false, ['message' => 'Erro ao registrar usuário.'], 500);
        }

    } catch (PDOException $e) {
        error_log("Erro PDO handle_register: " . $e->getMessage());
        send_response(false, ['message' => 'Erro no banco de dados durante o registro.'], 500);
    } catch (Exception $e) {
        error_log("Erro Geral handle_register: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao processar registro.'], 500);
    }
}


function handle_change_password($conn, $data) {
    // Assume que o user ID vem da sessão
    if (!isset($_SESSION['user_id'])) {
        send_response(false, ['message' => 'Usuário não autenticado.'], 401);
        return;
    }
    $userId = $_SESSION['user_id'];

    $currentPassword = isset($data['currentPassword']) ? $data['currentPassword'] : '';
    $newPassword = isset($data['newPassword']) ? $data['newPassword'] : '';
    $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : '';

    // Validações
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        send_response(false, ['message' => 'Todos os campos de senha são obrigatórios.'], 400);
        return;
    }
    if ($newPassword !== $confirmPassword) {
        send_response(false, ['message' => 'A nova senha e a confirmação não coincidem.'], 400);
        return;
    }
    // Adicionar validação de força da nova senha se necessário

    try {
        // Verifica a senha atual
        $stmtCheck = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmtCheck->execute([$userId]);
        $user = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
            send_response(false, ['message' => 'Senha atual incorreta.'], 400);
            return;
        }

        // Gera o hash da nova senha
        $new_password_hash = password_hash($newPassword, PASSWORD_DEFAULT);

        // Atualiza a senha no banco
        $stmtUpdate = $conn->prepare("UPDATE users SET password_hash = ?, updatedAt = NOW() WHERE id = ?");
        $success = $stmtUpdate->execute([$new_password_hash, $userId]);

        if ($success) {
            error_log("[AUTH_HANDLER] Senha alterada com sucesso para o usuário ID: $userId");
            send_response(true, ['message' => 'Senha alterada com sucesso!']);
        } else {
             error_log("[AUTH_HANDLER] Falha ao atualizar a senha no banco para o usuário ID: $userId");
            send_response(false, ['message' => 'Erro ao alterar a senha.'], 500);
        }

    } catch (PDOException $e) {
        error_log("Erro PDO handle_change_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro no banco de dados ao alterar a senha.'], 500);
    } catch (Exception $e) {
        error_log("Erro Geral handle_change_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao alterar a senha.'], 500);
    }
}


function handle_request_password_reset($conn, $data) {
    $email = isset($data['email']) ? trim($data['email']) : null;
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(false, ['message' => 'E-mail inválido ou ausente.'], 400);
        return;
    }

    try {
        // Verifica se o usuário existe
        $stmt = $conn->prepare("SELECT id, firstName FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Gera um token único e seguro
            $token = bin2hex(random_bytes(32));
            $expires = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); // Usar fuso horário consistente
            $expires->add(new DateInterval('PT1H')); // Token expira em 1 hora
            $expiresTimestamp = $expires->format('Y-m-d H:i:s');

            // Salva o token e a data de expiração no banco de dados
            $stmtUpdate = $conn->prepare("UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?");
            $updateSuccess = $stmtUpdate->execute([$token, $expiresTimestamp, $user['id']]);

            if ($updateSuccess) {
                // Envia o e-mail de redefinição
                 $resetLink = $data['baseUrl'] . '/#/reset-password?token=' . $token; // Assume que baseUrl vem do frontend
                $subject = 'Redefinição de Senha - Seu Sistema SGE';
                $body = "Olá {$user['firstName']},<br><br>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:<br><a href=\"{$resetLink}\">{$resetLink}</a><br><br>Este link expira em 1 hora.<br><br>Se você não solicitou isso, ignore este e-mail.";

                $emailSent = send_reset_email($email, $user['firstName'], $subject, $body); // Usa a função do email_helper.php

                if ($emailSent) {
                    send_response(true, ['message' => 'Instruções para redefinir sua senha foram enviadas para seu e-mail.']);
                } else {
                     error_log("[AUTH_HANDLER] Falha ao enviar email de redefinição para: $email");
                     // Não informa o erro exato ao usuário por segurança, mas mantém o registro no log
                    send_response(false, ['message' => 'Não foi possível enviar o e-mail de redefinição. Tente novamente mais tarde ou contate o suporte.'], 500);
                }
            } else {
                 error_log("[AUTH_HANDLER] Falha ao salvar token de redefinição no BD para: $email");
                send_response(false, ['message' => 'Erro ao processar a solicitação de redefinição.'], 500);
            }
        } else {
            // Email não encontrado - Resposta genérica por segurança
            send_response(true, ['message' => 'Se um e-mail correspondente for encontrado, instruções serão enviadas.']);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO handle_request_password_reset: " . $e->getMessage());
        send_response(false, ['message' => 'Erro no banco de dados.'], 500);
    } catch (Exception $e) { // Captura DateTime exceptions também
        error_log("Erro Geral handle_request_password_reset: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao solicitar redefinição.'], 500);
    }
}


function handle_reset_password($conn, $data) {
    $token = isset($data['token']) ? trim($data['token']) : null;
    $newPassword = isset($data['newPassword']) ? $data['newPassword'] : null;
    $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : null;

    if (empty($token) || empty($newPassword) || empty($confirmPassword)) {
        send_response(false, ['message' => 'Token e senhas são obrigatórios.'], 400);
        return;
    }
    if ($newPassword !== $confirmPassword) {
        send_response(false, ['message' => 'As senhas não coincidem.'], 400);
        return;
    }
    // Adicionar validação de força da senha se necessário

    try {
        // Busca o usuário pelo token e verifica a expiração
        $stmt = $conn->prepare("SELECT id, reset_token_expires_at FROM users WHERE reset_token = ?");
        $stmt->execute([$token]);
        $foundUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$foundUser) {
            send_response(false, ['message' => 'Link de redefinição inválido ou já utilizado.'], 400);
            return;
        }

        // Verifica se o token expirou
        $expires = new DateTime($foundUser['reset_token_expires_at'], new DateTimeZone('America/Sao_Paulo'));
        $now = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));

        if ($now > $expires) {
            // Opcional: Limpar o token expirado do banco aqui
            // $stmtClearExpired = $conn->prepare("UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?");
            // $stmtClearExpired->execute([$foundUser['id']]);
            send_response(false, ['message' => 'Link de redefinição expirado.'], 400);
            return;
        }

        // Token válido e não expirado, atualiza a senha
        $new_password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmtUpdate = $conn->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?");
        $success = $stmtUpdate->execute([$new_password_hash, $foundUser['id']]);

        if ($success) {
            send_response(true, ['message' => 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.']);
        } else {
             error_log("[AUTH_HANDLER] Falha ao atualizar a senha após reset para user ID: " . $foundUser['id']);
            send_response(false, ['message' => 'Falha ao atualizar a senha.'], 500);
        }

    } catch (PDOException $e) {
        error_log("Erro PDO handle_reset_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao redefinir a senha.'], 500);
    } catch (\Exception $e) { // Captura DateTime exceptions
        error_log("Erro Geral handle_reset_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao processar a redefinição de senha.'], 500);
    }
}
?>