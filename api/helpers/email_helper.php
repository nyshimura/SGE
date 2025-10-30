<?php
// Inclui as classes do PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Ajusta o caminho para a pasta 'api/phpmailer/'
require_once __DIR__ . '/../phpmailer/Exception.php';
require_once __DIR__ . '/../phpmailer/PHPMailer.php';
require_once __DIR__ . '/../phpmailer/SMTP.php';

/**
 * Envia um e-mail usando as configurações SMTP do sistema.
 *
 * @param PDO $conn A conexão PDO com o banco de dados.
 * @param string $toEmail O e-mail do destinatário.
 * @param string $toName O nome do destinatário (opcional).
 * @param string $subject O assunto do e-mail.
 * @param string $bodyHTML O corpo do e-mail em HTML.
 * @return bool True se o e-mail foi enviado com sucesso, False caso contrário.
 */
function send_system_email(PDO $conn, $toEmail, $toName, $subject, $bodyHTML)
{
    // 1. Busca as configurações SMTP e nome da escola
    try {
        $stmtSettings = $conn->query("SELECT smtpServer, smtpPort, smtpUser, smtpPass FROM system_settings WHERE id = 1 LIMIT 1");
        $settings = $stmtSettings->fetch(PDO::FETCH_ASSOC);

        if (empty($settings['smtpServer']) || empty($settings['smtpPort']) || empty($settings['smtpUser']) || !isset($settings['smtpPass'])) {
            error_log("SGE Email Error: Configurações SMTP incompletas.");
            return false;
        }

        $stmtSchool = $conn->query("SELECT name FROM school_profile WHERE id = 1 LIMIT 1");
        $schoolName = $stmtSchool->fetchColumn() ?: 'Sistema SGE';

    } catch (PDOException $e) {
        error_log("SGE Email Error (PDO): " . $e->getMessage());
        return false;
    }

    // 2. Configura e envia o e-mail
    $mail = new PHPMailer(true); // Habilita exceções



    try {
        // Configurações do Servidor
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Para depuração
        $mail->isSMTP();
        $mail->Host       = $settings['smtpServer'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $settings['smtpUser'];
        $mail->Password   = $settings['smtpPass'];

        // Define criptografia (TLS/SSL) baseado na porta
        if ($settings['smtpPort'] == 587) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } elseif ($settings['smtpPort'] == 465) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
             $mail->SMTPSecure = false; // Ou PHPMailer::ENCRYPTION_STARTTLS se a porta 25 suportar STARTTLS
             $mail->SMTPAutoTLS = false; // Desativa AutoTLS se a porta for 25 ou outra não padrão sem SSL/TLS explícito
        }

        $mail->Port       = (int)$settings['smtpPort'];
        $mail->CharSet    = PHPMailer::CHARSET_UTF8;

        // Remetente
        $mail->setFrom($settings['smtpUser'], $schoolName);

        // Destinatário
        $mail->addAddress($toEmail, $toName ?: '');

        // Conteúdo
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $bodyHTML;
        $mail->AltBody = strip_tags($bodyHTML); // Versão texto puro

        $mail->send();
        error_log("SGE Email Success: E-mail enviado para $toEmail.");
        return true; 

    } catch (Exception $e) {
        error_log("SGE Email Error (PHPMailer Exception Catch): Falha ao enviar para $toEmail. Erro: {$mail->ErrorInfo}");
         return false; // Retorna false se uma exceção foi capturada
    }
}


/**
 * Prepara e envia o e-mail de redefinição de senha.
 * * @param PDO $conn A conexão PDO.
 * @param string $toEmail E-mail do destinatário.
 * @param int $userId ID do usuário (para buscar o nome).
 * @param string $resetLink O link completo de redefinição.
 * @return bool True se o e-mail foi enviado, False caso contrário.
 */
function send_password_reset_email($conn, $toEmail, $userId, $resetLink) {
    // 1. Obter nome do usuário
    $userName = 'Usuário'; // Valor padrão
    try {
        $stmtUser = $conn->prepare("SELECT firstName FROM users WHERE id = :id");
        $stmtUser->execute([':id' => $userId]);
        $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
        if ($user && !empty($user['firstName'])) {
            $userName = $user['firstName'];
        }
    } catch (PDOException $e) {
        error_log("Email Helper: Não foi possível buscar o nome do usuário $userId: " . $e->getMessage());
        // Continua com o nome padrão
    }

    // 2. Obter nome da escola e templates de e-mail
    $schoolName = 'Sistema SGE'; // Padrão
    $subjectTemplate = 'Redefinição de Senha'; // Padrão
    $bodyTemplate = 'Olá {{user_name}},<br><br>Clique no link a seguir para redefinir sua senha: <a href="{{reset_link}}">{{reset_link}}</a><br><br>Atenciosamente,<br>Equipe {{escola_nome}}'; // Padrão

    if (function_exists('get_system_settings')) {
        $settings = get_system_settings($conn);
        if ($settings) {
            $subjectTemplate = $settings['email_reset_subject'] ?? $subjectTemplate;
            $bodyTemplate = $settings['email_reset_body'] ?? $bodyTemplate;
        }
    } else {
        error_log("Email Helper: A função get_system_settings() não foi encontrada. Usando templates padrão.");
    }
    
    try {
         $stmtSchool = $conn->query("SELECT name FROM school_profile WHERE id = 1 LIMIT 1");
         $schoolNameResult = $stmtSchool->fetchColumn();
         if ($schoolNameResult) {
             $schoolName = $schoolNameResult;
         }
    } catch (PDOException $e) {
         error_log("Email Helper: Não foi possível buscar nome da escola: " . $e->getMessage());
    }


    // 3. Substituir placeholders (*** CORREÇÃO APLICADA AQUI ***)
    
    // (Assunto)
    $subject = str_replace('{{escola_nome}}', $schoolName, $subjectTemplate);
    $subject = str_replace('{{user_name}}', $userName, $subject);

    // (Corpo)
    $body = str_replace('{{user_name}}', $userName, $bodyTemplate);
    $body = str_replace('{{reset_link}}', $resetLink, $body);
    $body = str_replace('{{escola_nome}}', $schoolName, $body);

    // 4. Chamar a função de envio principal
    return send_system_email($conn, $toEmail, $userName, $subject, $body);
}

?>