<?php
// api/handlers/certificate_handler.php

require_once __DIR__ . '/../fpdf/fpdf.php';
require_once __DIR__ . '/pdf_helpers.php';
require_once __DIR__ . '/pdf_classes.php';
require_once __DIR__ . '/../libs/phpqrcode/qrlib.php';

// A CLASSE PDF_Certificate está em pdf_classes.php

/**
 * Busca detalhes completos para o certificado.
 */
function get_certificate_details(PDO $conn, $studentId, $courseId) {
    error_log("Buscando detalhes do certificado para Aluno ID:$studentId, Curso ID:$courseId");

    $sql = " SELECT
                u.id as studentId, u.firstName, u.lastName, u.cpf as aluno_cpf, u.rg as aluno_rg, u.birthDate, -- Adicionado birthDate aqui também se necessário em outros lugares
                c.id as courseId, c.name as courseName, c.carga_horaria,
                t.firstName as teacherFirstName, t.lastName as teacherLastName,
                s.name as schoolName, s.cnpj as schoolCnpj, s.address as schoolAddress,
                s.profilePicture, s.schoolCity, s.state,
                st.certificate_template_text, st.certificate_background_image, st.site_url
            FROM
                users u
            INNER JOIN
                enrollments e ON u.id = e.studentId
            INNER JOIN
                courses c ON e.courseId = c.id
            LEFT JOIN
                users t ON c.teacherId = t.id
            INNER JOIN
                system_settings st ON st.id = 1
            INNER JOIN
                school_profile s ON s.id = 1
            WHERE
                u.id = :studentId AND c.id = :courseId
                /* AND e.status = 'Aprovada' */
            LIMIT 1 ";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute([':studentId' => $studentId, ':courseId'  => $courseId]);
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$details) {
            error_log("AVISO: A query em get_certificate_details não retornou resultados para Aluno ID:$studentId e Curso ID:$courseId.");
        }
        return $details;

    } catch (PDOException $e) {
        error_log("!!! PDO EXCEPTION em get_certificate_details (S:$studentId, C:$courseId): " . $e->getMessage());
        return false;
    }
}

/**
 * Gera o PDF do certificado e o hash.
 */
