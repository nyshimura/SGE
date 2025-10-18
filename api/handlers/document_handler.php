<?php
// Função para converter texto para o formato que a FPDF espera (ISO-8859-1)
if (!function_exists('to_iso')) {
    function to_iso($string) {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $string ?? '');
    }
}

// Função auxiliar para escrever o valor por extenso
if (!function_exists('valorPorExtenso')) {
    function valorPorExtenso($valor = 0) {
        // ... (código da função valorPorExtenso - sem alterações) ...
        $singular = array("centavo", "real", "mil", "milhão", "bilhão", "trilhão", "quatrilhão");
        $plural = array("centavos", "reais", "mil", "milhões", "bilhões", "trilhões", "quatrilhões");
        $c = array("", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos");
        $d = array("", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa");
        $d10 = array("dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezesete", "dezoito", "dezenove");
        $u = array("", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove");
        $z = 0;
        $valor = number_format($valor, 2, ".", ".");
        $inteiro = explode(".", $valor);
        $rt = "";
        for ($i = 0; $i < count($inteiro); $i++) {
            for ($j = strlen($inteiro[$i]); $j > 0; $j--) {
                $z++;
                $i_valor = substr($inteiro[$i], strlen($inteiro[$i]) - $j, 1);
                if ($z > 1 && $z < 4 && $i_valor != 0 && $j == 1 && $inteiro[0] > 9) $rt .= " e ";
                if ($z > 3 && $i_valor != 0 && $j % 3 == 1 && $inteiro[0] > 9) $rt .= " e ";
                if ($i_valor != 0) {
                    if ($z % 3 == 1) $rt .= $u[$i_valor];
                    else if ($z % 3 == 2) {
                        if ($i_valor == 1 && $j < strlen($inteiro[$i])) {
                            $rt .= $d10[substr($inteiro[$i], strlen($inteiro[$i]) - $j + 1, 1)];
                            $z++; $j--;
                        } else $rt .= $d[$i_valor];
                    } else $rt .= $c[$i_valor];
                }
                if ($z % 3 == 0 && $z != 0 && $i_valor != 0) $rt .= " ";
                if ($j % 3 == 1 && $i_valor != 0) {
                    $k = (int) (($j - 1) / 3);
                    $rt .= " " . (($i_valor > 1) ? $plural[$k] : $singular[$k]);
                }
            }
        }
        if ($rt) $rt .= " ";
        if (count($inteiro) > 1 && $inteiro[1] > 0) $rt = trim($rt) . (($inteiro[0] > 0) ? " e " : "") . valorPorExtenso($inteiro[1]) . " " . (($inteiro[1] > 1) ? $plural[0] : $singular[0]);
        return trim($rt);
    }
}


// Função auxiliar para buscar detalhes (mantida da Fase 1)
function get_document_details($conn, $studentId, $courseId) {
    // ... (código da função get_document_details - sem alterações) ...
    $stmt = $conn->prepare("
        SELECT
            u.id as studentId, u.firstName, u.lastName, u.email, u.rg as aluno_rg, u.cpf as aluno_cpf, u.address as aluno_endereco, u.age,
            u.guardianName, u.guardianRG, u.guardianCPF, u.guardianEmail, u.guardianPhone,
            c.id as courseId, c.name as courseName, c.monthlyFee,
            s.name as schoolName, s.cnpj as schoolCnpj, s.address as schoolAddress, s.profilePicture, s.signatureImage,
            st.enrollmentContractText, st.imageTermsText, st.defaultDueDay
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.studentId AND e.courseId = :courseId_e -- Usar LEFT JOIN caso não haja matrícula ainda
        JOIN courses c ON c.id = :courseId_c
        JOIN system_settings st ON st.id = 1
        JOIN school_profile s ON s.id = 1
        WHERE u.id = :studentId
    ");
    $stmt->execute([
        ':studentId' => $studentId,
        ':courseId_e' => $courseId,
        ':courseId_c' => $courseId
    ]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}


// Função auxiliar para placeholders (mantida da Fase 1)
function get_placeholders($details) {
    // ... (código da função get_placeholders - sem alterações) ...
    if (!$details) return [];

    $isMinor = ($details['age'] !== null && $details['age'] < 18);
    $meses = array(1 => "Janeiro", 2 => "Fevereiro", 3 => "Março", 4 => "Abril", 5 => "Maio", 6 => "Junho", 7 => "Julho", 8 => "Agosto", 9 => "Setembro", 10 => "Outubro", 11 => "Novembro", 12 => "Dezembro");
    $data_atual_extenso = 'Guarulhos, ' . date('d') . ' de ' . $meses[(int)date('n')] . ' de ' . date('Y');

    $aluno_nome_completo = trim(($details['firstName'] ?? '') . ' ' . ($details['lastName'] ?? ''));
    $contratante_nome = $isMinor && !empty($details['guardianName']) ? $details['guardianName'] : $aluno_nome_completo;
    $contratante_rg = $isMinor && !empty($details['guardianRG']) ? $details['guardianRG'] : ($details['aluno_rg'] ?? '');
    $contratante_cpf = $isMinor && !empty($details['guardianCPF']) ? $details['guardianCPF'] : ($details['aluno_cpf'] ?? '');
    $contratante_email = $isMinor && !empty($details['guardianEmail']) ? $details['guardianEmail'] : ($details['email'] ?? '');
    $contratante_endereco = $details['aluno_endereco'] ?? ''; // Endereço do aluno é usado para ambos por simplicidade

    return [
        '{{aluno_nome}}' => $aluno_nome_completo,
        '{{aluno_email}}' => $details['email'] ?? '',
        '{{aluno_rg}}' => $details['aluno_rg'] ?? '',
        '{{aluno_cpf}}' => $details['aluno_cpf'] ?? '',
        '{{aluno_endereco}}' => $details['aluno_endereco'] ?? '',
        '{{responsavel_nome}}' => $details['guardianName'] ?? '',
        '{{responsavel_rg}}' => $details['guardianRG'] ?? '',
        '{{responsavel_cpf}}' => $details['guardianCPF'] ?? '',
        '{{responsavel_email}}' => $details['guardianEmail'] ?? '',
        '{{responsavel_telefone}}' => $details['guardianPhone'] ?? '',
        '{{contratante_nome}}' => $contratante_nome,
        '{{contratante_rg}}' => $contratante_rg,
        '{{contratante_cpf}}' => $contratante_cpf,
        '{{contratante_email}}' => $contratante_email,
        '{{contratante_endereco}}' => $contratante_endereco,
        '{{curso_nome}}' => $details['courseName'] ?? '',
        '{{curso_mensalidade}}' => number_format($details['monthlyFee'] ?? 0, 2, ',', '.'),
        '{{curso_mensalidade_extenso}}' => valorPorExtenso($details['monthlyFee'] ?? 0),
        '{{vencimento_dia}}' => $details['defaultDueDay'] ?? '',
        '{{escola_nome}}' => $details['schoolName'] ?? '',
        '{{escola_cnpj}}' => $details['schoolCnpj'] ?? '',
        '{{escola_endereco}}' => $details['schoolAddress'] ?? '',
        '{{data_atual_extenso}}' => $data_atual_extenso
    ];
}


// Função para API getEnrollmentDocuments (mantida da Fase 1)
function handle_get_enrollment_documents($conn, $data) {
    // ... (código da função handle_get_enrollment_documents - sem alterações) ...
    $studentId = isset($data['studentId']) ? (int)$data['studentId'] : 0;
    $courseId = isset($data['courseId']) ? (int)$data['courseId'] : 0;
    if ($studentId <= 0 || $courseId <= 0) { send_response(false, 'IDs de aluno e curso inválidos.', 400); }
    $details = get_document_details($conn, $studentId, $courseId);
    if (!$details) { send_response(false, "Não foi possível obter os detalhes para a matrícula.", 404); }
    $replacements = get_placeholders($details);
    $contractTextRaw = $details['enrollmentContractText'] ?? '';
    $termsTextRaw = $details['imageTermsText'] ?? '';
    $processedContractText = $contractTextRaw;
    $processedTermsText = $termsTextRaw;
    foreach ($replacements as $placeholder => $value) {
        $processedContractText = str_replace($placeholder, $value ?? '', $processedContractText);
        $processedTermsText = str_replace($placeholder, $value ?? '', $processedTermsText);
    }
    $studentData = [ 'age' => $details['age'], 'rg' => $details['aluno_rg'], 'cpf' => $details['aluno_cpf'] ];
    $guardianData = null;
    $isMinor = ($details['age'] !== null && $details['age'] < 18);
    if ($isMinor) {
        $guardianData = [ 'name' => $details['guardianName'], 'rg' => $details['guardianRG'], 'cpf' => $details['guardianCPF'], 'email' => $details['guardianEmail'], 'phone' => $details['guardianPhone'] ];
    }
    send_response(true, [ 'contractText' => $processedContractText, 'termsText' => $processedTermsText, 'studentData' => $studentData, 'guardianData' => $guardianData, 'isMinor' => $isMinor ]);
}


// --- GERAÇÃO DE PDF DO CONTRATO (REVISADA) ---
function handle_generate_contract_pdf($conn, $data) {
    error_reporting(0);
    ini_set('display_errors', 0);

    $studentId = isset($_GET['studentId']) ? (int)$_GET['studentId'] : 0;
    $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

    if ($studentId <= 0 || $courseId <= 0) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "IDs de aluno e curso inválidos.";
        exit;
    }

    $details = get_document_details($conn, $studentId, $courseId);

    if (!$details || empty($details['enrollmentContractText'])) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "Dados do aluno/curso ou modelo de contrato não encontrado.";
        exit;
    }

    $replacements = get_placeholders($details); // Gera placeholders com dados ATUAIS
    $documentText = $details['enrollmentContractText']; // Pega o modelo ATUAL
    foreach ($replacements as $placeholder => $value) {
        $documentText = str_replace($placeholder, $value ?? '', $documentText);
    }

    require_once 'fpdf/fpdf.php';

    try {
        $pdf = new FPDF('P', 'mm', 'A4');
        $pdf->AddPage();
        $pdf->SetFont('Arial', '', 10);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetMargins(20, 20, 20);
        $pdf->SetAutoPageBreak(true, 25); // Margem inferior maior

        // Logo (Opcional, alinhado à direita)
        $tmp_logo_path = null;
        if (!empty($details['profilePicture'])) {
            $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['profilePicture']));
            // Detecta o tipo de imagem (embora PNG seja esperado)
            $finfo = finfo_open();
            $mime_type = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE);
            finfo_close($finfo);
            $ext = '.png'; // Default
            if ($mime_type === 'image/jpeg') $ext = '.jpg';
            elseif ($mime_type === 'image/gif') $ext = '.gif';

            $tmp_logo_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . $ext;
            if (file_put_contents($tmp_logo_path, $img_data)) {
                $imageWidth = 30;
                $pageWidth = $pdf->GetPageWidth();
                $margin = 90;
                $imageX = $pageWidth - $margin - $imageWidth;
                $pdf->Image($tmp_logo_path, $imageX, 10, $imageWidth); // Posição Y=15
                $pdf->Ln(25); // Espaço abaixo do logo
            } else {
                 error_log("Falha ao salvar logo temporário: " . $tmp_logo_path);
                 $tmp_logo_path = null; // Garante que não tentará excluir se falhar
                 $pdf->Ln(15);
            }
        } else {
            $pdf->Ln(15);
        }

        // Título
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 10, to_iso('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS'), 0, 1, 'C');
        $pdf->Ln(10);
        $pdf->SetFont('Arial', '', 10);

        // Corpo do texto
        $pdf->MultiCell(0, 5, to_iso($documentText));
        $pdf->Ln(15);

        // Assinaturas
        $line_y = $pdf->GetY();
         // Verifica se há espaço suficiente, senão adiciona nova página
        if ($line_y > ($pdf->GetPageHeight() - 50)) { // 50mm para assinaturas + margem
            $pdf->AddPage();
            $line_y = $pdf->GetY(); // Pega o Y da nova página (topo - margem)
        }

        $pageWidth = $pdf->GetPageWidth();
        $margin = 20;
        $line_width = ($pageWidth - (2 * $margin) - 10) / 2;
        $line_start_contratante = $margin;
        $line_start_contratado = $margin + $line_width + 10;

        // Contratante
        $pdf->Line($line_start_contratante, $line_y, $line_start_contratante + $line_width, $line_y);
        $pdf->SetXY($line_start_contratante, $line_y + 1);
        $pdf->MultiCell($line_width, 4, to_iso("CONTRATANTE:\n" . ($replacements['{{contratante_nome}}'] ?? '') . "\nCPF: " . ($replacements['{{contratante_cpf}}'] ?? '')), 0, 'C');

        // Contratado e Carimbo
        $pdf->Line($line_start_contratado, $line_y, $line_start_contratado + $line_width, $line_y);
        $tmp_sig_path = null;
        if (!empty($details['signatureImage'])) {
            $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['signatureImage']));
            $finfo = finfo_open();
            $mime_type = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE);
            finfo_close($finfo);
            $ext = '.png'; // Default
            if ($mime_type === 'image/jpeg') $ext = '.jpg';
            elseif ($mime_type === 'image/gif') $ext = '.gif';

            $tmp_sig_path = sys_get_temp_dir() . '/sig_sge_' . uniqid() . $ext;
            if (file_put_contents($tmp_sig_path, $img_data)) {
                $sig_width = 40;
                $sig_height = 20;
                $sig_x = $line_start_contratado + ($line_width / 2) - ($sig_width / 2);
                $sig_y = $line_y - $sig_height + 2;
                $pdf->Image($tmp_sig_path, $sig_x, $sig_y, $sig_width, $sig_height);
                 // Ajusta Y do texto da escola para depois da linha
                 $pdf->SetXY($line_start_contratado, $line_y + 1);
            } else {
                 error_log("Falha ao salvar assinatura temporária: " . $tmp_sig_path);
                 $tmp_sig_path = null;
                 $pdf->SetXY($line_start_contratado, $line_y + 1); // Posição padrão
            }
        } else {
            $pdf->SetXY($line_start_contratado, $line_y + 1);
        }
        $pdf->MultiCell($line_width, 4, to_iso("CONTRATADO:\n" . ($replacements['{{escola_nome}}'] ?? '') . "\nCNPJ: " . ($replacements['{{escola_cnpj}}'] ?? '')), 0, 'C');

        // Limpeza dos arquivos temporários
        if ($tmp_logo_path && file_exists($tmp_logo_path)) unlink($tmp_logo_path);
        if ($tmp_sig_path && file_exists($tmp_sig_path)) unlink($tmp_sig_path);

        $pdf->Output('I', 'contrato_' . $studentId . '_' . $courseId .'.pdf'); // Nome mais específico
        exit;

    } catch (Exception $e) {
        // Limpa arquivos temporários mesmo em caso de erro
        if (isset($tmp_logo_path) && $tmp_logo_path && file_exists($tmp_logo_path)) unlink($tmp_logo_path);
        if (isset($tmp_sig_path) && $tmp_sig_path && file_exists($tmp_sig_path)) unlink($tmp_sig_path);
        error_log("Erro ao gerar PDF do contrato: " . $e->getMessage());
        header("Content-Type: text/plain; charset=utf-8");
        echo "Erro ao gerar o PDF do contrato.";
        exit;
    }
}

