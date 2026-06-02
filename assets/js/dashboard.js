// ============================================================
// TOAST DE NOTIFICAÇÃO
// ============================================================
function showToast(mensagem, tipo = 'sucesso') {
    const cores = {
        sucesso: 'bg-green-600',
        erro: 'bg-red-600'
    };

    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[100] ${cores[tipo]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// INIT — executado ao carregar a página
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    await carregarDashboard();
    configurarEventos();
});

// ============================================================
// CARDS
// ============================================================
async function carregarCards() {
    try {
        const token = getAccessToken();

        const [suprimentos, estoque, movimentacoes, menorEstoque] = await Promise.all([
            supabaseRequest('GET', '/rest/v1/produtos?select=count', null, token),
            supabaseRequest('GET', '/rest/v1/produtos?select=quantidade', null, token),
            supabaseRequest('GET', '/rest/v1/movimentacoes?select=count', null, token),
            supabaseRequest('GET', '/rest/v1/produtos?order=quantidade.asc&limit=1', null, token)
        ]);

        const totalSuprimentos = suprimentos?.[0]?.count ?? 0;
        const totalEstoque = (estoque || []).reduce((acc, p) => acc + (p.quantidade || 0), 0);
        const totalMovimentacoes = movimentacoes?.[0]?.count ?? 0;

        document.getElementById('card-suprimentos').textContent = totalSuprimentos;
        document.getElementById('card-estoque').textContent = totalEstoque;
        document.getElementById('card-movimentacoes').textContent = totalMovimentacoes;

        const cardMenor = document.getElementById('card-menor-estoque');
        if (menorEstoque?.length) {
            const p = menorEstoque[0];
            cardMenor.textContent = `${p.codigo} (${p.quantidade})`;
        } else {
            cardMenor.textContent = '—';
        }
    } catch (err) {
        showToast('Erro ao carregar indicadores.', 'erro');
    }
}

// ============================================================
// GRÁFICO
// ============================================================
async function carregarGrafico() {
    try {
        const movimentacoes = await listarMovimentacoes();
        const contagem = {};

        (movimentacoes || []).forEach(m => {
            const destino = m.destino || 'Sem destino';
            contagem[destino] = (contagem[destino] || 0) + 1;
        });

        const labels = Object.keys(contagem);
        const dados = Object.values(contagem);

        const ctx = document.getElementById('grafico-movimentacoes');
        if (!ctx) return;

        if (window.meuGrafico) {
            window.meuGrafico.destroy();
        }

        window.meuGrafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Movimentações',
                    data: dados,
                    backgroundColor: [
                        '#3b82f6', '#8b5cf6', '#06b6d4',
                        '#f59e0b', '#ef4444', '#10b981'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    } catch (err) {
        showToast('Erro ao carregar gráfico.', 'erro');
    }
}

// ============================================================
// TABELA DE SUPRIMENTOS
// ============================================================
async function carregarTabelaSuprimentos() {
    try {
        const dados = await listarSuprimentos();
        const tbody = document.getElementById('tabela-suprimentos');
        tbody.innerHTML = '';

        if (!dados || dados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-8 text-center text-gray-400 text-sm">
                        Nenhum suprimento cadastrado.
                    </td>
                </tr>
            `;
            return;
        }

        dados.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition';
            tr.id = `suprimento-${p.id}`;
            tr.innerHTML = `
                <td class="py-3 pr-4 font-mono text-sm font-medium text-gray-800">${p.codigo}</td>
                <td class="py-3 pr-4 text-sm text-gray-600">${p.descricao}</td>
                <td class="py-3 pr-4 text-sm text-gray-600">${p.tipo}</td>
                <td class="py-3 pr-4 text-sm text-gray-600">${p.fabricante}</td>
                <td class="py-3 pr-4 text-sm font-semibold">${p.quantidade}</td>
                <td class="py-3 pr-4 text-sm text-gray-600">${p.localizacao || '—'}</td>
                <td class="py-3 text-right whitespace-nowrap">
                    <button class="btn-editar-suprimento text-blue-600 hover:text-blue-800 font-medium text-sm mr-3"
                            data-id="${p.id}">Editar</button>
                    <button class="btn-excluir-suprimento text-red-600 hover:text-red-800 font-medium text-sm"
                            data-id="${p.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-editar-suprimento').forEach(btn => {
            btn.addEventListener('click', () => abrirModalSuprimento(parseInt(btn.dataset.id)));
        });

        document.querySelectorAll('.btn-excluir-suprimento').forEach(btn => {
            btn.addEventListener('click', () => excluirSuprimentoAction(parseInt(btn.dataset.id)));
        });
    } catch (err) {
        showToast('Erro ao carregar suprimentos.', 'erro');
    }
}