function generate_certificate_pdf_and_hash($details, $completionDate, $overrideCargaHoraria = null, $existingHash = null) {
    // ... (código da função inalterado) ...
    if (!$details) {
         throw new Exception("Falha interna: Detalhes básicos (aluno/curso/escola) não foram carregados do banco de dados.");
    }
    if (empty($details['certificate_template_text'])) {
         throw new Exception("O texto do modelo do certificado (certificate_template_text) está VAZIO no banco de dados.");
    }

    $cargaHoraria = (!empty($overrideCargaHoraria)) ? $overrideCargaHoraria : ($details['carga_horaria'] ?: 'Não definida');
    try {
        $completionDateObj = new DateTime($completionDate);
        $completionDateFormatted = $completionDateObj->format('d/m/Y');
    } catch (Exception $e) {
        throw new Exception("Formato inválido para a data de conclusão recebida: " . $completionDate);
    }

    $meses = [1=>"Janeiro",2=>"Fevereiro",3=>"Março",4=>"Abril",5=>"Maio",6=>"Junho",7=>"Julho",8=>"Agosto",9=>"Setembro",10=>"Outubro",11=>"Novembro",12=>"Dezembro"];

    $schoolCity = $details['schoolCity'] ?? 'Guarulhos';
    $schoolState = $details['state'] ?? 'SP';
    $data_emissao_extenso = $schoolCity . ', ' . date('d') . ' de ' . $meses[(int)date('n')] . ' de ' . date('Y');

    $verificationHash = null;
    if (!empty($existingHash) && preg_match('/^[a-f0-9]{64}$/i', $existingHash)) {
        $verificationHash = $existingHash;
    } else {
        $hashData = "{$details['studentId']}|{$details['courseId']}|{$completionDateFormatted}|{$cargaHoraria}|" . microtime();
        $verificationHash = hash('sha256', $hashData);
    }

    $aluno_nome_completo = trim(($details['firstName'] ?? '') . ' ' . ($details['lastName'] ?? ''));
    $professor_nome = trim(($details['teacherFirstName'] ?? '') . ' ' . ($details['teacherLastName'] ?? 'N/A'));

    $replacements = [
        '{{aluno_nome}}' => $aluno_nome_completo, '{{aluno_cpf}}' => $details['aluno_cpf'] ?? 'N/A', '{{aluno_rg}}' => $details['aluno_rg'] ?? 'N/A',
        '{{curso_nome}}' => $details['courseName'] ?? 'N/A', '{{curso_carga_horaria}}' => $cargaHoraria,
        '{{data_conclusao}}' => $completionDateFormatted, '{{data_emissao_extenso}}' => $data_emissao_extenso,
        '{{escola_nome}}' => $details['schoolName'] ?? 'N/A', '{{escola_cnpj}}' => $details['schoolCnpj'] ?? 'N/A', '{{escola_endereco}}' => $details['schoolAddress'] ?? 'N/A',
        '{{cidade_escola}}' => $schoolCity,
        '{{estado_escola}}' => $schoolState,
        '{{professor_nome}}' => $professor_nome, '{{hash_verificacao}}' => $verificationHash,
    ];

    $documentText = $details['certificate_template_text'];
    foreach ($replacements as $ph => $val) {
        $documentText = str_replace($ph, (string)($val ?? ''), $documentText);
    }

    $pdf = new PDF_Certificate('L', 'mm', 'A4');
    $tmp_files = [];

    try {
        // ... (lógica de geração do PDF inalterada) ...
        if (!empty($details['certificate_background_image'])) {
            $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['certificate_background_image']));
            if ($img_data !== false) {
                $finfo = finfo_open(); $mime = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE); finfo_close($finfo);
                $ext = ($mime === 'image/jpeg') ? '.jpg' : '.png';
                $tmp_bg_path = sys_get_temp_dir().'/cert_bg_'.uniqid().$ext;
                if (file_put_contents($tmp_bg_path, $img_data)) {
                    $tmp_files[] = $tmp_bg_path;
                    $pdf->SetBackgroundImage($tmp_bg_path);
                }
            }
        }
        $pdf->AddPage();
        $pdf->SetMargins(25, 25, 25);
        $pdf->SetAutoPageBreak(false);
        $posY_after_logo = add_centered_logo($pdf, $details['profilePicture'] ?? null, $tmp_files);
        $main_text_y = $posY_after_logo + 15;
        $pdf->SetY($main_text_y);
        $pdf->SetX(25);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(0, 0, 0);
        $leftMargin = 25; $rightMargin = 25;
        $cellWidth = $pdf->GetPageWidth() - $leftMargin - $rightMargin;
        $pdf->MultiCell($cellWidth, 7, to_iso($documentText), 0, 'C');
        if (class_exists('QRcode') && !empty($verificationHash)) {
             $verificationUrlBase = rtrim($details['site_url'] ?? '', '/') . '/verificar/';
             $verificationUrl = $verificationUrlBase . '?hash=' . $verificationHash;
             $tmp_qr_path = sys_get_temp_dir() . '/cert_qr_' . uniqid() . '.png';
             QRcode::png($verificationUrl, $tmp_qr_path, QR_ECLEVEL_L, 4, 2);
             $tmp_files[] = $tmp_qr_path;
             $qrCodeSize = 30; $qrCodeX = $leftMargin; $bottomMargin = 25;
             $qrCodeY = $pdf->GetPageHeight() - $bottomMargin - $qrCodeSize;
             if (file_exists($tmp_qr_path)) {
                 $pdf->Image($tmp_qr_path, $qrCodeX, $qrCodeY, $qrCodeSize, $qrCodeSize);
                 $textX = $qrCodeX + $qrCodeSize + 5; $textY = $qrCodeY + ($qrCodeSize / 2) - 5;
                 $pdf->SetXY($textX, $textY); $pdf->SetFont('Arial', '', 8); $pdf->SetTextColor(80, 80, 80);
                 $pdf->MultiCell(100, 4, to_iso("Verifique a autenticidade em:\n" . $verificationUrlBase . "\nCódigo: " . $verificationHash), 0, 'L');
             }
        }
        foreach ($tmp_files as $file) { if (file_exists($file)) @unlink($file); }
        return ['pdfData' => $pdf->Output('S'), 'hash' => $verificationHash];
    } catch (Exception $e) {
        foreach ($tmp_files as $file) { if (file_exists($file)) @unlink($file); }
        throw $e;
    }
}

