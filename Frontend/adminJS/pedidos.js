/* ==========================================================
   PEDIDOS (UC09 - Monitorar Painel de Pedidos
             + extend: Registrar Pagamento Manual)
   ========================================================== */

configurarLogout();

const tbody = document.getElementById("pedidosTable");
const filtroStatus = document.getElementById("filtroStatus");
const modalDetalhes = document.getElementById("detalhesModal");
const conteudoDetalhes = document.getElementById("detalhesConteudo");

let reservas = [];

/* ---------------- LISTAGEM ---------------- */

async function carregarPedidos() {
    tbody.innerHTML = `<tr><td colspan="9" class="celula-aviso">Carregando pedidos...</td></tr>`;

    try {
        reservas = await apiFetch("/reservas");
        renderizarCards();
        renderizarTabela();
    } catch (erro) {
        tbody.innerHTML = `<tr><td colspan="9" class="celula-erro">${escapeHtml(erro.message)}</td></tr>`;
    }
}

function renderizarCards() {
    document.getElementById("receitaMensal").textContent = formatarMoeda(calcularReceitaDoMes(reservas));
    document.getElementById("pedidosPendentes").textContent = reservas.filter(r => r.status === "PENDENTE").length;
    document.getElementById("pedidosFinalizados").textContent = reservas.filter(r => r.status === "CONCLUIDO").length;
}

function descricaoItens(r) {
    const partes = [];
    if (r.servico && Number(r.servico.precoBase) > 0) partes.push(escapeHtml(r.servico.nome));
    const qtdItens = (r.itens || []).reduce((s, i) => s + i.quantidadeAlocada, 0);
    if (qtdItens > 0) partes.push(`${qtdItens} item(ns)`);
    return partes.join(" + ") || "-";
}

function totalPago(r) {
    return (r.parcelas || [])
        .filter(p => p.statusPagamento === "PAGO")
        .reduce((s, p) => s + Number(p.valorParcela), 0);
}

function renderizarTabela() {
    const filtro = filtroStatus.value;
    const lista = filtro ? reservas.filter(r => r.status === filtro) : reservas;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="celula-aviso">Nenhum pedido encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(r => `
        <tr>
            <td>${r.idReserva}</td>
            <td>${escapeHtml(r.cliente?.nome ?? "-")}</td>
            <td>${descricaoItens(r)}</td>
            <td>${formatarData(r.dataEvento)}</td>
            <td>${r.tipoEntrega === "ENTREGA" ? "Entrega" : "Retirada"}</td>
            <td><strong>${formatarMoeda(r.valorTotal)}</strong></td>
            <td>${formatarMoeda(totalPago(r))}</td>
            <td>${badgeStatus(r.status)}</td>
            <td><button class="btn-action" onclick="abrirDetalhes(${r.idReserva})">Ver</button></td>
        </tr>
    `).join("");
}

filtroStatus.addEventListener("change", renderizarTabela);

/* ---------------- DETALHES (modal) ---------------- */

