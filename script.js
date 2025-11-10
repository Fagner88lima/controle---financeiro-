// ===== CONFIGURAÇÕES E CONSTANTES =====
const STORAGE_KEY = 'controle_financeiro_dados';
const CATEGORIAS_ENTRADA = ['Salário', 'Freelance', 'Investimento', 'Outras Entradas'];
const CATEGORIAS_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Investimentos', 'Outras Despesas'];
const META_SALDO = 500;

// ===== ESTADO DA APLICAÇÃO =====
let transacoes = [];
let transacaoParaExcluir = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    inicializarFormulario();
    configurarNavegacao();
    configurarModal();
    atualizarDashboard();
    
    // Definir data atual como padrão
    document.getElementById('data').valueAsDate = new Date();
});

// ===== CARREGAR E SALVAR DADOS =====
function carregarDados() {
    const dados = localStorage.getItem(STORAGE_KEY);
    transacoes = dados ? JSON.parse(dados) : [];
}

function salvarDados() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
}

// ===== INICIALIZAR FORMULÁRIO =====
function inicializarFormulario() {
    const selectCategoria = document.getElementById('categoria');
    const selectTipo = document.getElementById('tipo');
    const formTransacao = document.getElementById('formTransacao');

    // Preencher categorias iniciais
    atualizarCategorias();

    // Mudar categorias ao alterar tipo
    selectTipo.addEventListener('change', atualizarCategorias);

    // Enviar formulário
    formTransacao.addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarTransacao();
    });
}

function atualizarCategorias() {
    const selectTipo = document.getElementById('tipo').value;
    const selectCategoria = document.getElementById('categoria');
    
    selectCategoria.innerHTML = '<option value="">Selecione...</option>';
    
    const categorias = selectTipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_DESPESA;
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

function adicionarTransacao() {
    const data = document.getElementById('data').value;
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);

    if (!data || !tipo || !categoria || !descricao || !valor || valor <= 0) {
        alert('Por favor, preencha todos os campos corretamente');
        return;
    }

    const transacao = {
        id: Date.now(),
        data: new Date(data),
        tipo,
        categoria,
        descricao,
        valor,
        mesAno: obterMesAno(new Date(data))
    };

    transacoes.push(transacao);
    salvarDados();
    
    // Limpar formulário
    document.getElementById('formTransacao').reset();
    document.getElementById('data').valueAsDate = new Date();
    
    // Atualizar dashboard
    atualizarDashboard();
    
    // Feedback ao usuário
    mostrarNotificacao('Transação adicionada com sucesso!');
}

function excluirTransacao(id) {
    transacoes = transacoes.filter(t => t.id !== id);
    salvarDados();
    atualizarDashboard();
    fecharModal();
    mostrarNotificacao('Transação excluída com sucesso!');
}

