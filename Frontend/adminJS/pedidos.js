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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Carregando pedidos...</td></tr>`;

    try {
        reservas = await apiFetch("/reservas");
        renderizarCards();
        renderizarTabela();
    } catch (erro) {
        tbody.innerHTML = `<tr><td colspan="9" style="color:#ff8a8a; text-align:center;">${escapeHtml(erro.message)}</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Nenhum pedido encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(r => `
        <tr>
            <td>${r.idReserva}</td>
            <td>${escapeHtml(r.cliente?.nome ?? "-")}</td>
            <td>${descricaoItens(r)}</td>
            <td>${formatarData(r.dataEvento)}</td>
            <td>${r.tipoEntrega === "ENTREGA" ? "Entrega" : "Retirada"}</td>
            <td style="font-weight:bold;">${formatarMoeda(r.valorTotal)}</td>
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
    `).join("") || `<tr><td colspan="4">Sem itens avulsos.</td></tr>`;

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
        <h2>Pedido #${r.idReserva} ${badgeStatus(r.status)}</h2>

        <h4>Cliente</h4>
        <p><strong>${escapeHtml(c.nome ?? "-")}</strong> · ${escapeHtml(c.email ?? "")} · CPF/CNPJ ${escapeHtml(c.cpfCnpj ?? "-")}</p>
        <p>Endereço: ${escapeHtml(endereco)}</p>

        <h4>Evento</h4>
        <p>Data: <strong>${formatarData(r.dataEvento)}</strong> (solicitado em ${formatarData(r.dataSolicitacao)})</p>
        <p>Espaço/serviço: ${escapeHtml(r.servico?.nome ?? "-")} — ${formatarMoeda(r.servico?.precoBase)}</p>
        <p>${r.tipoEntrega === "ENTREGA" ? "🚚 Entrega no endereço do cliente" : "🏬 Retirada no Ouro Verde"}
           · Pagamento: ${r.formaPagamento === "PRESENCIAL" ? "Presencial" : "Pix"}</p>

        <h4>Itens</h4>
        <table>
            <thead><tr><th>PRODUTO</th><th>QTD</th><th>PREÇO UNIT.</th><th>SUBTOTAL</th></tr></thead>
            <tbody>${linhasItens}</tbody>
        </table>
        <p style="margin-top:8px;"><strong>Total: ${formatarMoeda(r.valorTotal)}</strong> · Pago: ${formatarMoeda(totalPago(r))}</p>

        <h4>Parcelas</h4>
        <table>
            <thead><tr><th>Nº</th><th>VENCIMENTO</th><th>VALOR</th><th>SITUAÇÃO</th><th></th></tr></thead>
            <tbody>${linhasParcelas}</tbody>
        </table>

        <div class="linha-status">
            <label for="novoStatus"><strong>Alterar status:</strong></label>
            <select id="novoStatus" ${finalizada ? "disabled" : ""}>${opcoesStatus}</select>
            <button class="btn-action" ${finalizada ? "disabled" : ""} onclick="salvarStatus(${r.idReserva})">Salvar status</button>
            ${finalizada ? `<small>Pedidos concluídos ou cancelados não podem mais ser alterados.</small>` : ""}
        </div>

        <div class="rodape-modal">
            <button class="btn-action secundario" onclick="fecharDetalhes()">Fechar</button>
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