function abrirDetalhes(idReserva) {
    const r = reservas.find(x => x.idReserva === idReserva);
    if (!r) return;

    const finalizada = r.status === "CANCELADO" || r.status === "CONCLUIDO";
    const c = r.cliente || {};
    const endereco = [c.rua, c.numero, c.bairro, c.cidade, c.cep].filter(Boolean).join(", ") || "não informado";

    const linhasItens = (r.itens || []).map(i => `
        <tr>
            <td>${escapeHtml(i.material?.nome ?? "-")}</td>
            <td>${i.quantidadeAlocada}</td>
            <td>${formatarMoeda(i.precoNoMomento)}</td>
            <td>${formatarMoeda(i.precoNoMomento * i.quantidadeAlocada)}</td>
        </tr>
    `).join("") || `<tr><td colspan="4" class="celula-aviso">Sem itens avulsos.</td></tr>`;

    const linhasParcelas = (r.parcelas || []).map(p => {
        const paga = p.statusPagamento === "PAGO";
        const acao = paga || r.status === "CANCELADO"
            ? (paga ? `pago em ${formatarData(p.dataPagamento)}` : "-")
            : `<button class="btn-action" onclick="registrarPagamento(${r.idReserva}, ${p.id.numeroParcela})">Registrar pagamento</button>`;
        return `
            <tr>
                <td>${p.id.numeroParcela}ª</td>
                <td>${formatarData(p.dataVencimento)}</td>
                <td>${formatarMoeda(p.valorParcela)}</td>
                <td><span class="status ${paga ? "pago" : "pendente"}">${paga ? "Pago" : "Pendente"}</span></td>
                <td>${acao}</td>
            </tr>
        `;
    }).join("");

    const opcoesStatus = STATUS_RESERVA.map(s =>
        `<option value="${s}" ${s === r.status ? "selected" : ""}>${nomeStatus(s)}</option>`
    ).join("");

    conteudoDetalhes.innerHTML = `
        <div class="detalhe-topo">
            <div>
                <span class="eyebrow">Pedido #${r.idReserva}</span>
                <h2>${escapeHtml(c.nome ?? "-")}</h2>
            </div>
            ${badgeStatus(r.status)}
            <button class="btn-fechar" onclick="fecharDetalhes()" aria-label="Fechar">✕</button>
        </div>

        <div class="detalhe-grade">
            <dl>
                <dt>Cliente</dt>
                <dd>${escapeHtml(c.email ?? "-")}<br>CPF/CNPJ ${escapeHtml(c.cpfCnpj ?? "-")}</dd>
                <dt>Endereço</dt>
                <dd>${escapeHtml(endereco)}</dd>
            </dl>
            <dl>
                <dt>Evento</dt>
                <dd><strong>${formatarData(r.dataEvento)}</strong> · pedido em ${formatarData(r.dataSolicitacao)}</dd>
                <dt>Espaço / serviço</dt>
                <dd>${escapeHtml(r.servico?.nome ?? "-")} · ${formatarMoeda(r.servico?.precoBase)}</dd>
                <dt>Logística e pagamento</dt>
                <dd>${r.tipoEntrega === "ENTREGA" ? "Entrega no endereço do cliente" : "Retirada no Ouro Verde"}
                    · ${r.formaPagamento === "PRESENCIAL" ? "Presencial" : "Pix"}</dd>
            </dl>
        </div>

        <h3 class="detalhe-titulo">Itens</h3>
        <table class="tabela responsiva">
            <thead><tr><th>Produto</th><th>Qtd</th><th>Preço unit.</th><th>Subtotal</th></tr></thead>
            <tbody>${linhasItens}</tbody>
        </table>

        <div class="detalhe-totais">
            <span>Total <strong>${formatarMoeda(r.valorTotal)}</strong></span>
            <span>Pago <strong>${formatarMoeda(totalPago(r))}</strong></span>
        </div>

        <h3 class="detalhe-titulo">Parcelas</h3>
        <table class="tabela responsiva">
            <thead><tr><th>Nº</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ação</th></tr></thead>
            <tbody>${linhasParcelas}</tbody>
        </table>

        <div class="linha-status">
            <label for="novoStatus">Alterar status</label>
            <select id="novoStatus" ${finalizada ? "disabled" : ""}>${opcoesStatus}</select>
            <button class="btn-action" ${finalizada ? "disabled" : ""} onclick="salvarStatus(${r.idReserva})">Salvar status</button>
            ${finalizada ? `<small>Pedidos concluídos ou cancelados não podem mais ser alterados.</small>` : ""}
        </div>
    `;

    modalDetalhes.classList.add("show");
}

function fecharDetalhes() {
    modalDetalhes.classList.remove("show");
}

// Fecha ao clicar fora da caixa
modalDetalhes.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) fecharDetalhes();
});

/** Atualiza a reserva na lista local e redesenha tudo (mantendo o modal aberto). */
function aplicarReservaAtualizada(reservaAtualizada) {
    reservas = reservas.map(r => r.idReserva === reservaAtualizada.idReserva ? reservaAtualizada : r);
    renderizarCards();
    renderizarTabela();
    abrirDetalhes(reservaAtualizada.idReserva);
}

async function salvarStatus(idReserva) {
    const novoStatus = document.getElementById("novoStatus").value;

    if (novoStatus === "CANCELADO" &&
        !confirm("Cancelar este pedido? Os itens voltam a ficar disponíveis e isso não pode ser desfeito.")) {
        return;
    }

    try {
        const atualizada = await apiFetch(
            `/reservas/${idReserva}/status?novoStatus=${encodeURIComponent(novoStatus)}`,
            { method: "PATCH" }
        );
        aplicarReservaAtualizada(atualizada);
    } catch (erro) {
        alert("Erro ao atualizar status: " + erro.message);
    }
}

async function registrarPagamento(idReserva, numeroParcela) {
    if (!confirm(`Confirmar o recebimento da ${numeroParcela}ª parcela do pedido #${idReserva}?`)) return;

    try {
        const atualizada = await apiFetch(
            `/reservas/${idReserva}/parcelas/${numeroParcela}/pagar`,
            { method: "PATCH" }
        );
        aplicarReservaAtualizada(atualizada);
    } catch (erro) {
        alert("Erro ao registrar pagamento: " + erro.message);
    }
}

/* ---------------- INICIO ---------------- */

carregarPedidos().then(() => {
    // Vindo do dashboard com pedidos.html?id=5 -> ja abre o pedido
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (id) abrirDetalhes(id);
});

// Esc fecha a janela de detalhes
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharDetalhes();
});
