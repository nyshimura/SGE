<?php
function handle_generate_ai_description($conn, $data) {
    $courseName = isset($data['courseName']) ? trim($data['courseName']) : '';

    if (empty($courseName)) {
        send_response(false, 'O nome do curso é obrigatório.', 400);
    }

    // 1. Obter a API Key e o Endpoint do banco de dados
    $settings = $conn->query("SELECT geminiApiKey, geminiApiEndpoint FROM system_settings WHERE id = 1")->fetch();
    $apiKey = $settings['geminiApiKey'] ?? null;
    $apiEndpoint = $settings['geminiApiEndpoint'] ?? null;

    if (empty($apiKey) || empty($apiEndpoint)) {
        send_response(false, 'A chave ou o endpoint da API do Gemini não estão configurados no sistema.', 500);
    }

    // 2. Preparar a requisição usando a URL do banco de dados
    $url = $apiEndpoint . '?key=' . $apiKey;
    
    $prompt = "Crie uma descrição concisa e atrativa para um curso chamado \"{$courseName}\". A descrição deve ter no máximo 3 frases e destacar os principais benefícios ou o público-alvo.";

    $postData = json_encode([
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ]
    ]);

    // 3. Executar a chamada segura do servidor para o Google (usando cURL)
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        send_response(false, 'Falha na comunicação com a API de IA: ' . $curl_error, 500);
    }

    $responseData = json_decode($response, true);

    if ($http_code != 200 || isset($responseData['error'])) {
        $errorMessage = $responseData['error']['message'] ?? 'Erro desconhecido da API de IA.';
        send_response(false, 'Erro da API de IA: ' . $errorMessage, $http_code);
    }
    
    $text = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Não foi possível gerar a descrição.';

    send_response(true, ['description' => trim($text)]);
}
?>