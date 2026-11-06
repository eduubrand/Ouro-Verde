/* ==========================================================
   PAGINA DE SUCESSO: mostra o codigo e o resumo financeiro
   do pedido que acabou de ser criado.
   ========================================================== */

const reserva = JSON.parse(localStorage.getItem("ultimaReserva") || "null");
const resumo = document.getElementById("resumo-financeiro");
const instrucoes = document.getElementById("instrucoes-pagamento");

if (!reserva) {
    // Chegou aqui sem ter feito pedido (ex.: recarregou a pagina depois)
    resumo.style.display = "none";
    instrucoes.style.display = "none";
} else {
    document.getElementById("codigo-pedido").innerHTML =
        `Pedido <strong>#${reserva.idReserva}</strong> registrado para <strong>${escapeHtml(reserva.dataEvento)}</strong>.`;

    const linhasParcelas = (reserva.parcelas || []).map(p => `
        <tr>
            <td>${p.id?.numeroParcela ?? "-"}ª</td>
            <td>${escapeHtml(p.dataVencimento)}</td>
            <td>${formatarMoeda(p.valorParcela)}</td>
        </tr>
    `).join("");

    resumo.innerHTML = `
        <p><strong>Total: ${formatarMoeda(reserva.valorTotal)}</strong>
           · ${reserva.tipoEntrega === "ENTREGA" ? "Entrega no endereço" : "Retirada no Ouro Verde"}</p>
        <table>
            <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead>
            <tbody>${linhasParcelas}</tbody>
        </table>
    `;

    if (reserva.formaPagamento === "PIX") {
        instrucoes.innerHTML = `
            <h3 style="color: #2e7d32;">Pagamento via Pix</h3>
            <p>Use a chave abaixo e informe o código do pedido <strong>#${reserva.idReserva}</strong>:</p>
            <strong style="font-size: 18px; display: block; margin: 10px 0;">CNPJ: 12.345.678/0001-99</strong>
            <p style="font-size: 14px; color: #666;">(Ouro Verde Buffet Ltda)</p>
        `;
    } else {
        instrucoes.innerHTML = `
            <h3 style="color: #b71c1c;">Pagamento Presencial</h3>
            <p>O pagamento será realizado no balcão, na retirada ou na entrega.</p>
            <p style="font-size: 14px; color: #666;">Aceitamos dinheiro, débito e crédito.</p>
        `;
    }

    localStorage.removeItem("ultimaReserva");
}
