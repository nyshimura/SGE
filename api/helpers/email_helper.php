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
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Linha original comentada, substituída acima
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
        error_log("SGE Email Success: Tentativa de envio para $toEmail concluída pela função send(). Verifique os logs de debug para confirmação do servidor."); // Mensagem ajustada
        return true; // Retorna true indicando que send() foi chamado

    } catch (Exception $e) {
        // O debug já loga o erro detalhado, aqui logamos um resumo
        error_log("SGE Email Error (PHPMailer Exception Catch): Falha ao enviar para $toEmail. Erro: {$mail->ErrorInfo}");
        // Não retorna false imediatamente aqui se o debug estiver ativo,
        // pois a comunicação pode ter ocorrido mas falhado (ex: destinatário inválido).
        // A função chamadora tratará o retorno baseado no sucesso da API.
        // A menos que a exceção seja crítica (conexão, auth), o processo pode continuar.
         return false; // Retorna false se uma exceção foi capturada
    }
}
?>