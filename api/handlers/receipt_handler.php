<?php

// Função auxiliar para escrever o valor por extenso (movida para o início)
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
            if ($z > 1 && $z < 4 && $i_valor != 0 && $j == 1 && $inteiro[0] > 9)
                $rt .= " e ";
            if ($z > 3 && $i_valor != 0 && $j % 3 == 1 && $inteiro[0] > 9)
                $rt .= " e ";

            if ($i_valor != 0) {
                if ($z % 3 == 1)
                    $rt .= $u[$i_valor];
                else if ($z % 3 == 2) {
                    if ($i_valor == 1 && $j < strlen($inteiro[$i])) {
                        $rt .= $d10[substr($inteiro[$i], strlen($inteiro[$i]) - $j + 1, 1)];
                        $z++;
                        $j--;
                    } else
                        $rt .= $d[$i_valor];
                } else
                    $rt .= $c[$i_valor];
            }
            if ($z % 3 == 0 && $z != 0 && $i_valor != 0)
                $rt .= " ";

            if ($z % 3 == 1 && $i > 0 && $i < count($inteiro) - 1 && $j > 1 && $i_valor != 0)
                $rt .= " e ";
            if ($z > 3 && $z % 3 == 1 && $j > 1 && $i_valor != 0)
                $rt .= " e ";

            if ($j % 3 == 1 && $i_valor != 0) {
                $k = (int) (($j - 1) / 3);
                $rt .= " " . (($i_valor > 1) ? $plural[$k] : $singular[$k]);
            }
        }
    }
    if ($rt)
        $rt .= " ";
    if (count($inteiro) > 1 && $inteiro[1] > 0)
        $rt = trim($rt) . (($inteiro[0] > 0) ? " e " : "") . valorPorExtenso($inteiro[1]) . " " . (($inteiro[1] > 1) ? $plural[0] : $singular[0]);

    return trim($rt);
}


