<?php
// api/handlers/document_data_helper.php

require_once __DIR__ . '/pdf_helpers.php'; // Para valorPorExtenso

/**
 * Busca dados para contratos/termos.
 */
function get_document_details(PDO $conn, $studentId, $courseId) {
    error_log("Buscando detalhes do documento para S:$studentId, C:$courseId");
    
    // --- INÍCIO MODIFICAÇÃO 1: Adiciona s.schoolCity e s.state ao SELECT ---
    $sql = " SELECT 
                u.id as studentId, u.firstName, u.lastName, u.email, u.rg as aluno_rg, 
                u.cpf as aluno_cpf, u.address as aluno_endereco, u.age, 
                u.guardianName, u.guardianRG, u.guardianCPF, u.guardianEmail, u.guardianPhone, 
                c.id as courseId, c.name as courseName, c.monthlyFee, 
                s.name as schoolName, s.cnpj as schoolCnpj, s.address as schoolAddress, 
                s.profilePicture, s.signatureImage, s.schoolCity, s.state, -- <<< ADICIONADO AQUI
                st.enrollmentContractText, st.imageTermsText, st.defaultDueDay, 
                e.contractAcceptedAt, e.termsAcceptedAt 
             FROM users u 
             LEFT JOIN enrollments e ON u.id = e.studentId AND e.courseId = :courseId_e 
             JOIN courses c ON c.id = :courseId_c 
             JOIN system_settings st ON st.id = 1 
             JOIN school_profile s ON s.id = 1 
             WHERE u.id = :studentId 
             LIMIT 1 ";
    // --- FIM MODIFICAÇÃO 1 ---

    try {
        $stmt = $conn->prepare($sql);
        $courseIdParam = filter_var($courseId, FILTER_VALIDATE_INT) ? $courseId : null;
        if ($courseIdParam === null) throw new Exception("ID do curso inválido na query.");
        $stmt->execute([':studentId' => $studentId, ':courseId_e' => $courseId, ':courseId_c' => $courseIdParam]);
        $details = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$details) error_log("Detalhes não encontrados para S:$studentId, C:$courseId.");
        return $details;
    } catch (PDOException $e) { error_log("!!! PDO Error em get_document_details (S:$studentId, C:$courseId): " . $e->getMessage()); return false;
    } catch (Exception $e) { error_log("!!! Error em get_document_details (S:$studentId, C:$courseId): " . $e->getMessage()); return false; }
}

/**
 * Monta array de placeholders.
 */
function get_placeholders($details) {
    if (!$details) return [];
    $isMinor = ($details['age'] !== null && (int)$details['age'] < 18);
    $meses = [1=>"Janeiro",2=>"Fevereiro",3=>"Março",4=>"Abril",5=>"Maio",6=>"Junho",7=>"Julho",8=>"Agosto",9=>"Setembro",10=>"Outubro",11=>"Novembro",12=>"Dezembro"];
    
    // --- INÍCIO MODIFICAÇÃO 2: Usa schoolCity para a data por extenso ---
    $schoolCity = $details['schoolCity'] ?? 'Guarulhos'; // Usa 'Guarulhos' como fallback
    $data_atual_extenso = $schoolCity . ', ' . date('d') . ' de ' . $meses[(int)date('n')] . ' de ' . date('Y');
    // --- FIM MODIFICAÇÃO 2 ---

    $aluno_nome = trim(($details['firstName'] ?? '') . ' ' . ($details['lastName'] ?? ''));
    $contr_nome = $isMinor && !empty($details['guardianName']) ? $details['guardianName'] : $aluno_nome;
    $contr_rg = $isMinor && !empty($details['guardianRG']) ? $details['guardianRG'] : ($details['aluno_rg'] ?? '');
    $contr_cpf = $isMinor && !empty($details['guardianCPF']) ? $details['guardianCPF'] : ($details['aluno_cpf'] ?? '');
    $contr_email = $isMinor && !empty($details['guardianEmail']) ? $details['guardianEmail'] : ($details['email'] ?? '');
    $contr_end = $details['aluno_endereco'] ?? '';

    // --- INÍCIO MODIFICAÇÃO 3: Adiciona novos placeholders ---
    return [
        '{{aluno_nome}}' => $aluno_nome,'{{aluno_email}}' => $details['email'] ?? '','{{aluno_rg}}' => $details['aluno_rg'] ?? '','{{aluno_cpf}}' => $details['aluno_cpf'] ?? '','{{aluno_endereco}}' => $details['aluno_endereco'] ?? '',
        '{{responsavel_nome}}' => $details['guardianName'] ?? '','{{responsavel_rg}}' => $details['guardianRG'] ?? '','{{responsavel_cpf}}' => $details['guardianCPF'] ?? '','{{responsavel_email}}' => $details['guardianEmail'] ?? '','{{responsavel_telefone}}' => $details['guardianPhone'] ?? '',
        '{{contratante_nome}}' => $contr_nome,'{{contratante_rg}}' => $contr_rg,'{{contratante_cpf}}' => $contr_cpf,'{{contratante_email}}' => $contr_email,'{{contratante_endereco}}' => $contr_end,
        '{{curso_nome}}' => $details['courseName'] ?? '','{{curso_mensalidade}}' => number_format($details['monthlyFee'] ?? 0, 2, ',', '.'),'{{curso_mensalidade_extenso}}' => valorPorExtenso($details['monthlyFee'] ?? 0),
        '{{vencimento_dia}}' => $details['defaultDueDay'] ?? '10','{{escola_nome}}' => $details['schoolName'] ?? '','{{escola_cnpj}}' => $details['schoolCnpj'] ?? '','{{escola_endereco}}' => $details['schoolAddress'] ?? '',
        '{{cidade_escola}}' => $details['schoolCity'] ?? '', // <<< NOVO PLACEHOLDER
        '{{estado_escola}}' => $details['state'] ?? '',       // <<< NOVO PLACEHOLDER
        '{{data_atual_extenso}}' => $data_atual_extenso
    ];
    // --- FIM MODIFICAÇÃO 3 ---
}
?>