const SUPABASE_URL = 'https://vjcilebvyzhpsnffevlb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GLXo2UDxl_9cVceg4N9QUw_icjlVXep';

async function supabaseRequest(method, path, body = null, authToken = null) {
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options = { method, headers };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SUPABASE_URL}${path}`, options);

    if (response.status === 401) {
        localStorage.removeItem('sb_access_token');
        localStorage.removeItem('sb_refresh_token');
        localStorage.removeItem('sb_user_email');
        window.location.href = 'index.html';
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    const text = await response.text();
    if (!text) return null;

    const data = JSON.parse(text);

    if (!response.ok) {
        const mensagem = data.msg
            || data.error_description
            || data.error
            || data.message
            || 'Erro ao comunicar com o servidor.';
        throw new Error(mensagem);
    }

    return data;
}
