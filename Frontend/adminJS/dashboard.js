/* ==========================================================
   DASHBOARD: resumo + 5 pedidos mais recentes
   ========================================================== */

configurarLogout();

const tbody = document.getElementById("pedidosTable");

async function carregarDashboard() {
    tbody.innerHTML = `<tr><td colspan="7" class="celula-aviso">Carregando dados...</td></tr>`;

    try {
        const [reservas, materiais] = await Promise.all([
            apiFetch("/reservas"),
            apiFetch("/materiais")
        ]);

        preencherCards(reservas, materiais);
        preencherTabela(reservas);
    } catch (erro) {
        console.error(erro);
        tbody.innerHTML = `<tr><td colspan="7" class="celula-erro">${escapeHtml(erro.message)}</td></tr>`;
    }
}

function preencherCards(reservas, materiais) {
    document.getElementById("receitaMensal").textContent = formatarMoeda(calcularReceitaDoMes(reservas));
    document.getElementById("produtosAtivos").textContent = materiais.length;
    document.getElementById("pedidosPendentes").textContent = reservas.filter(r => r.status === "PENDENTE").length;
}

function preencherTabela(reservas) {
    // O backend ja devolve do mais novo para o mais antigo
    const recentes = reservas.slice(0, 5);

    if (recentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="celula-aviso">Nenhum pedido encontrado.</td></tr>`;
        return;
    }

    // Antes a coluna ENTREGA repetia a data do evento.
    tbody.innerHTML = recentes.map(r => `
        <tr>
            <td>${r.idReserva}</td>
            <td>${escapeHtml(r.cliente?.nome ?? "-")}</td>
            <td>${formatarData(r.dataEvento)}</td>
            <td>${r.tipoEntrega === "ENTREGA" ? "Entrega" : "Retirada"}</td>
            <td>${formatarMoeda(r.valorTotal)}</td>
            <td>${badgeStatus(r.status)}</td>
            <td>
                <button class="btn-action" onclick="window.location.href='pedidos.html?id=${r.idReserva}'">Ver</button>
            </td>
        </tr>
    `).join("");
}

carregarDashboard();
