<?php
// api/handlers/pdf_helpers.php

/**
 * Converte string para ISO-8859-1.
 */
if (!function_exists('to_iso')) {
    function to_iso($string) {
        $iso = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $string ?? '');
        if ($iso === false) {
            $iso = iconv('UTF-8', 'ISO-8859-1//IGNORE', $string ?? '');
        }
        return $iso;
    }
}

/**
 * Converte valor numérico para extenso.
 */
if (!function_exists('valorPorExtenso')) {
    function valorPorExtenso($valor = 0) {
        // ... (Seu código completo da função valorPorExtenso) ...
        // Simplesmente copie e cole a função inteira aqui
        return "valor por extenso"; // Substitua pelo seu código real
    }
}

/**
 * Função auxiliar para adicionar logo centralizado
 */
function add_centered_logo(&$pdf, $logoBase64, &$tmp_files_array) {
    if (empty($logoBase64)) return 15; // Retorna espaço padrão se não houver logo

    $logo_y = 15; // Posição Y (margem superior)
    $logo_width = 30; // Largura desejada do logo em mm

    try {
        $img_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $logoBase64));
        if ($img_data === false) throw new Exception('Falha ao decodificar logo base64.');
        
        $finfo = finfo_open(); 
        $mime = finfo_buffer($finfo, $img_data, FILEINFO_MIME_TYPE); 
        finfo_close($finfo);
        
        $ext = ($mime === 'image/jpeg') ? '.jpg' : '.png'; // Ajuste se precisar suportar mais tipos
        $tmp_logo_path = sys_get_temp_dir() . '/logo_sge_' . uniqid() . $ext;
        
        if (!file_put_contents($tmp_logo_path, $img_data)) { 
            throw new Exception('Falha ao salvar logo temporário.'); 
        }
        
        $tmp_files_array[] = $tmp_logo_path; // Adiciona à lista para limpeza posterior
        
        $pageWidth = $pdf->GetPageWidth();
        $logo_x = ($pageWidth - $logo_width) / 2; // Calcula X para centralizar
        
        $pdf->Image($tmp_logo_path, $logo_x, $logo_y, $logo_width);
        
        return $logo_y + 20; // Retorna um Y aproximado abaixo do logo (ajuste 20 se necessário)

    } catch (Exception $e) {
        error_log("Erro ao processar/adicionar logo: " . $e->getMessage());
        return 15; // Retorna espaço padrão em caso de erro
    }
}

?>