// ============================================================
// TABELA DE MOVIMENTAÇÕES
// ============================================================
async function carregarTabelaMovimentacoes() {
    try {
        const dados = await listarMovimentacoes();
        const tbody = document.getElementById('tabela-movimentacoes');
        tbody.innerHTML = '';

        if (!dados || dados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-8 text-center text-gray-400 text-sm">
                        Nenhuma movimentação registrada.
                    </td>
                </tr>
            `;
            return;
        }

        dados.forEach(m => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition';
            tr.id = `movimentacao-${m.id}`;
            const suprimento = m.produtos
                ? `${m.produtos.codigo} — ${m.produtos.descricao}`
                : `ID ${m.produto_id}`;
            const data = m.created_at
                ? new Date(m.created_at).toLocaleString('pt-BR')
                : '—';
            tr.innerHTML = `
                <td class="py-3 pr-4 text-sm text-gray-800">${suprimento}</td>
                <td class="py-3 pr-4 text-sm text-gray-600">${m.origem}</td>
                <td class="py-3 pr-4 text-sm text-gray-600">${m.destino}</td>
                <td class="py-3 pr-4 text-sm font-semibold">${m.quantidade}</td>
                <td class="py-3 pr-4 text-sm text-gray-500 max-w-[200px] truncate">${m.observacao || '—'}</td>
                <td class="py-3 pr-4 text-sm text-gray-500">${data}</td>
                <td class="py-3 text-right">
                    <button class="btn-excluir-movimentacao text-red-600 hover:text-red-800 font-medium text-sm"
                            data-id="${m.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-excluir-movimentacao').forEach(btn => {
            btn.addEventListener('click', () => excluirMovimentacaoAction(parseInt(btn.dataset.id)));
        });
    } catch (err) {
        showToast('Erro ao carregar movimentações.', 'erro');
    }
}

// ============================================================
// AÇÕES: SUPRIMENTOS
// ============================================================
let suprimentoEditandoId = null;

function abrirModalSuprimento(id = null) {
    suprimentoEditandoId = id;

    const modal = document.getElementById('modal-suprimento');
    const titulo = modal.querySelector('h3');
    const btnSubmit = modal.querySelector('button[type="submit"]');
    const form = document.getElementById('form-suprimento');

    form.reset();
    document.getElementById('suprimento-fabricante').value = 'Lexmark';

    if (id) {
        titulo.textContent = 'Editar Suprimento';
        btnSubmit.textContent = 'Atualizar';
        preencherFormularioSuprimento(id);
    } else {
        titulo.textContent = 'Novo Suprimento';
        btnSubmit.textContent = 'Salvar';
    }

    modal.classList.remove('hidden');
}

async function preencherFormularioSuprimento(id) {
    try {
        const p = await obterSuprimento(id);
        if (!p) return;
        document.getElementById('suprimento-codigo').value = p.codigo || '';
        document.getElementById('suprimento-descricao').value = p.descricao || '';
        document.getElementById('suprimento-tipo').value = p.tipo || '';
        document.getElementById('suprimento-fabricante').value = p.fabricante || 'Lexmark';
        document.getElementById('suprimento-quantidade').value = p.quantidade ?? '';
        document.getElementById('suprimento-localizacao').value = p.localizacao || '';
    } catch (err) {
        showToast('Erro ao carregar dados do suprimento.', 'erro');
    }
}

function fecharModalSuprimento() {
    document.getElementById('modal-suprimento').classList.add('hidden');
    suprimentoEditandoId = null;
}

