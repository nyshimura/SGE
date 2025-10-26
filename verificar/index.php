<?php
$hash_param = isset($_GET['hash']) ? htmlspecialchars($_GET['hash']) : '';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Certificado SGE</title>
    <link rel="stylesheet" href="../index.css">
    <style>
        /* Estilos MÍNIMOS para layout e caixas de status, usando variáveis do index.css */
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: var(--background-color, #f4f7f6); /* Usa variável ou fallback */
            padding: 20px; /* Adiciona padding geral */
            box-sizing: border-box; /* Garante padding correto */
        }
        .verify-container {
             /* Herdará estilos de .container e .card */
            max-width: 700px;
            width: 100%; /* Ocupa largura disponível até max-width */
            text-align: center;
        }
        .verify-form {
            margin-bottom: 30px;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .verify-form label {
             white-space: nowrap;
             margin-right: 5px;
             font-weight: 500;
        }
        .verify-form input[type="text"] {
            flex-grow: 1; /* Ocupa espaço */
        }

        /* Caixas de status usando variáveis CSS */
        .status-box {
            margin-top: 20px;
            padding: 15px 20px; /* Reduzido padding vertical */
            border-radius: 5px; /* Usa border-radius padrão de cards/inputs */
            border: 1px solid;
            text-align: left;
            font-size: 1.05em; /* Tamanho um pouco maior */
        }
        .status-box p { margin: 8px 0; } /* Espaçamento entre parágrafos */
        .status-box strong { display: inline-block; min-width: 160px; color: var(--text-color, #333); } /* Usa cor de texto padrão */
        .initial { background-color: var(--subtle-bg, #f8f9fa); border-color: var(--border-color, #e0e0e0); color: var(--secondary-color, #6c757d); }
        .loading { background-color: #eaf2f8; border-color: #aed6f1; color: #1b4f72; } /* Cores podem ser ajustadas ou vir de variáveis se existirem */
        .error { background-color: var(--status-absent-bg, #fef2f2); border-color: var(--danger-color, #dc3545); color: var(--danger-color, #dc3545); } /* Usa variáveis danger */
        .success { background-color: var(--status-approved-bg, #f0fdf4); border-color: #a9dfbf; color: var(--status-approved-text, #166534); } /* Usa variáveis success/approved */
        .success h2 { margin-top: 0; color: var(--status-approved-text, #166534); font-size: 1.4em; text-align: center; margin-bottom: 20px; }

        .footer-link {
            margin-top: 30px;
            font-size: 0.9em;
        }
        /* Estilo do link virá do index.css */

        /* Responsividade */
        @media (max-width: 600px) {
            .verify-form { flex-direction: column; align-items: stretch; }
            .verify-form label { margin-bottom: 5px; text-align: left; }
            .verify-form button { margin-left: 0; margin-top: 10px; width: 100%;}
            .status-box strong { min-width: auto; display: block; margin-bottom: 3px;} /* Ajusta strong em telas pequenas */
            .status-box p { font-size: 1em; }
        }
    </style>
</head>
<body>
    <div class="container card verify-container">
        <h1>Verificação de Autenticidade</h1>

        <form id="verify-form" class="verify-form">
            <label for="hash-input">Código:</label>
            <input type="text" id="hash-input" name="hash" class="form-input" placeholder="Cole o código de verificação aqui" required pattern="[a-fA-F0-9]{64}" title="O código deve ter 64 caracteres hexadecimais." value="<?php echo $hash_param; ?>">
            <button type="submit" class="action-button primary">Verificar</button>
        </form>

        <div id="result">
            <p class="status-box initial">Insira o código de verificação acima ou acesse através do link/QR Code do certificado.</p>
        </div>

        
    </div>

    <script>
        // (JavaScript permanece o mesmo)
        const resultDiv = document.getElementById('result');
        const form = document.getElementById('verify-form');
        const hashInput = document.getElementById('hash-input');

        async function verifyHash(hash) {
            if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
                resultDiv.innerHTML = '<p class="status-box error">Erro: Código de verificação inválido ou não fornecido.</p>';
                return;
            }
            resultDiv.innerHTML = '<p class="status-box loading">Verificando...</p>';
            const apiUrl = `../api/index.php?action=verifyCertificate&hash=${encodeURIComponent(hash)}`;
            try {
                const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
                if (!response.ok) { throw new Error(`Erro ${response.status}: ${response.statusText}`); }
                const data = await response.json();
                if (data.success && data.data && data.data.certificate) {
                    const cert = data.data.certificate;
                    resultDiv.innerHTML = `
                        <div class="status-box success">
                            <h2>✅ Certificado Válido!</h2>
                            <p><strong>Nome:</strong> ${cert.studentFirstName || ''} ${cert.studentLastName || ''}</p>
                            <p><strong>CPF:</strong> ${cert.studentCpf_masked || 'N/A'}</p>
                            <p><strong>Data de Nascimento:</strong> ${cert.studentBirthDate_formatted || 'N/A'}</p>
                            <p><strong>Curso Concluído:</strong> ${cert.courseName || 'N/A'}</p>
                            <p><strong>Data de Conclusão:</strong> ${cert.completion_date_formatted || 'N/A'}</p>
                        </div>
                    `;
                    history.pushState(null, '', `?hash=${hash}`);
                } else {
                    const errorMessage = data.data?.message || data.message || 'Certificado inválido ou não encontrado.';
                     resultDiv.innerHTML = `<p class="status-box error">❌ Erro: ${errorMessage}</p>`;
                     console.error("API Error:", data);
                }
            } catch (error) {
                console.error('Erro ao verificar certificado:', error);
                resultDiv.innerHTML = '<p class="status-box error">⚠️ Certificado inválido ou não encontrado.</p>';
            }
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const hashFromInput = hashInput.value.trim();
            verifyHash(hashFromInput);
        });

        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const hashFromUrl = urlParams.get('hash');
            if (hashFromUrl) {
                hashInput.value = hashFromUrl;
                verifyHash(hashFromUrl);
            }
        });
    </script>
</body>
</html>