// --- GERAÇÃO DE PDF DO TERMO DE IMAGEM (REVISADA) ---
function handle_generate_image_terms_pdf($conn, $data) {
    error_reporting(0);
    ini_set('display_errors', 0);

    $studentId = isset($_GET['studentId']) ? (int)$_GET['studentId'] : 0;
    $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

     if ($studentId <= 0 || $courseId <= 0) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "IDs de aluno e curso inválidos.";
        exit;
    }

    $details = get_document_details($conn, $studentId, $courseId);

    if (!$details || empty($details['imageTermsText'])) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "Dados do aluno/curso ou modelo de termo não encontrado.";
        exit;
    }

    $replacements = get_placeholders($details);
    $documentText = $details['imageTermsText'];
    foreach ($replacements as $placeholder => $value) {
        $documentText = str_replace($placeholder, $value ?? '', $documentText);
    }

    require_once 'fpdf/fpdf.php';

    try {
        $pdf = new FPDF('P', 'mm', 'A4');
        $pdf->AddPage();
        $pdf->SetFont('Arial', '', 10);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetMargins(20, 20, 20);
        $pdf->SetAutoPageBreak(true, 25);

        // Logo (Opcional, alinhado à direita)
        $tmp_logo_path = null;
        if (!empty($details['profilePicture'])) {
            $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['profilePicture']));
            $finfo = finfo_open();
            $mime_type = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE);
            finfo_close($finfo);
            $ext = '.png';
            if ($mime_type === 'image/jpeg') $ext = '.jpg'; elseif ($mime_type === 'image/gif') $ext = '.gif';
            $tmp_logo_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . $ext;
             if (file_put_contents($tmp_logo_path, $img_data)) {
                 $imageWidth = 30;
                 $pageWidth = $pdf->GetPageWidth();
                 $margin = 90;
                 $imageX = $pageWidth - $margin - $imageWidth;
                 $pdf->Image($tmp_logo_path, $imageX, 10, $imageWidth);
                 $pdf->Ln(25);
             } else {
                  error_log("Falha ao salvar logo temporário: " . $tmp_logo_path);
                  $tmp_logo_path = null;
                  $pdf->Ln(15);
             }
        } else {
            $pdf->Ln(15);
        }


        // Título
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 10, to_iso('TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM'), 0, 1, 'C');
        $pdf->Ln(10);
        $pdf->SetFont('Arial', '', 10);

        // Corpo do texto
        $pdf->MultiCell(0, 5, to_iso($documentText));
        $pdf->Ln(15);

        // Assinatura (Centralizada)
        $line_y = $pdf->GetY();
         if ($line_y > ($pdf->GetPageHeight() - 40)) { // 40mm para assinatura + margem
            $pdf->AddPage();
            $line_y = $pdf->GetY();
        }

        $pageWidth = $pdf->GetPageWidth();
        $margin = 20;
        $line_width = ($pageWidth - (2 * $margin)) * 0.6; // 60% da largura útil
        $line_start = ($pageWidth - $line_width) / 2; // Centraliza

        $pdf->Line($line_start, $line_y, $line_start + $line_width, $line_y);
        $pdf->SetXY($line_start, $line_y + 1);
        $pdf->MultiCell($line_width, 4, to_iso(($replacements['{{contratante_nome}}'] ?? '') . "\nCPF/CNPJ: " . ($replacements['{{contratante_cpf}}'] ?? $replacements['{{contratante_cnpj}}'] ?? '')), 0, 'C'); // Mostra CPF ou CNPJ se houver

        // Limpeza
        if ($tmp_logo_path && file_exists($tmp_logo_path)) unlink($tmp_logo_path);

        $pdf->Output('I', 'termo_imagem_' . $studentId . '_' . $courseId .'.pdf');
        exit;

    } catch (Exception $e) {
        if (isset($tmp_logo_path) && $tmp_logo_path && file_exists($tmp_logo_path)) unlink($tmp_logo_path);
        error_log("Erro ao gerar PDF do termo de imagem: " . $e->getMessage());
        header("Content-Type: text/plain; charset=utf-8");
        echo "Erro ao gerar o PDF do termo de imagem.";
        exit;
    }
}


