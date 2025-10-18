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

function get_document_details($conn, $studentId, $courseId) {
    $stmt = $conn->prepare("
        SELECT 
            u.firstName, u.lastName, u.email, u.rg as aluno_rg, u.cpf as aluno_cpf, u.address as aluno_endereco, u.age,
            u.guardianName, u.guardianRG, u.guardianCPF, u.guardianEmail, u.guardianPhone,
            c.name as courseName, c.monthlyFee,
            s.name as schoolName, s.cnpj as schoolCnpj, s.address as schoolAddress, s.profilePicture, s.signatureImage,
            st.enrollmentContractText, st.imageTermsText, st.defaultDueDay
        FROM users u
        JOIN enrollments e ON u.id = e.studentId
        JOIN courses c ON e.courseId = c.id
        JOIN system_settings st ON st.id = 1
        JOIN school_profile s ON s.id = 1
        WHERE u.id = ? AND c.id = ?
    ");
    $stmt->execute([$studentId, $courseId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function get_placeholders($details) {
    $isMinor = ($details['age'] !== null && $details['age'] < 18);
    
    $meses = array(1 => "Janeiro", 2 => "Fevereiro", 3 => "Março", 4 => "Abril", 5 => "Maio", 6 => "Junho", 7 => "Julho", 8 => "Agosto", 9 => "Setembro", 10 => "Outubro", 11 => "Novembro", 12 => "Dezembro");
    $data_atual_extenso = 'Guarulhos, ' . date('d') . ' de ' . $meses[(int)date('n')] . ' de ' . date('Y');

    return [
        '{{aluno_nome}}' => trim($details['firstName'] . ' ' . $details['lastName']),
        '{{aluno_email}}' => $details['email'],
        '{{aluno_rg}}' => $details['aluno_rg'],
        '{{aluno_cpf}}' => $details['aluno_cpf'],
        '{{aluno_endereco}}' => $details['aluno_endereco'],
        
        '{{responsavel_nome}}' => $details['guardianName'],
        '{{responsavel_rg}}' => $details['guardianRG'],
        '{{responsavel_cpf}}' => $details['guardianCPF'],
        '{{responsavel_email}}' => $details['guardianEmail'],
        '{{responsavel_telefone}}' => $details['guardianPhone'],

        '{{contratante_nome}}' => $isMinor && !empty($details['guardianName']) ? $details['guardianName'] : trim($details['firstName'] . ' ' . $details['lastName']),
        '{{contratante_rg}}' => $isMinor && !empty($details['guardianRG']) ? $details['guardianRG'] : $details['aluno_rg'],
        '{{contratante_cpf}}' => $isMinor && !empty($details['guardianCPF']) ? $details['guardianCPF'] : $details['aluno_cpf'],
        '{{contratante_email}}' => $isMinor && !empty($details['guardianEmail']) ? $details['guardianEmail'] : $details['email'],
        '{{contratante_endereco}}' => $isMinor ? "" : $details['aluno_endereco'], 

        '{{curso_nome}}' => $details['courseName'],
        '{{curso_mensalidade}}' => number_format($details['monthlyFee'], 2, ',', '.'),
        '{{curso_mensalidade_extenso}}' => valorPorExtenso($details['monthlyFee']),
        '{{vencimento_dia}}' => $details['defaultDueDay'],

        '{{escola_nome}}' => $details['schoolName'],
        '{{escola_cnpj}}' => $details['schoolCnpj'],
        '{{escola_endereco}}' => $details['schoolAddress'],
        
        '{{data_atual_extenso}}' => $data_atual_extenso
    ];
}


function handle_generate_contract_pdf($conn, $data) {
    error_reporting(0);
    ini_set('display_errors', 0);

    $studentId = isset($_GET['studentId']) ? (int)$_GET['studentId'] : 0;
    $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

    $details = get_document_details($conn, $studentId, $courseId);

    if (!$details || empty($details['enrollmentContractText'])) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "Matrícula ou modelo de contrato não encontrado.";
        exit;
    }

    $replacements = get_placeholders($details);
    $documentText = $details['enrollmentContractText'];
    foreach ($replacements as $placeholder => $value) {
        $documentText = str_replace($placeholder, $value ?? '', $documentText);
    }
    
    require_once 'fpdf/fpdf.php';
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->AddPage();
    $pdf->SetFont('Arial', '', 10);
    $pdf->SetTextColor(0, 0, 0);

    if (!empty($details['profilePicture'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['profilePicture']));
        $tmp_img_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . '.png';
        file_put_contents($tmp_img_path, $img_data);
        $pdf->Image($tmp_img_path, 10, 10, 30);
        unlink($tmp_img_path);
        $pdf->Ln(25);
    } else {
        $pdf->Ln(10);
    }

    $pdf->MultiCell(0, 5, to_iso($documentText));

    // CORREÇÃO: Adiciona o carimbo/assinatura APENAS no contrato e na posição correta
    if (!empty($details['signatureImage'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['signatureImage']));
        $tmp_sig_path = sys_get_temp_dir() . '/sig_sge_' . uniqid() . '.png';
        file_put_contents($tmp_sig_path, $img_data);

        // Posição vertical fixa para a linha de assinatura do CONTRATADO
        $line_y = 250; // Ajuste este valor se necessário para subir ou descer a assinatura
        
        $random_offset_x = (rand(-50, 20) / 10.0); // Variação de -2mm a +2mm
        $signature_x_position = (210 / 2) + $random_offset_x - 80; // Posição X da assinatura da escola (direita)
        

        // Posiciona a imagem acima da linha
        $pdf->Image($tmp_sig_path, $signature_x_position, $line_y - 20, 40, 20); // X, Y, Largura, Altura

        unlink($tmp_sig_path);
    }

    $pdf->Output('I', 'contrato_' . $studentId . '.pdf');
    exit;
}

function handle_generate_image_terms_pdf($conn, $data) {
    error_reporting(0);
    ini_set('display_errors', 0);

    $studentId = isset($_GET['studentId']) ? (int)$_GET['studentId'] : 0;
    $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

    $details = get_document_details($conn, $studentId, $courseId);

    if (!$details || empty($details['imageTermsText'])) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "Matrícula ou modelo do termo de imagem não encontrado.";
        exit;
    }

    $replacements = get_placeholders($details);
    $documentText = $details['imageTermsText'];
    foreach ($replacements as $placeholder => $value) {
        $documentText = str_replace($placeholder, $value ?? '', $documentText);
    }
    
    require_once 'fpdf/fpdf.php';
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->AddPage();
    $pdf->SetFont('Arial', '', 10);
    $pdf->SetTextColor(0, 0, 0);

    if (!empty($details['profilePicture'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['profilePicture']));
        $tmp_img_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . '.png';
        file_put_contents($tmp_img_path, $img_data);
        $pdf->Image($tmp_img_path, 10, 10, 30);
        unlink($tmp_img_path);
        $pdf->Ln(25);
    } else {
        $pdf->Ln(10);
    }

    $pdf->MultiCell(0, 5, to_iso($documentText));

    // Nenhum carimbo/assinatura é adicionado aqui.

    $pdf->Output('I', 'termo_imagem_' . $studentId . '.pdf');
    exit;
}

function handle_generate_receipt($conn, $data) {
    error_reporting(0);
    ini_set('display_errors', 0);

    $paymentId = isset($_GET['paymentId']) ? (int)$_GET['paymentId'] : 0;

    if ($paymentId <= 0) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "ID de pagamento inválido.";
        exit;
    }

    require_once 'fpdf/fpdf.php';

    $stmt = $conn->prepare("
        SELECT 
            p.id as paymentId, p.amount, p.referenceDate, p.paymentDate,
            u.firstName, u.lastName,
            c.name as courseName,
            s.name as schoolName, s.cnpj, s.address, s.profilePicture, s.signatureImage
        FROM payments p
        JOIN users u ON p.studentId = u.id
        JOIN courses c ON p.courseId = c.id
        JOIN school_profile s ON s.id = 1
        WHERE p.id = ? AND p.status = 'Pago'
    ");
    $stmt->execute([$paymentId]);
    $details = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$details) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "Recibo não encontrado ou pagamento não confirmado.";
        exit;
    }
    
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->AddPage();
    $pdf->SetFont('Arial', '', 10);
    $pdf->SetTextColor(50, 50, 50);

    $tmp_files = [];
    if (!empty($details['profilePicture'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['profilePicture']));
        $tmp_img_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . '.png';
        file_put_contents($tmp_img_path, $img_data);
        $tmp_files[] = $tmp_img_path;
        $pdf->Image($tmp_img_path, 10, 10, 30);
    }

    $pdf->SetFont('Arial', 'B', 14);
    $pdf->Cell(0, 7, to_iso($details['schoolName']), 0, 1, 'C');
    $pdf->SetFont('Arial', '', 9);
    $pdf->Cell(0, 5, to_iso('CNPJ: ' . $details['cnpj']), 0, 1, 'C');
    $pdf->Cell(0, 5, to_iso($details['address']), 0, 1, 'C');
    $pdf->Ln(10);

    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'RECIBO DE PAGAMENTO', 0, 1, 'C');
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 7, to_iso('Recibo Nº ' . str_pad($details['paymentId'], 5, '0', STR_PAD_LEFT)), 0, 1, 'C');
    $pdf->Ln(15);

    $pdf->SetFont('Arial', '', 12);
    $fullName = trim($details['firstName'] . ' ' . ($details['lastName'] ?? ''));
    $valor_extenso = valorPorExtenso($details['amount']);
    $texto_recibo = "Recebemos de " . to_iso($fullName) . ", a quantia de R$ " . number_format($details['amount'], 2, ',', '.') . " (" . to_iso($valor_extenso) . "), referente ao pagamento descrito abaixo.";
    $pdf->MultiCell(0, 7, $texto_recibo);
    $pdf->Ln(10);

    $meses = array(1 => "Janeiro", 2 => "Fevereiro", 3 => "Março", 4 => "Abril", 5 => "Maio", 6 => "Junho", 7 => "Julho", 8 => "Agosto", 9 => "Setembro", 10 => "Outubro", 11 => "Novembro", 12 => "Dezembro");
    
    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(40, 8, 'Referente a:', 0, 0);
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 8, to_iso('Mensalidade do curso "' . $details['courseName'] . '"'), 0, 1);

    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(40, 8, to_iso('Mês de Referência:'), 0, 0);
    $pdf->SetFont('Arial', '', 11);
    $refDate = new DateTime($details['referenceDate']);
    $pdf->Cell(0, 8, to_iso(ucfirst($meses[(int)$refDate->format('n')]) . ' de ' . $refDate->format('Y')), 0, 1);

    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(40, 8, 'Data do Pagamento:', 0, 0);
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 8, date('d/m/Y', strtotime($details['paymentDate'])), 0, 1);
    $pdf->Ln(20);

    $line_y = $pdf->GetY() + 10;
    $center_x = 105;
    $line_width = 80;
    $line_start = $center_x - ($line_width / 2);
    
    $pdf->Line($line_start, $line_y, $line_start + $line_width, $line_y);
    $pdf->SetY($line_y + 1);

    if (!empty($details['signatureImage'])) {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $details['signatureImage']));
        $tmp_sig_path = sys_get_temp_dir() . '/sig_sge_' . uniqid() . '.png';
        file_put_contents($tmp_sig_path, $img_data);
        $tmp_files[] = $tmp_sig_path;

        $random_offset_x = (rand(0, 100) / 100) * 4 - 2; 
        $random_offset_y = (rand(0, 100) / 100) * 4 - 2; 
        $image_width = 40; 
        $image_height = 20; 
        
        $sig_x = $center_x - ($image_width / 2) + $random_offset_x;
        $sig_y = $line_y - $image_height + $random_offset_y;
        
        $pdf->Image($tmp_sig_path, $sig_x, $sig_y, $image_width, $image_height);
    }
    
    $pdf->Ln(15);
    $pdf->SetFont('Arial', '', 10);
    $pdf->Cell(0, 7, to_iso($details['schoolName']), 0, 1, 'C');

    $pdf->Ln(5);
    $pdf->SetFont('Arial', '', 10);
    $data_emissao = date('d') . ' de ' . $meses[(int)date('n')] . ' de ' . date('Y');
    $pdf->Cell(0, 7, to_iso("Guarulhos, " . $data_emissao . "."), 0, 1, 'C');
    
    foreach ($tmp_files as $file) {
        if (file_exists($file)) unlink($file);
    }

    $pdf->Output('I', 'recibo_' . $details['paymentId'] . '.pdf');
    exit;
}
?>