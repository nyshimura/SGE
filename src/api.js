const API_URL = 'api/index.php';

/**
 * Realiza uma chamada para a API backend.
 * @param {string} action A ação a ser executada no backend.
 * @param {object} data Os dados a serem enviados.
 * @param {string} method O método HTTP a ser usado ('POST' ou 'GET').
 * @returns {Promise<any>} A resposta da API.
 */
export async function apiCall(action, data = {}, method = 'POST') {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        let url = `${API_URL}?action=${action}`;

        if (method === 'POST') {
            options.body = JSON.stringify(data);
        } else if (Object.keys(data).length) {
            url += '&' + new URLSearchParams(data).toString();
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            // Tenta obter uma mensagem de erro mais detalhada do corpo da resposta
            let errorText = await response.text();
            try {
                // Tenta analisar como JSON, pois a API pode retornar { success: false, data: { message: '...' } }
                const errorResult = JSON.parse(errorText);
                if (errorResult && !errorResult.success && (errorResult.data?.message || errorResult.message)) {
                    errorText = errorResult.data?.message || errorResult.message;
                }
            } catch (jsonError) {
                // Se não for JSON, usa o texto como está (pode ser erro de servidor HTML)
            }
            // Usa a mensagem extraída ou uma mensagem padrão
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success === false) {
            const errorMessage = result.data?.message || result.message || 'API call failed';
            throw new Error(errorMessage);
        }
        return result.data;
    } catch (error) {
        console.error(`API call failed for action "${action}":`, error);
        // Remove o alert daqui
        // alert(`Ocorreu um erro de comunicação com o servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        throw error; // Relança o erro para ser tratado pela função que chamou apiCall
    }
}