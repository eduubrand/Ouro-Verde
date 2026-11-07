/* ==========================================================
   CHECKOUT (UC05 - Finalizar Pedido de Aluguel)
   ========================================================== */

const cliente = exigirLoginCliente("checkout.html");
const carrinho = lerCarrinho();
let servicos = [];

function hojeISO() {
    // Data local no formato yyyy-MM-dd (toISOString usaria UTC e poderia virar "amanha")
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function servicoSelecionado() {
    const id = Number(document.getElementById("servico").value);
    return servicos.find(s => s.idServico === id);
}

function calcularResumo() {
    const lista = document.getElementById("itensResumo");

    lista.innerHTML = carrinho.map(item => `
        <div class="linha-resumo">
            <span>${item.quantidade}x ${escapeHtml(item.nome)}</span>
            <span>${formatarMoeda(item.preco * item.quantidade)}</span>
        </div>
    `).join("");

    const subtotal = totalCarrinho(carrinho);
    const servico = servicoSelecionado();
    const precoServico = servico ? Number(servico.precoBase) : 0;
    const total = subtotal + precoServico;
    const parcelas = Number(document.getElementById("parcelas").value);

    document.getElementById("subtotal").textContent = formatarMoeda(subtotal);
    document.getElementById("nome-servico-resumo").textContent = servico ? servico.nome : "Serviço";
    document.getElementById("preco-servico").textContent = formatarMoeda(precoServico);
    document.getElementById("total").textContent = formatarMoeda(total);
    document.getElementById("valor-parcela").textContent =
        parcelas > 1 ? `${parcelas}x de aprox. ${formatarMoeda(total / parcelas)}` : "";
    document.getElementById("descricao-servico").textContent = servico?.descricao ?? "";
}

async function carregarServicos() {
    const select = document.getElementById("servico");
    try {
        servicos = await apiFetch("/servicos");
        select.innerHTML = servicos.map(s => `
            <option value="${s.idServico}">
                ${escapeHtml(s.nome)} — ${Number(s.precoBase) > 0 ? formatarMoeda(s.precoBase) : "sem custo adicional"}
            </option>
        `).join("");
    } catch (erro) {
        select.innerHTML = `<option value="">Erro ao carregar serviços</option>`;
        alert(erro.message);
    }
    calcularResumo();
}

/** Caso de uso incluido: Verificar Disponibilidade (aviso antecipado; o backend confere de novo). */
async function verificarDisponibilidade() {
    const aviso = document.getElementById("aviso-disponibilidade");
    const data = document.getElementById("dataEvento").value;
    aviso.textContent = "";
    if (!data) return;

    try {
        const disponibilidade = await apiFetch(`/materiais/disponibilidade?data=${data}`);
        const problemas = carrinho
            .map(item => {
                const d = disponibilidade.find(x => x.idMaterial === item.idMaterial);
                return d && item.quantidade > d.disponivel
                    ? `${item.nome}: só ${d.disponivel} disponível(is) nessa data`
                    : null;
            })
            .filter(Boolean);

        aviso.textContent = problemas.length ? "⚠ " + problemas.join(" · ") : "✓ Todos os itens disponíveis nessa data.";
        aviso.className = problemas.length ? "aviso erro" : "aviso ok";
    } catch (erro) {
        console.error(erro);
    }
}

function mostrarEndereco() {
    const tipo = document.querySelector('input[name="tipoEntrega"]:checked').value;
    const el = document.getElementById("endereco-entrega");

    if (tipo === "ENTREGA") {
        const partes = [cliente.rua, cliente.numero, cliente.bairro, cliente.cidade].filter(Boolean);
        el.textContent = partes.length
            ? `Entregaremos em: ${partes.join(", ")}`
            : "Seu cadastro não tem endereço. Nossa equipe entrará em contato para combinar a entrega.";
        el.classList.remove("oculto");
    } else {
        el.classList.add("oculto");
    }
}

async function finalizarPedido(event) {
    event.preventDefault();

    if (carrinho.length === 0 && !(Number(servicoSelecionado()?.precoBase) > 0)) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const dataEvento = document.getElementById("dataEvento").value;
    if (!dataEvento) {
        alert("Selecione a data do evento.");
        return;
    }

    // Formato que o backend espera (ReservaRequestDTO).
    // Antes era enviado "materiais"/"quantidade", que o Java ignorava -> reserva sem itens.
    const payload = {
        idCliente: cliente.idCliente,
        idServico: Number(document.getElementById("servico").value),
        dataEvento: dataEvento,
        tipoEntrega: document.querySelector('input[name="tipoEntrega"]:checked').value,
        formaPagamento: document.querySelector('input[name="metodoPagamento"]:checked').value,
        quantidadeParcelas: Number(document.getElementById("parcelas").value),
        itens: carrinho.map(item => ({
            idMaterial: item.idMaterial,
            quantidadeAlocada: item.quantidade
        }))
    };

    const botao = document.getElementById("btn-finalizar");
    botao.disabled = true;
    botao.textContent = "Enviando...";

    try {
        const reserva = await apiFetch("/reservas", { method: "POST", body: JSON.stringify(payload) });

        localStorage.setItem("ultimaReserva", JSON.stringify({
            idReserva: reserva.idReserva,
            valorTotal: reserva.valorTotal,
            formaPagamento: reserva.formaPagamento,
            tipoEntrega: reserva.tipoEntrega,
            dataEvento: reserva.dataEvento,
            parcelas: reserva.parcelas
        }));
        limparCarrinho();
        window.location.href = "sucesso.html";
    } catch (erro) {
        // Sessao antiga de um cliente que nao existe mais no banco (ex.: banco recriado):
        // desloga e manda entrar de novo, sem perder o carrinho.
        if (erro.message.startsWith("Cliente não encontrado")) {
            alert("Sua sessão expirou. Entre novamente para finalizar o pedido.");
            logoutCliente("login.html?voltar=checkout.html");
            return;
        }
        alert("Não foi possível concluir o pedido:\n" + erro.message);
        botao.disabled = false;
        botao.textContent = "Finalizar pedido";
    }
}

/* ---------------- INICIALIZACAO ---------------- */

if (cliente) {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio. Escolha os itens no catálogo primeiro.");
        window.location.href = "../index.html";
    }

    document.getElementById("nome").value = cliente.nome;
    document.getElementById("email").value = cliente.email;
    document.getElementById("trocar-conta").addEventListener("click", (e) => {
        e.preventDefault();
        logoutCliente("login.html?voltar=checkout.html");
    });

    const campoData = document.getElementById("dataEvento");
    campoData.min = hojeISO();
    campoData.addEventListener("change", verificarDisponibilidade);

    document.getElementById("servico").addEventListener("change", calcularResumo);
    document.getElementById("parcelas").addEventListener("change", calcularResumo);
    document.querySelectorAll('input[name="tipoEntrega"]').forEach(r => r.addEventListener("change", mostrarEndereco));
    document.getElementById("form-checkout").addEventListener("submit", finalizarPedido);

    calcularResumo();
    carregarServicos();
}