function handle_generate_receipt($conn, $data) {
    // Esconde avisos de "deprecated" para garantir que apenas o PDF seja enviado.
    error_reporting(0);
    ini_set('display_errors', 0);

    $paymentId = isset($_GET['paymentId']) ? (int)$_GET['paymentId'] : 0;

    if ($paymentId <= 0) {
        header("Content-Type: text/plain; charset=utf-8");
        echo "ID de pagamento inválido.";
        exit;
    }

    require_once 'fpdf/fpdf.php';

    // ATUALIZADO: Buscar signatureImage
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
    
    function to_iso($string) {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $string);
    }

    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->AddPage();
    $pdf->SetFont('Arial', '', 10);
    $pdf->SetTextColor(50, 50, 50);

    // --- LOGO (Se existir) ---
    $tmp_files = [];
    if (!empty($details['profilePicture'])) {
        $img_base64 = $details['profilePicture'];
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $img_base64));
        $tmp_img_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . '.png';
        file_put_contents($tmp_img_path, $img_data);
        $tmp_files[] = $tmp_img_path; // Registra o ficheiro temporário
        $pdf->Image($tmp_img_path, 10, 10, 30);
    }

    // --- CABEÇALHO ---
    $pdf->SetFont('Arial', 'B', 14);
    $pdf->Cell(0, 7, to_iso($details['schoolName']), 0, 1, 'C');
    $pdf->SetFont('Arial', '', 9);
    $pdf->Cell(0, 5, to_iso('CNPJ: ' . $details['cnpj']), 0, 1, 'C');
    $pdf->Cell(0, 5, to_iso($details['address']), 0, 1, 'C');
    $pdf->Ln(10);

    // --- TÍTULO DO RECIBO ---
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'RECIBO DE PAGAMENTO', 0, 1, 'C');
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 7, to_iso('Recibo Nº ' . str_pad($details['paymentId'], 5, '0', STR_PAD_LEFT)), 0, 1, 'C');
    $pdf->Ln(15);

    // --- CORPO DO RECIBO ---
    $pdf->SetFont('Arial', '', 12);
    $fullName = trim($details['firstName'] . ' ' . ($details['lastName'] ?? ''));
    $valor_extenso = valorPorExtenso($details['amount']);
    $texto_recibo = "Recebemos de " . to_iso($fullName) . ", a quantia de R$ " . number_format($details['amount'], 2, ',', '.') . " (" . to_iso($valor_extenso) . "), referente ao pagamento descrito abaixo.";
    $pdf->MultiCell(0, 7, $texto_recibo);
    $pdf->Ln(10);

    // Mapeamento manual de meses (para evitar dependência de Intl)
    $meses = array(1 => "Janeiro", 2 => "Fevereiro", 3 => "Março", 4 => "Abril", 5 => "Maio", 6 => "Junho", 7 => "Julho", 8 => "Agosto", 9 => "Setembro", 10 => "Outubro", 11 => "Novembro", 12 => "Dezembro");
    
    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(40, 8, 'Referente a:', 0, 0);
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 8, to_iso('Mensalidade do curso "' . $details['courseName'] . '"'), 0, 1);

    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(40, 8, to_iso('Mês de Referência:'), 0, 0);
    $pdf->SetFont('Arial', '', 11);
    $refDate = new DateTime($details['referenceDate']);
    $mes_ref = $meses[(int)$refDate->format('n')];
    $ano_ref = $refDate->format('Y');
    $pdf->Cell(0, 8, to_iso(ucfirst($mes_ref) . ' de ' . $ano_ref), 0, 1);

    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(40, 8, 'Data do Pagamento:', 0, 0);
    $pdf->SetFont('Arial', '', 11);
    $pdf->Cell(0, 8, date('d/m/Y', strtotime($details['paymentDate'])), 0, 1);
    $pdf->Ln(20);

    // --- ASSINATURA/CARIMBO (Implementação da Rotação e Posicionamento) ---
    
    // Posição da linha de assinatura (aproximadamente no centro horizontal do recibo)
    $line_y = $pdf->GetY() + 10;
    $center_x = 105;
    $line_width = 80;
    $line_start = $center_x - ($line_width / 2);
    
    // Desenha a linha de assinatura
    $pdf->Line($line_start, $line_y, $line_start + $line_width, $line_y);
    $pdf->SetY($line_y + 1);

    // Carimbo/Assinatura Digital
    if (!empty($details['signatureImage'])) {
        $img_base64 = $details['signatureImage'];
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $img_base64));
        $tmp_sig_path = sys_get_temp_dir() . '/sig_sge_' . uniqid() . '.png';
        file_put_contents($tmp_sig_path, $img_data);
        $tmp_files[] = $tmp_sig_path;

        // Efeito "Não Estático": Varia a posição X e Y
        $random_offset_x = (rand(0, 100) / 100) * 4; // Variação de 0 a 4mm
        $random_offset_y = (rand(0, 100) / 100) * 4; // Variação de 0 a 4mm
        $image_width = 40; // Largura fixa
        $image_height = 20; // Altura fixa
        
        // Posição para o carimbo: centralizado na linha com variação
        $sig_x = $center_x - ($image_width / 2) + $random_offset_x - 2;
        $sig_y = $line_y - $image_height + $random_offset_y - 2;
        
        $pdf->Image($tmp_sig_path, $sig_x, $sig_y, $image_width, $image_height);
    }
    
    $pdf->Ln(15);
    $pdf->SetFont('Arial', '', 10);
    $pdf->Cell(0, 7, to_iso($details['schoolName']), 0, 1, 'C');

    // --- RODAPÉ ---
    $pdf->Ln(5);
    $pdf->SetFont('Arial', '', 10);
    $dia_emissao = date('d');
    $mes_emissao = $meses[(int)date('n')];
    $ano_emissao = date('Y');
    $data_emissao = $dia_emissao . ' de ' . $mes_emissao . ' de ' . $ano_emissao;
    $pdf->Cell(0, 7, to_iso("Guarulhos, " . $data_emissao . "."), 0, 1, 'C');
    

    // Limpeza de ficheiros temporários
    foreach ($tmp_files as $file) {
        if (file_exists($file)) {
            unlink($file);
        }
    }

    $pdf->Output('I', 'recibo_' . $details['paymentId'] . '.pdf');
    exit;
}
?>