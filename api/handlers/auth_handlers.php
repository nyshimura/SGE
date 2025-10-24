<?php
// Inclui o helper de e-mail no início do arquivo, se ainda não estiver incluído
require_once __DIR__ . '/../helpers/email_helper.php';

function handle_login($conn, $data) {
    $email = isset($data['email']) ? trim($data['email']) : null; // Adiciona trim()
    $password = isset($data['password']) ? $data['password'] : null;
    if (!$email || !$password) { send_response(false, ['message' => 'Email e senha são obrigatórios.'], 400); return; } // Adiciona return
    try {
        $stmt = $conn->prepare("SELECT id, firstName, lastName, email, role, profilePicture, password_hash FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC); // Usa FETCH_ASSOC
        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            send_response(true, ['user' => $user]);
        } else {
            send_response(false, ['message' => 'Email ou senha inválidos.'], 401);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO handle_login: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao tentar fazer login.'], 500);
    } catch (Exception $e) {
        error_log("Erro geral handle_login: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao processar login.'], 500);
    }
}

function handle_register($conn, $data) {
    $name = isset($data['name']) ? trim($data['name']) : null; // Adiciona trim()
    $email = isset($data['email']) ? trim($data['email']) : null; // Adiciona trim()
    $password = isset($data['password']) ? $data['password'] : null;
    if (!$name || !$email || !$password) { send_response(false, ['message' => 'Nome, email e senha são obrigatórios.'], 400); return; } // Adiciona return
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { send_response(false, ['message' => 'Formato de email inválido.'], 400); return; } // Adiciona return
    if (strlen($password) < 6) { send_response(false, ['message' => 'A senha deve ter pelo menos 6 caracteres.'], 400); return; } // Validação de senha

    try {
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) { send_response(false, ['message' => 'Este email já está em uso.'], 409); return; } // Adiciona return

        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (firstName, email, password_hash, role) VALUES (?, ?, ?, 'unassigned')");
        $success = $stmt->execute([$name, $email, $password_hash]);
        if ($success) {
            send_response(true, ['message' => 'Usuário cadastrado com sucesso.']);
        } else {
            send_response(false, ['message' => 'Falha ao cadastrar usuário.'], 500);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO handle_register: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao registrar usuário.'], 500);
    } catch (Exception $e) {
        error_log("Erro geral handle_register: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao registrar.'], 500);
    }
}

function handle_change_password($conn, $data) {
    $userId = isset($data['userId']) ? filter_var($data['userId'], FILTER_VALIDATE_INT) : null; // Usa filter_var
    $currentPassword = isset($data['currentPassword']) ? $data['currentPassword'] : null;
    $newPassword = isset($data['newPassword']) ? $data['newPassword'] : null;
    if (!$userId || !$currentPassword || !$newPassword) { send_response(false, ['message' => 'Todos os campos são obrigatórios.'], 400); return; } // Adiciona return
    if (strlen($newPassword) < 6) { send_response(false, ['message' => 'A nova senha deve ter pelo menos 6 caracteres.'], 400); return; } // Validação

    try {
        $stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC); // Usa FETCH_ASSOC
        if (!$user) { send_response(false, ['message' => 'Usuário não encontrado.'], 404); return; } // Adiciona return

        if (password_verify($currentPassword, $user['password_hash'])) {
            $new_password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $success = $updateStmt->execute([$new_password_hash, $userId]);
            if ($success) {
                send_response(true, ['message' => 'Senha alterada com sucesso.']);
            } else {
                send_response(false, ['message' => 'Falha ao atualizar a senha.'], 500);
            }
        } else {
            send_response(false, ['message' => 'A senha atual está incorreta.'], 401);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO handle_change_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao alterar a senha.'], 500);
    } catch (Exception $e) {
        error_log("Erro geral handle_change_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao alterar senha.'], 500);
    }
}

// --- NOVAS FUNÇÕES ---

function handle_request_password_reset(PDO $conn, $data) {
    $email = isset($data['email']) ? trim($data['email']) : null;
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Retorna sucesso mesmo com e-mail inválido para não revelar quais e-mails existem
        send_response(true, ['message' => 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.']);
        return;
    }

    try {
        // Verifica se o usuário existe
        $stmtUser = $conn->prepare("SELECT id, firstName FROM users WHERE email = ? LIMIT 1");
        $stmtUser->execute([$email]);
        $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Gera token seguro
            $token = bin2hex(random_bytes(32));
            $token_hash = password_hash($token, PASSWORD_DEFAULT); // Armazena o HASH

            // Define tempo de expiração (ex: 1 hora)
            $expires = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
            $expires->add(new DateInterval('PT1H')); // PT1H = Period Time 1 Hour
            $expires_at = $expires->format('Y-m-d H:i:s');

            // Atualiza o usuário com o hash do token e a expiração
            $stmtUpdate = $conn->prepare("UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?");
            $stmtUpdate->execute([$token_hash, $expires_at, $user['id']]);

            // Busca configurações para montar o link e buscar o template do e-mail
            // ***** CORREÇÃO: Busca nome da escola na tabela school_profile *****
            $stmtSettings = $conn->query("
                SELECT ss.site_url, ss.email_reset_subject, ss.email_reset_body, ss.smtpUser, sp.name as schoolName
                FROM system_settings ss
                JOIN school_profile sp ON sp.id = 1
                WHERE ss.id = 1 LIMIT 1
            ");
            $settings = $stmtSettings->fetch(PDO::FETCH_ASSOC);
            // ***** FIM DA CORREÇÃO *****

            // Verifica se as configurações de e-mail existem
            if ($settings && !empty($settings['site_url']) && !empty($settings['email_reset_subject']) && !empty($settings['email_reset_body']) && !empty($settings['smtpUser']) && !empty($settings['schoolName'])) { // Adiciona verificação de schoolName
                $siteUrl = rtrim($settings['site_url'], '/');
                $resetLink = $siteUrl . '/#resetPassword?token=' . $token; // Usa o token original no link

                // ***** CORREÇÃO: Adiciona {{escola_nome}} aos placeholders *****
                $placeholders = [
                    '{{user_name}}'   => htmlspecialchars($user['firstName']), // Nome do Destinatário
                    '{{reset_link}}'  => $resetLink,                           // Link direto para reset
                    '{{escola_nome}}' => htmlspecialchars($settings['schoolName']) // Nome da Escola
                ];
                // ***** FIM DA CORREÇÃO *****

                // Substitui placeholders no Assunto e Corpo
                $subject = $settings['email_reset_subject'];
                $bodyHTML = nl2br($settings['email_reset_body']); // Converte \n para <br>

                foreach ($placeholders as $key => $value) {
                    $subject = str_replace($key, $value ?? '', $subject); // Adiciona ?? '' para evitar erros com null
                    $bodyHTML = str_replace($key, $value ?? '', $bodyHTML);
                }

                // Tenta enviar o e-mail
                $emailSent = send_system_email($conn, $email, $user['firstName'], $subject, $bodyHTML); // Adicionado $emailSent

                if ($emailSent) {
                    error_log("Solicitação de reset de senha para: $email. Token enviado.");
                } else {
                    error_log("Falha ao TENTAR enviar e-mail de reset para $email via send_system_email. Verifique logs do helper.");
                    // Não envia erro para o usuário aqui, mantém a resposta genérica
                }

            } else {
                error_log("Erro ao enviar e-mail de reset para $email: Configurações de site_url, template/SMTP ou nome da escola ausentes.");
            }
        } else {
             error_log("Tentativa de reset de senha para e-mail não cadastrado: $email");
        }

        // Resposta genérica para o frontend em ambos os casos (usuário existe ou não)
        send_response(true, ['message' => 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.']);

    } catch (PDOException $e) {
        error_log("Erro PDO handle_request_password_reset: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao processar a solicitação.'], 500);
    } catch (\Exception $e) { // Captura exceções gerais (ex: random_bytes, DateTime)
        error_log("Erro geral handle_request_password_reset: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao processar a solicitação.'], 500);
    }
}


function handle_reset_password(PDO $conn, $data) {
    $token = isset($data['token']) ? $data['token'] : null;
    $newPassword = isset($data['newPassword']) ? $data['newPassword'] : null;

    if (!$token || !$newPassword) {
        send_response(false, ['message' => 'Token e nova senha são obrigatórios.'], 400);
        return;
    }
    if (strlen($newPassword) < 6) {
        send_response(false, ['message' => 'A nova senha deve ter pelo menos 6 caracteres.'], 400);
        return;
    }

    try {
        // Busca todos os usuários com tokens de reset não nulos (otimização)
        $stmtFind = $conn->prepare("SELECT id, reset_token, reset_token_expires_at FROM users WHERE reset_token IS NOT NULL");
        $stmtFind->execute();
        $usersWithTokens = $stmtFind->fetchAll(PDO::FETCH_ASSOC);

        $foundUser = null;

        // Verifica o hash do token recebido contra os hashes armazenados
        foreach ($usersWithTokens as $user) {
            // Verifica se reset_token não é nulo antes de usar password_verify
            if ($user['reset_token'] !== null && password_verify($token, $user['reset_token'])) {
                $foundUser = $user;
                break; // Encontrou o usuário correspondente
            }
        }

        if (!$foundUser) {
            send_response(false, ['message' => 'Link de redefinição inválido ou expirado.'], 400);
            return;
        }

        // Verifica a expiração do token
        // Certifica-se que a data de expiração existe antes de criar DateTime
        if (empty($foundUser['reset_token_expires_at'])) {
             send_response(false, ['message' => 'Link de redefinição inválido (sem expiração).'], 400);
             return;
        }
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
            send_response(false, ['message' => 'Falha ao atualizar a senha.'], 500);
        }

    } catch (PDOException $e) {
        error_log("Erro PDO handle_reset_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao redefinir a senha.'], 500);
    } catch (\Exception $e) { // Captura DateTime exceptions
        error_log("Erro geral handle_reset_password: " . $e->getMessage());
        send_response(false, ['message' => 'Erro interno ao processar a redefinição.'], 500);
    }
}
// --- FIM DAS NOVAS FUNÇÕES ---

?>