// Função handle_generate_receipt (mantida como está, pois já foi revisada)
function handle_generate_receipt($conn, $data) {
    // ... (código existente da função handle_generate_receipt) ...
    error_reporting(0);
    ini_set('display_errors', 0);
    $paymentId = isset($_GET['paymentId']) ? (int)$_GET['paymentId'] : 0;
    if ($paymentId <= 0) { header("Content-Type: text/plain; charset=utf-8"); echo "ID de pagamento inválido."; exit; }
    require_once 'fpdf/fpdf.php';
    $stmt = $conn->prepare("
        SELECT p.id as paymentId, p.amount, p.referenceDate, p.paymentDate, u.firstName, u.lastName, c.name as courseName, s.name as schoolName, s.cnpj, s.address, s.profilePicture, s.signatureImage
        FROM payments p JOIN users u ON p.studentId = u.id JOIN courses c ON p.courseId = c.id JOIN school_profile s ON s.id = 1
        WHERE p.id = ? AND p.status = 'Pago'");
    $stmt->execute([$paymentId]);
    $details = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$details) { header("Content-Type: text/plain; charset=utf-8"); echo "Recibo não encontrado ou pagamento não confirmado."; exit; }
    $pdf = new FPDF('P', 'mm', 'A4'); $pdf->AddPage(); $pdf->SetFont('Arial', '', 10); $pdf->SetTextColor(50, 50, 50); $pdf->SetMargins(15, 15, 15); $pdf->SetAutoPageBreak(true, 15);
    $tmp_files = [];
    if (!empty($details['profilePicture'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['profilePicture']));
        $finfo = finfo_open(); $mime_type = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE); finfo_close($finfo); $ext = '.png'; if ($mime_type === 'image/jpeg') $ext = '.jpg'; elseif ($mime_type === 'image/gif') $ext = '.gif';
        $tmp_img_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . $ext;
        if(file_put_contents($tmp_img_path, $img_data)){ $tmp_files[] = $tmp_img_path; $pdf->Image($tmp_img_path, 15, 10, 30); } else { $tmp_img_path = null; }
    }
    $pdf->SetFont('Arial', 'B', 14); $pdf->SetXY(45, 12); $pdf->Cell(0, 7, to_iso($details['schoolName']), 0, 1, 'C'); $pdf->SetFont('Arial', '', 9); $pdf->SetX(45); $pdf->Cell(0, 5, to_iso('CNPJ: ' . ($details['cnpj'] ?? 'Não informado')), 0, 1, 'C'); $pdf->SetX(45); $pdf->Cell(0, 5, to_iso($details['address'] ?? 'Endereço não informado'), 0, 1, 'C'); $pdf->Ln(15);
    $pdf->SetFont('Arial', 'B', 16); $pdf->Cell(0, 10, to_iso('RECIBO DE PAGAMENTO'), 0, 1, 'C'); $pdf->SetFont('Arial', '', 11); $pdf->Cell(0, 7, to_iso('Recibo Nº ' . str_pad($details['paymentId'], 5, '0', STR_PAD_LEFT)), 0, 1, 'C'); $pdf->Ln(15);
    $pdf->SetFont('Arial', '', 12); $fullName = trim(($details['firstName'] ?? '') . ' ' . ($details['lastName'] ?? '')); $valor_extenso = valorPorExtenso($details['amount'] ?? 0); $texto_recibo = "Recebemos de " . to_iso($fullName) . ", a quantia de R$ " . number_format($details['amount'] ?? 0, 2, ',', '.') . " (" . to_iso($valor_extenso) . "), referente ao pagamento descrito abaixo."; $pdf->MultiCell(0, 7, $texto_recibo); $pdf->Ln(10);
    $meses = array(1=>"Janeiro", 2=>"Fevereiro", 3=>"Março", 4=>"Abril", 5=>"Maio", 6=>"Junho", 7=>"Julho", 8=>"Agosto", 9=>"Setembro", 10=>"Outubro", 11=>"Novembro", 12=>"Dezembro");
    $pdf->SetFont('Arial', 'B', 11); $pdf->Cell(40, 8, 'Referente a:', 0, 0); $pdf->SetFont('Arial', '', 11); $pdf->Cell(0, 8, to_iso('Mensalidade do curso "' . ($details['courseName'] ?? 'N/A') . '"'), 0, 1);
    $pdf->SetFont('Arial', 'B', 11); $pdf->Cell(40, 8, to_iso('Mês de Referência:'), 0, 0); $pdf->SetFont('Arial', '', 11); $refDate = $details['referenceDate'] ? new DateTime($details['referenceDate']) : null; $pdf->Cell(0, 8, $refDate ? to_iso(ucfirst($meses[(int)$refDate->format('n')]) . ' de ' . $refDate->format('Y')) : 'N/A', 0, 1);
    $pdf->SetFont('Arial', 'B', 11); $pdf->Cell(40, 8, 'Data do Pagamento:', 0, 0); $pdf->SetFont('Arial', '', 11); $pdf->Cell(0, 8, $details['paymentDate'] ? date('d/m/Y', strtotime($details['paymentDate'])) : 'N/A', 0, 1); $pdf->Ln(25);
    $line_y = $pdf->GetY(); $pageWidth = $pdf->GetPageWidth(); $margin = 15; $line_width = ($pageWidth - (2 * $margin)) * 0.5; $line_start = ($pageWidth - $line_width) / 2;
    $pdf->Line($line_start, $line_y, $line_start + $line_width, $line_y);
    $tmp_sig_path = null;
    if (!empty($details['signatureImage'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['signatureImage']));
        $finfo = finfo_open(); $mime_type = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE); finfo_close($finfo); $ext = '.png'; if ($mime_type === 'image/jpeg') $ext = '.jpg'; elseif ($mime_type === 'image/gif') $ext = '.gif';
        $tmp_sig_path = sys_get_temp_dir() . '/sig_sge_' . uniqid() . $ext;
        if(file_put_contents($tmp_sig_path, $img_data)){ $tmp_files[] = $tmp_sig_path; $random_offset_x = (rand(0,100)/100)*4-2; $random_offset_y = (rand(0,100)/100)*4-2; $image_width = 40; $image_height = 20; $sig_x = $line_start + ($line_width / 2) - ($image_width / 2) + $random_offset_x; $sig_y = $line_y - $image_height + $random_offset_y; $pdf->Image($tmp_sig_path, $sig_x, $sig_y, $image_width, $image_height); $pdf->SetXY($line_start, $line_y + 1); }
        else { $tmp_sig_path = null; $pdf->SetXY($line_start, $line_y + 1); }
    } else { $pdf->SetXY($line_start, $line_y + 1); }
    $pdf->SetFont('Arial', '', 10); $pdf->MultiCell($line_width, 5, to_iso($details['schoolName'] ?? ''), 0, 'C');
    $pdf->Ln(10); $pdf->SetFont('Arial', '', 10); $data_emissao = date('d') . ' de ' . ($meses[(int)date('n')] ?? '') . ' de ' . date('Y'); $pdf->Cell(0, 7, to_iso("Guarulhos, " . $data_emissao . "."), 0, 1, 'C');
    foreach ($tmp_files as $file) { if (file_exists($file)) unlink($file); }
    $pdf->Output('I', 'recibo_' . $details['paymentId'] . '.pdf'); exit;
}


?>