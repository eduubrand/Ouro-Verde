/* ==========================================================
   MEUS PEDIDOS (UC06 - Acompanhar Historico de Alugueis)
   Antes listava as reservas de TODOS os clientes.
   Agora busca so as do cliente logado.
   ========================================================== */

const clienteLogado = exigirLoginCliente("meusPedidos.html");

function resumoItens(reserva) {
    const partes = [];
    if (reserva.servico && Number(reserva.servico.precoBase) > 0) {
        partes.push(escapeHtml(reserva.servico.nome));
    }
    (reserva.itens || []).forEach(item => {
        partes.push(`${item.quantidadeAlocada}x ${escapeHtml(item.material?.nome ?? "item")}`);
    });
    return partes.join("<br>") || "-";
}

function resumoPagamento(reserva) {
    const parcelas = reserva.parcelas || [];
    const pagas = parcelas.filter(p => p.statusPagamento === "PAGO").length;
    const forma = reserva.formaPagamento === "PRESENCIAL" ? "Presencial" : "Pix";
    return `${forma}<br><small>${pagas}/${parcelas.length} parcela(s) paga(s)</small>`;
}

async function carregarPedidos() {
    const corpo = document.getElementById("listaPedidos");
    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center;">Buscando seus pedidos...</td></tr>';

    try {
        const reservas = await apiFetch(`/reservas/cliente/${clienteLogado.idCliente}`);

        if (reservas.length === 0) {
            corpo.innerHTML = '<tr><td colspan="7" style="text-align:center;">Você ainda não possui pedidos.</td></tr>';
            return;
        }

        corpo.innerHTML = reservas.map(r => `
            <tr>
                <td>#${r.idReserva}<br><small>feito em ${formatarData(r.dataSolicitacao)}</small></td>
                <td>${formatarData(r.dataEvento)}</td>
                <td>${resumoItens(r)}</td>
                <td>${r.tipoEntrega === "ENTREGA" ? "Entrega" : "Retirada"}</td>
                <td><span class="status ${(r.status || "").toLowerCase()}">${nomeStatus(r.status)}</span></td>
                <td>${resumoPagamento(r)}</td>
                <td><strong>${formatarMoeda(r.valorTotal)}</strong></td>
            </tr>
        `).join("");
    } catch (erro) {
        corpo.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ff6b6b;">${escapeHtml(erro.message)}</td></tr>`;
    }
}

if (clienteLogado) {
    document.getElementById("saudacao").innerHTML =
        `Olá, ${escapeHtml(clienteLogado.nome)} · <a href="#" id="sair">Sair</a>`;
    document.getElementById("sair").addEventListener("click", (e) => {
        e.preventDefault();
        logoutCliente("../index.html");
    });
    carregarPedidos();
}