async function salvarSuprimento(event) {
    event.preventDefault();

    const dados = {
        codigo: document.getElementById('suprimento-codigo').value.trim(),
        descricao: document.getElementById('suprimento-descricao').value.trim(),
        tipo: document.getElementById('suprimento-tipo').value,
        fabricante: document.getElementById('suprimento-fabricante').value.trim(),
        quantidade: parseInt(document.getElementById('suprimento-quantidade').value) || 0,
        localizacao: document.getElementById('suprimento-localizacao').value.trim()
    };

    try {
        if (suprimentoEditandoId) {
            await atualizarSuprimento(suprimentoEditandoId, dados);
            showToast('Suprimento atualizado com sucesso!');
        } else {
            await criarSuprimento(dados);
            showToast('Suprimento cadastrado com sucesso!');
        }

        fecharModalSuprimento();
        await carregarTabelaSuprimentos();
        await carregarCards();
    } catch (err) {
        showToast(err.message, 'erro');
    }
}

async function excluirSuprimentoAction(id) {
    if (!confirm('Tem certeza que deseja excluir este suprimento?')) return;

    try {
        await excluirSuprimento(id);
        showToast('Suprimento excluído com sucesso!');
        await carregarTabelaSuprimentos();
        await carregarCards();
    } catch (err) {
        showToast(err.message, 'erro');
    }
}

// ============================================================
// AÇÕES: MOVIMENTAÇÕES
// ============================================================
async function abrirModalMovimentacao() {
    const modal = document.getElementById('modal-movimentacao');
    modal.classList.remove('hidden');

    const select = document.getElementById('movimentacao-produto');
    select.innerHTML = '<option value="">Carregando...</option>';

    try {
        const produtos = await listarSuprimentos();
        select.innerHTML = '<option value="">Selecione um suprimento</option>';
        (produtos || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.codigo} — ${p.descricao} (${p.quantidade} un)`;
            select.appendChild(opt);
        });
    } catch (err) {
        showToast('Erro ao carregar suprimentos.', 'erro');
    }

    document.getElementById('form-movimentacao').reset();
}

function fecharModalMovimentacao() {
    document.getElementById('modal-movimentacao').classList.add('hidden');
}

async function salvarMovimentacao(event) {
    event.preventDefault();

    const dados = {
        produto_id: parseInt(document.getElementById('movimentacao-produto').value),
        origem: document.getElementById('movimentacao-origem').value.trim(),
        destino: document.getElementById('movimentacao-destino').value.trim(),
        quantidade: parseInt(document.getElementById('movimentacao-quantidade').value) || 0,
        observacao: document.getElementById('movimentacao-observacao').value.trim()
    };

    if (!dados.produto_id) {
        showToast('Selecione um suprimento.', 'erro');
        return;
    }

    try {
        await criarMovimentacao(dados);
        showToast('Movimentação registrada com sucesso!');
        fecharModalMovimentacao();
        await carregarTabelaMovimentacoes();
        await carregarTabelaSuprimentos();
        await carregarCards();
        await carregarGrafico();
    } catch (err) {
        showToast(err.message, 'erro');
    }
}

async function excluirMovimentacaoAction(id) {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;

    try {
        await excluirMovimentacao(id);
        showToast('Movimentação excluída com sucesso!');
        await carregarTabelaMovimentacoes();
        await carregarCards();
        await carregarGrafico();
    } catch (err) {
        showToast(err.message, 'erro');
    }
}

// ============================================================
// CARREGAMENTO COMPLETO DO DASHBOARD
// ============================================================
async function carregarDashboard() {
    await Promise.all([
        carregarCards(),
        carregarGrafico(),
        carregarTabelaSuprimentos(),
        carregarTabelaMovimentacoes()
    ]);
}

// ============================================================
// EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('btn-sair')?.addEventListener('click', signOut);

    document.getElementById('btn-novo-suprimento')?.addEventListener('click', () => abrirModalSuprimento());
    document.getElementById('btn-cancelar-suprimento')?.addEventListener('click', fecharModalSuprimento);
    document.getElementById('btn-fechar-modal-suprimento')?.addEventListener('click', fecharModalSuprimento);
    document.getElementById('form-suprimento')?.addEventListener('submit', salvarSuprimento);

    document.getElementById('btn-nova-movimentacao')?.addEventListener('click', abrirModalMovimentacao);
    document.getElementById('btn-cancelar-movimentacao')?.addEventListener('click', fecharModalMovimentacao);
    document.getElementById('btn-fechar-modal-movimentacao')?.addEventListener('click', fecharModalMovimentacao);
    document.getElementById('form-movimentacao')?.addEventListener('submit', salvarMovimentacao);

    document.getElementById('modal-suprimento')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharModalSuprimento();
    });
    document.getElementById('modal-movimentacao')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharModalMovimentacao();
    });
}
