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
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        if (result.success === false) {
            const errorMessage = result.data?.message || result.message || 'API call failed';
            throw new Error(errorMessage);
        }
        return result.data;
    } catch (error) {
        console.error(`API call failed for action "${action}":`, error);
        alert(`Ocorreu um erro de comunicação com o servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        throw error;
    }
}