/**
 * Handler para GERAR certificado individual (usado por Admin).
 */
function handle_generate_certificate(PDO $conn, $data) {
    // ... (código da função inalterado) ...
    error_reporting(E_ALL); ini_set('display_errors', 0); ini_set('log_errors', 1);
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0;
    $courseId = isset($data['courseId']) ? filter_var($data['courseId'], FILTER_VALIDATE_INT) : 0;
    $overrideCargaHoraria = isset($data['overrideCargaHoraria']) && trim($data['overrideCargaHoraria']) !== '' ? trim($data['overrideCargaHoraria']) : null;
    $completionDate = isset($data['completionDate']) && trim($data['completionDate']) !== '' ? trim($data['completionDate']) : date('Y-m-d');
    if ($studentId <= 0 || $courseId <= 0) { send_response(false, ['message' => 'ID do aluno ou curso inválido.'], 400); return; }
    if (DateTime::createFromFormat('Y-m-d', $completionDate) === false) { send_response(false, ['message' => 'Formato da data de conclusão inválido. Use AAAA-MM-DD.'], 400); return; }
    try {
        $details = get_certificate_details($conn, $studentId, $courseId);
        if (!$details) { throw new Exception("Não foi encontrada uma matrícula que conecte o Aluno ID:$studentId ao Curso ID:$courseId."); }
        $pdfResult = generate_certificate_pdf_and_hash($details, $completionDate, $overrideCargaHoraria, null);
        $pdfData = $pdfResult['pdfData']; $verificationHash = $pdfResult['hash'];
        $conn->beginTransaction();
        try {
            $stmtInsert = $conn->prepare("INSERT INTO certificates (student_id, course_id, completion_date, verification_hash) VALUES (?, ?, ?, ?)");
            $stmtInsert->execute([$studentId, $courseId, $completionDate, $verificationHash]);
        } catch (PDOException $e) { if ($e->errorInfo[1] == 1062) { error_log("Aviso: Tentativa de inserir certificado duplicado (S:$studentId, C:$courseId). Hash: $verificationHash"); } else { throw $e; } }
        $conn->commit();
        $safeFirstName = preg_replace('/[^a-z0-9_]/i', '_', $details['firstName'] ?? 'aluno');
        $filename = "certificado_" . $safeFirstName . "_" . $studentId . ".pdf";
        if (ob_get_level()) { ob_end_clean(); } header('Content-Type: application/pdf'); header('Content-Disposition: inline; filename="' . $filename . '"'); header('Content-Length: ' . strlen($pdfData)); echo $pdfData; exit();
    } catch (Exception $e) { if ($conn->inTransaction()) { $conn->rollBack(); } $errorMessage = $e->getMessage(); error_log("!!! Erro FATAL ao gerar certificado (S:$studentId, C:$courseId): " . $errorMessage); if (!headers_sent()) { http_response_code(500); header("Content-Type: application/json; charset=utf-8"); echo json_encode(['success' => false, 'data' => ['message' => "Erro interno ao gerar o certificado: " . $errorMessage]]); } exit; }
}

/**
 * Handler para VISUALIZAR um certificado existente (usado por Aluno).
 */
