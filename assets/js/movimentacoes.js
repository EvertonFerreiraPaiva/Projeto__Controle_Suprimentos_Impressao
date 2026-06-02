async function listarMovimentacoes() {
    return supabaseRequest(
        'GET',
        '/rest/v1/movimentacoes?select=*,produtos(codigo,descricao)&order=created_at.desc',
        null,
        getAccessToken()
    );
}

async function criarMovimentacao(dados) {
    const token = getAccessToken();

    const movimentacao = await supabaseRequest(
        'POST',
        '/rest/v1/movimentacoes',
        dados,
        token
    );

    const produto = await obterSuprimento(dados.produto_id);
    if (!produto) return movimentacao;

    let novaQuantidade = produto.quantidade;

    if (dados.destino === 'Estoque' && dados.origem !== 'Estoque') {
        novaQuantidade += dados.quantidade;
    }

    if (dados.origem === 'Estoque' && dados.destino !== 'Estoque') {
        novaQuantidade -= dados.quantidade;
    }

    if (novaQuantidade !== produto.quantidade) {
        await supabaseRequest(
            'PATCH',
            `/rest/v1/produtos?id=eq.${dados.produto_id}`,
            { quantidade: Math.max(0, novaQuantidade) },
            token
        );
    }

    return movimentacao;
}

async function excluirMovimentacao(id) {
    return supabaseRequest(
        'DELETE',
        `/rest/v1/movimentacoes?id=eq.${id}`,
        null,
        getAccessToken()
    );
}
