<?php
// api/handlers/image_term_handler.php

require_once __DIR__ . '/../fpdf/fpdf.php';
require_once __DIR__ . '/pdf_helpers.php';       // Para to_iso, add_centered_logo
require_once __DIR__ . '/document_data_helper.php'; // Para get_document_details, get_placeholders

/**
 * Gera PDF do Termo de Imagem
 */
function handle_generate_image_terms_pdf($conn, $data) {
    error_reporting(0); ini_set('display_errors', 0);
    $studentId = isset($_GET['studentId']) ? (int)$_GET['studentId'] : 0;
    $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;
    if ($studentId <= 0 || $courseId <= 0) { /* ... erro 400 ... */ }

    $tmp_files = [];
    try {
        $details = get_document_details($conn, $studentId, $courseId);
        if (!$details || empty($details['imageTermsText'])) { /* ... erro 404 ... */ }
        $replacements = get_placeholders($details);
        $documentText = $details['imageTermsText'];
        foreach ($replacements as $ph => $val) { $documentText = str_replace($ph, $val ?? '', $documentText); }

        $pdf = new FPDF('P', 'mm', 'A4'); // FPDF Padrão
        $pdf->AddPage();
        $pdf->SetMargins(20, 20, 20); $pdf->SetAutoPageBreak(true, 25);

        // ADICIONA LOGO CENTRALIZADO
        $posY_after_logo = add_centered_logo($pdf, $details['profilePicture'] ?? null, $tmp_files);
        $pdf->SetY($posY_after_logo);
        $pdf->Ln(10); 

        $pdf->SetFont('Arial', 'B', 14); $pdf->Cell(0, 10, to_iso('TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM'), 0, 1, 'C'); $pdf->Ln(10); $pdf->SetFont('Arial', '', 10); $pdf->SetTextColor(0,0,0);
        $pdf->MultiCell(0, 5, to_iso($documentText)); $pdf->Ln(15);

        // Assinatura
        $line_y = $pdf->GetY(); if ($line_y > ($pdf->GetPageHeight() - 40)) { $pdf->AddPage(); $line_y = $pdf->GetY(); } $pageWidth = $pdf->GetPageWidth(); $margin = 20; $line_width = ($pageWidth - (2 * $margin)) * 0.6; $line_start = ($pageWidth - $line_width) / 2;
        $pdf->Line($line_start, $line_y, $line_start + $line_width, $line_y); $pdf->SetXY($line_start, $line_y + 1); $pdf->MultiCell($line_width, 4, to_iso(($replacements['{{contratante_nome}}'] ?? '') . "\nCPF: " . ($replacements['{{contratante_cpf}}'] ?? '')), 0, 'C');

        foreach ($tmp_files as $file) { if (file_exists($file)) @unlink($file); }

        header('Content-Type: application/pdf');
        $pdf->Output('I', 'termo_imagem_' . $studentId . '_' . $courseId .'.pdf');
        exit;

    } catch (Exception $e) {
        foreach ($tmp_files as $file) { if (file_exists($file)) @unlink($file); }
        error_log("!!! Erro FATAL PDF termo S:$studentId, C:$courseId: ".$e->getMessage() . " em " . $e->getFile() . ":" . $e->getLine());
        header("HTTP/1.1 500 Internal Server Error"); header("Content-Type: text/plain; charset=utf-8"); echo "Erro interno ao gerar PDF."; exit;
    }
}
?>