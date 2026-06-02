async function listarSuprimentos() {
    return supabaseRequest(
        'GET',
        '/rest/v1/produtos?order=created_at.desc',
        null,
        getAccessToken()
    );
}

async function criarSuprimento(dados) {
    return supabaseRequest(
        'POST',
        '/rest/v1/produtos',
        dados,
        getAccessToken()
    );
}

async function atualizarSuprimento(id, dados) {
    return supabaseRequest(
        'PATCH',
        `/rest/v1/produtos?id=eq.${id}`,
        dados,
        getAccessToken()
    );
}

async function excluirSuprimento(id) {
    return supabaseRequest(
        'DELETE',
        `/rest/v1/produtos?id=eq.${id}`,
        null,
        getAccessToken()
    );
}

async function obterSuprimento(id) {
    const dados = await supabaseRequest(
        'GET',
        `/rest/v1/produtos?id=eq.${id}&limit=1`,
        null,
        getAccessToken()
    );
    return dados?.[0] || null;
}