function handle_view_certificate(PDO $conn, $data) {
    // ... (código da função inalterado) ...
    error_reporting(E_ALL); ini_set('display_errors', 0); ini_set('log_errors', 1);
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0;
    $courseId = isset($data['courseId']) ? filter_var($data['courseId'], FILTER_VALIDATE_INT) : 0;
    $completionDate = isset($data['completionDate']) && trim($data['completionDate']) !== '' ? trim($data['completionDate']) : null;
    $existingHash = isset($data['existingHash']) ? trim($data['existingHash']) : null;
    if ($studentId <= 0 || $courseId <= 0) { send_response(false, ['message' => 'ID do aluno ou curso inválido.'], 400); return; }
    if (empty($completionDate) || DateTime::createFromFormat('Y-m-d', $completionDate) === false) { send_response(false, ['message' => 'Data de conclusão inválida ou ausente.'], 400); return; }
    if (empty($existingHash) || !preg_match('/^[a-f0-9]{64}$/i', $existingHash)) { send_response(false, ['message' => 'Hash de verificação inválido ou ausente.'], 400); return; }
    try {
        $details = get_certificate_details($conn, $studentId, $courseId);
        if (!$details) { throw new Exception("Não foram encontrados detalhes básicos para Aluno ID:$studentId e Curso ID:$courseId."); }
        $pdfResult = generate_certificate_pdf_and_hash($details, $completionDate, null, $existingHash);
        $pdfData = $pdfResult['pdfData'];
        $safeFirstName = preg_replace('/[^a-z0-9_]/i', '_', $details['firstName'] ?? 'aluno');
        $filename = "certificado_" . $safeFirstName . "_" . $studentId . ".pdf";
        if (ob_get_level()) { ob_end_clean(); } header('Content-Type: application/pdf'); header('Content-Disposition: inline; filename="' . $filename . '"'); header('Content-Length: ' . strlen($pdfData)); echo $pdfData; exit();
    } catch (Exception $e) { $errorMessage = $e->getMessage(); error_log("!!! Erro ao visualizar certificado (S:$studentId, C:$courseId, H:$existingHash): " . $errorMessage); if (!headers_sent()) { http_response_code(500); header("Content-Type: application/json; charset=utf-8"); echo json_encode(['success' => false, 'data' => ['message' => "Erro interno ao gerar a visualização: " . $errorMessage]]); } exit; }
}


/**
 * Handler para gerar certificados em massa.
 */
function handle_generate_bulk_certificates(PDO $conn, $data) {
    send_response(false, ['message' => 'Geração em massa ainda não implementada.'], 501);
}

/**
 * Handler para verificar certificado (PÚBLICO).
 */