// ===== CÁLCULOS FINANCEIROS =====
function obterMesAno(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${mes}/${ano}`;
}

function obterMesAtual() {
    const hoje = new Date();
    return obterMesAno(hoje);
}

function obterTransacoesMes(mesAno) {
    return transacoes.filter(t => t.mesAno === mesAno);
}

function calcularTotais(mesAno) {
    const transacoesMes = obterTransacoesMes(mesAno);
    
    const totalEntradas = transacoesMes
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const totalDespesas = transacoesMes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const saldoLiquido = totalEntradas - totalDespesas;
    
    return { totalEntradas, totalDespesas, saldoLiquido };
}

function obterIndicadorDesempenho(saldo) {
    if (saldo > META_SALDO) {
        return { texto: '😄 ÓTIMO (Acima da Meta)', classe: 'otimo' };
    } else if (saldo > 0) {
        return { texto: '😊 BOM (Positivo)', classe: 'bom' };
    } else {
        return { texto: '😞 ATENÇÃO (Negativo)', classe: 'atencao' };
    }
}

function obterDadosGrafico() {
    // Obter todos os meses únicos
    const meses = [...new Set(transacoes.map(t => t.mesAno))].sort();
    
    const dados = meses.map(mes => {
        const { totalEntradas, totalDespesas, saldoLiquido } = calcularTotais(mes);
        return { mes, entradas: totalEntradas, despesas: totalDespesas, saldo: saldoLiquido };
    });
    
    return dados;
}

// ===== DICAS PERSONALIZADAS =====
function atualizarDicas(entradas, despesas, saldo) {
    const dicasContainer = document.getElementById('dicasContainer');
    const dicas = gerarDicas(entradas, despesas, saldo);
    
    dicasContainer.innerHTML = dicas.map(dica => 
        `<div class="dica-item">${dica}</div>`
    ).join('');
}

function gerarDicas(entradas, despesas, saldo) {
    const dicas = [];
    const taxaPoupanca = entradas > 0 ? (saldo / entradas * 100) : 0;
    
    // Dicas baseadas no desempenho
    if (saldo > META_SALDO * 2) {
        dicas.push('🎉 Excelente! Você está economizando muito. Que tal investir em fundos ou ações para multiplicar seu dinheiro?');
        dicas.push('✈️ Com essa economia, você pode planejar uma viagem! Reserve 30% do saldo para uma aventura.');
    } else if (saldo > META_SALDO) {
        dicas.push('💪 Parabéns! Você está no caminho certo. Continue economizando para atingir seus objetivos.');
        dicas.push('🏖️ Que tal poupar R$ ' + formatarMoeda(saldo * 0.5) + ' para uma viagem?');
    } else if (saldo > 0) {
        dicas.push('👍 Você tem um saldo positivo! Tente aumentar suas entradas ou reduzir despesas desnecessárias.');
        dicas.push('💰 Reduza gastos com ' + obterCategoriaComMaiorDespesa() + ' para economizar mais.');
    } else if (saldo === 0) {
        dicas.push('⚠️ Você está no ponto de equilíbrio. Tente gerar mais entradas ou reduzir despesas.');
    } else {
        dicas.push('🚨 Você está gastando mais do que ganha! Revise suas despesas urgentemente.');
        dicas.push('📉 Reduza despesas com ' + obterCategoriaComMaiorDespesa() + ' para melhorar sua situação.');
    }
    
    // Dicas sobre investimento
    if (entradas > 0) {
        if (taxaPoupanca > 40) {
            dicas.push('📈 Com ' + taxaPoupanca.toFixed(1) + '% de taxa de poupança, você pode investir em renda fixa ou variável!');
        } else if (taxaPoupanca > 20) {
            dicas.push('💡 Tente aumentar sua taxa de poupança para 30% para começar a investir.');
        }
    }
    
    // Dicas sobre viagem
    if (saldo > 0) {
        const diasParaViajem = Math.ceil(saldo / 100);
        dicas.push('🌍 Economizando R$ 100 por mês, você pode viajar em ' + diasParaViajem + ' meses!');
    }
    
    return dicas.length > 0 ? dicas : ['💬 Continue registrando suas transações para receber dicas personalizadas!'];
}

function obterCategoriaComMaiorDespesa() {
    const mesAtual = obterMesAtual();
    const transacoesMes = obterTransacoesMes(mesAtual);
    const despesas = transacoesMes.filter(t => t.tipo === 'despesa');
    
    if (despesas.length === 0) return 'despesas';
    
    const categoriaMap = {};
    despesas.forEach(d => {
        categoriaMap[d.categoria] = (categoriaMap[d.categoria] || 0) + d.valor;
    });
    
    const categoriaMax = Object.keys(categoriaMap).reduce((a, b) => 
        categoriaMap[a] > categoriaMap[b] ? a : b
    );
    
    return categoriaMax.toLowerCase();
}

// ===== ATUALIZAR DASHBOARD =====
function atualizarDashboard() {
    const mesAtual = obterMesAtual();
    const { totalEntradas, totalDespesas, saldoLiquido } = calcularTotais(mesAtual);
    const indicador = obterIndicadorDesempenho(saldoLiquido);

    // Atualizar indicadores
    document.getElementById('mesAtual').textContent = formatarMes(mesAtual);
    document.getElementById('saldoMes').textContent = formatarMoeda(saldoLiquido);
    document.getElementById('totalEntradas').textContent = formatarMoeda(totalEntradas);
    document.getElementById('totalDespesas').textContent = formatarMoeda(totalDespesas);
    
    const indicadorElement = document.getElementById('indicador');
    indicadorElement.textContent = indicador.texto;
    indicadorElement.className = `indicador ${indicador.classe}`;

    // Atualizar dicas personalizadas
    atualizarDicas(totalEntradas, totalDespesas, saldoLiquido);

    // Atualizar últimas transações
    atualizarUltimasTransacoes();

    // Atualizar gráfico
    atualizarGrafico();

    // Atualizar histórico
    atualizarHistorico();
}

function atualizarUltimasTransacoes() {
    const container = document.getElementById('ultimasTransacoes');
    const ultimasTransacoes = transacoes
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 5);

    if (ultimasTransacoes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma transação registrada</p>';
        return;
    }

    container.innerHTML = ultimasTransacoes.map(t => criarElementoTransacao(t)).join('');
    
    // Adicionar event listeners para exclusão
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalExclusao(parseInt(btn.dataset.id));
        });
    });
}

function atualizarHistorico() {
    const container = document.getElementById('historico-list');
    const filtroMes = document.getElementById('filtroMes').value;
    
    let transacoesFiltradas = transacoes;
    
    if (filtroMes) {
        const [ano, mes] = filtroMes.split('-');
        const mesAnoFiltro = `${mes}/${ano}`;
        transacoesFiltradas = transacoes.filter(t => t.mesAno === mesAnoFiltro);
    }
    
    const transacoesOrdenadas = transacoesFiltradas.sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    );

    if (transacoesOrdenadas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma transação encontrada</p>';
        return;
    }

    container.innerHTML = transacoesOrdenadas.map(t => criarElementoTransacao(t)).join('');
    
    // Adicionar event listeners para exclusão
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalExclusao(parseInt(btn.dataset.id));
        });
    });
}

function criarElementoTransacao(transacao) {
    const dataFormatada = formatarData(transacao.data);
    const valorFormatado = formatarMoeda(transacao.valor);
    const classeValor = transacao.tipo === 'entrada' ? 'entrada' : 'despesa';
    const simbolo = transacao.tipo === 'entrada' ? '+' : '-';
    
    return `
        <div class="transacao-item">
            <div class="transacao-info">
                <div class="transacao-tipo">${transacao.tipo}</div>
                <div class="transacao-descricao">${transacao.descricao}</div>
                <div class="transacao-data">${dataFormatada} • ${transacao.categoria}</div>
            </div>
            <div class="transacao-valor ${classeValor}">${simbolo} ${valorFormatado}</div>
            <div class="transacao-actions">
                <button class="btn-delete" data-id="${transacao.id}" title="Excluir">🗑️</button>
            </div>
        </div>
    `;
}

// ===== GRÁFICO DE BARRAS INTUITIVO =====
function atualizarGrafico() {
    const canvas = document.getElementById('graficoEvolucao');
    const ctx = canvas.getContext('2d');
    
    const dados = obterDadosGrafico();
    
    if (dados.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado para exibir', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Redimensionar canvas
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 32;
    canvas.height = 350;

    const padding = 50;
    const larguraDisponivel = canvas.width - padding * 2;
    const alturaDisponivel = canvas.height - padding * 2;
    const larguraGrupo = larguraDisponivel / dados.length;
    const larguraBarra = larguraGrupo * 0.35;
    const espacoEntreBarras = larguraBarra * 0.5;

    // Encontrar max valor para escala
    const maxValor = Math.max(...dados.map(d => Math.max(d.entradas, d.despesas)));
    const escala = maxValor > 0 ? alturaDisponivel / maxValor : 1;

    // Desenhar grid horizontal
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
        const valor = (maxValor / 4) * i;
        const y = canvas.height - padding - (alturaDisponivel / 4) * i;
        
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        ctx.fillText(formatarMoeda(valor), padding - 10, y + 4);
    }

    // Desenhar barras
    dados.forEach((d, i) => {
        const centroX = padding + (larguraGrupo * i) + larguraGrupo / 2;
        
        // Barra de Entradas (Verde)
        const alturaEntradas = d.entradas * escala;
        const xEntradas = centroX - espacoEntreBarras - larguraBarra;
        const yEntradas = canvas.height - padding - alturaEntradas;
        
        ctx.fillStyle = '#10B981';
        ctx.fillRect(xEntradas, yEntradas, larguraBarra, alturaEntradas);
        
        // Valor da entrada acima da barra
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatarMoeda(d.entradas), xEntradas + larguraBarra / 2, yEntradas - 5);
        
        // Barra de Despesas (Vermelho)
        const alturaDespesas = d.despesas * escala;
        const xDespesas = centroX + espacoEntreBarras;
        const yDespesas = canvas.height - padding - alturaDespesas;
        
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(xDespesas, yDespesas, larguraBarra, alturaDespesas);
        
        // Valor da despesa acima da barra
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatarMoeda(d.despesas), xDespesas + larguraBarra / 2, yDespesas - 5);
        
        // Mês abaixo
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.mes, centroX, canvas.height - padding + 20);
    });

    // Desenhar legenda
    const legendaY = canvas.height - 15;
    
    // Legenda Entradas
    ctx.fillStyle = '#10B981';
    ctx.fillRect(padding, legendaY, 12, 12);
    ctx.fillStyle = '#1F2937';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Entradas', padding + 18, legendaY + 10);
    
    // Legenda Despesas
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(padding + 120, legendaY, 12, 12);
    ctx.fillStyle = '#1F2937';
    ctx.fillText('Despesas', padding + 136, legendaY + 10);
}

// ===== NAVEGAÇÃO =====
function configurarNavegacao() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Remover classe active de todos
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Adicionar classe active ao selecionado
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Atualizar dados ao abrir aba
            if (tabName === 'historico') {
                atualizarHistorico();
            }
        });
    });

    // Configurar filtro de mês
    document.getElementById('filtroMes').addEventListener('change', atualizarHistorico);
    document.getElementById('btnLimparFiltro').addEventListener('click', () => {
        document.getElementById('filtroMes').value = '';
        atualizarHistorico();
    });
}

// ===== MODAL =====
function configurarModal() {
    const modal = document.getElementById('modalConfirmacao');
    const btnCancelar = document.getElementById('btnCancelar');
    const btnConfirmar = document.getElementById('btnConfirmar');

    btnCancelar.addEventListener('click', fecharModal);
    btnConfirmar.addEventListener('click', () => {
        if (transacaoParaExcluir) {
            excluirTransacao(transacaoParaExcluir);
        }
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

function abrirModalExclusao(id) {
    transacaoParaExcluir = id;
    document.getElementById('modalConfirmacao').classList.add('active');
}

function fecharModal() {
    document.getElementById('modalConfirmacao').classList.remove('active');
    transacaoParaExcluir = null;
}

// ===== UTILITÁRIOS =====
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(data));
}

function formatarMes(mesAno) {
    const [mes, ano] = mesAno.split('/');
    const data = new Date(ano, mes - 1);
    return new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric'
    }).format(data);
}

function mostrarNotificacao(mensagem) {
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #10B981;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notificacao.textContent = mensagem;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
