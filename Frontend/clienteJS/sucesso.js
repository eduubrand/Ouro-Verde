/* ==========================================================
   PAGINA DE SUCESSO: mostra o codigo e o resumo financeiro
   do pedido que acabou de ser criado.
   ========================================================== */

const reserva = JSON.parse(localStorage.getItem("ultimaReserva") || "null");
const resumo = document.getElementById("resumo-financeiro");
const instrucoes = document.getElementById("instrucoes-pagamento");

if (reserva) {
    document.getElementById("codigo-pedido").innerHTML =
        `Pedido <strong>#${reserva.idReserva}</strong> registrado para o dia <strong>${escapeHtml(formatarData(reserva.dataEvento))}</strong>.`;

    const linhasParcelas = (reserva.parcelas || []).map(p => `
        <tr>
            <td>${p.id?.numeroParcela ?? "-"}ª</td>
            <td>${escapeHtml(formatarData(p.dataVencimento))}</td>
            <td>${formatarMoeda(p.valorParcela)}</td>
        </tr>
    `).join("");

    resumo.innerHTML = `
        <div class="linha-resumo total">
            <span>Total · ${reserva.tipoEntrega === "ENTREGA" ? "entrega no endereço" : "retirada no Ouro Verde"}</span>
            <span>${formatarMoeda(reserva.valorTotal)}</span>
        </div>
        <table class="tabela">
            <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead>
            <tbody>${linhasParcelas}</tbody>
        </table>
    `;

    if (reserva.formaPagamento === "PIX") {
        instrucoes.innerHTML = `
            <h3>Pagamento via Pix</h3>
            <p>Use a chave abaixo e informe o código do pedido <strong>#${reserva.idReserva}</strong>.</p>
            <span class="chave">CNPJ 12.345.678/0001-99</span>
            <small>Ouro Verde Buffet Ltda</small>
        `;
    } else {
        instrucoes.innerHTML = `
            <h3>Pagamento presencial</h3>
            <p>O pagamento é feito no balcão, na retirada ou na entrega.</p>
            <small>Aceitamos dinheiro, débito e crédito.</small>
        `;
    }

    localStorage.removeItem("ultimaReserva");
}
// Sem "ultimaReserva" (ex.: recarregou a pagina depois), os blocos vazios
// ficam escondidos pelo CSS (:empty).