function handle_verify_certificate(PDO $conn, $data) {
    $hash = isset($data['hash']) ? trim($data['hash']) : '';
    if (empty($hash) || !preg_match('/^[a-f0-9]{64}$/i', $hash)) {
        send_response(false, ['message' => 'Hash de verificação inválido ou ausente.'], 400); return;
    }

    // <<< INÍCIO ALTERAÇÃO 1: Adicionar cpf e birthDate à query >>>
    $sql = "SELECT
                c.id as certificateId, c.completion_date, c.generated_at,
                u.firstName as studentFirstName, u.lastName as studentLastName,
                u.cpf AS studentCpf, u.birthDate AS studentBirthDate, -- <<< CAMPOS ADICIONADOS
                co.name as courseName
            FROM certificates c
            INNER JOIN users u ON c.student_id = u.id
            INNER JOIN courses co ON c.course_id = co.id
            WHERE c.verification_hash = :hash LIMIT 1";
    // <<< FIM ALTERAÇÃO 1 >>>

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute([':hash' => $hash]);
        $certificateInfo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($certificateInfo) {
            // Formata data de conclusão
            try {
                $completionDate = new DateTime($certificateInfo['completion_date']);
                $certificateInfo['completion_date_formatted'] = $completionDate->format('d/m/Y');
            } catch (Exception $e) {
                $certificateInfo['completion_date_formatted'] = 'Data Inválida'; // Fallback
            }

            // <<< INÍCIO ALTERAÇÃO 2: Formatar Data Nasc e Mascarar CPF >>>
            // Formata data de nascimento
            $certificateInfo['studentBirthDate_formatted'] = 'N/A'; // Valor padrão
            if (!empty($certificateInfo['studentBirthDate'])) {
                try {
                    $birthDateObj = new DateTime($certificateInfo['studentBirthDate']);
                    $certificateInfo['studentBirthDate_formatted'] = $birthDateObj->format('d/m/Y');
                } catch (Exception $e) {
                    $certificateInfo['studentBirthDate_formatted'] = 'Data Inválida'; // Fallback
                }
            }

            // Mascara CPF
            $certificateInfo['studentCpf_masked'] = 'N/A'; // Valor padrão
            if (!empty($certificateInfo['studentCpf'])) {
                $cpf = preg_replace('/[^0-9]/', '', $certificateInfo['studentCpf']); // Remove não numéricos
                if (strlen($cpf) === 11) {
                    // Formato: ***.###.###-**
                    $certificateInfo['studentCpf_masked'] = '***.' . substr($cpf, 3, 3) . '.' . substr($cpf, 6, 3) . '-**';
                } else {
                     $certificateInfo['studentCpf_masked'] = 'CPF Inválido'; // Ou apenas 'N/A'
                }
            }
            // Remove os campos originais se não quiser enviá-los (opcional)
            // unset($certificateInfo['studentBirthDate']);
            // unset($certificateInfo['studentCpf']);
            // <<< FIM ALTERAÇÃO 2 >>>

            send_response(true, ['certificate' => $certificateInfo, 'message' => 'Certificado válido.']);
        } else {
            send_response(false, ['message' => 'Certificado não encontrado ou inválido.'], 404);
        }
    } catch (PDOException $e) {
        error_log("Erro PDO ao verificar certificado (Hash: $hash): " . $e->getMessage());
        send_response(false, ['message' => 'Erro ao consultar o banco de dados.'], 500);
    }
}

/**
 * Handler para buscar certificados de um aluno específico.
 */
function handle_get_student_certificates(PDO $conn, $data) {
    // ... (código da função inalterado) ...
    $studentId = isset($data['studentId']) ? filter_var($data['studentId'], FILTER_VALIDATE_INT) : 0;
    if ($studentId <= 0) { send_response(false, ['message' => 'ID do aluno inválido.'], 400); return; }
    $sql = "SELECT cert.id as certificateId, cert.course_id as courseId,
                   co.name as courseName, cert.completion_date,
                   cert.verification_hash, cert.generated_at
            FROM certificates cert
            INNER JOIN courses co ON cert.course_id = co.id
            WHERE cert.student_id = :studentId
            ORDER BY cert.completion_date DESC, co.name ASC";
    try {
        $stmt = $conn->prepare($sql); $stmt->execute([':studentId' => $studentId]);
        $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($certificates) {
            foreach ($certificates as &$cert) {
                try { $dateObj = new DateTime($cert['completion_date']); $cert['completion_date_formatted'] = $dateObj->format('d/m/Y'); } catch (Exception $e) { $cert['completion_date_formatted'] = 'Data inválida'; }
            } send_response(true, ['certificates' => $certificates]);
        } else { send_response(true, ['certificates' => [], 'message' => 'Nenhum certificado encontrado para este aluno.']); }
    } catch (PDOException $e) { error_log("Erro PDO ao buscar certificados (Aluno ID $studentId): " . $e->getMessage()); send_response(false, ['message' => 'Erro ao consultar BD.'], 500); }
}


// Garante que a função send_response exista
if (!function_exists('send_response')) {
    function send_response($success, $data, $statusCode = 200) {
        if (headers_sent()) { error_log("Tentativa de chamar send_response após headers já enviados."); return; }
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $success, 'data' => $data]);
        exit;
    }
}
?>