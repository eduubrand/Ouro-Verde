/* ==========================================================
   FUNCOES COMPARTILHADAS - AREA DO CLIENTE
   Usado por: index.html, login.html, checkout.html,
              meusPedidos.html e sucesso.html
   ========================================================== */

// O endereco do backend (API_BASE_URL) fica em Frontend/config.js

/**
 * Faz uma requisicao para a API.
 * - Retorna o JSON da resposta (ou null se nao houver corpo).
 * - Se der erro, lanca um Error com a mensagem que o backend mandou.
 */
async function apiFetch(endpoint, options = {}) {
    let resposta;
    try {
        resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (erro) {
        throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
    }

    const texto = await resposta.text();
    let corpo = null;
    try { corpo = texto ? JSON.parse(texto) : null; } catch (_) { corpo = texto; }

    if (!resposta.ok) {
        const mensagem = (corpo && corpo.message) || `Erro ${resposta.status} ao acessar ${endpoint}`;
        throw new Error(mensagem);
    }
    return corpo;
}

/* ---------------- FORMATACAO ---------------- */

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Aceita "dd/MM/yyyy" (formato do backend), "yyyy-MM-dd" ou [ano, mes, dia]. */
function formatarData(data) {
    if (!data) return "-";
    if (Array.isArray(data)) {
        const [ano, mes, dia] = data;
        return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
    }
    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}/.test(data)) {
        const [ano, mes, dia] = data.substring(0, 10).split("-");
        return `${dia}/${mes}/${ano}`;
    }
    return data;
}

/** Evita que um texto vindo do banco (ex.: nome com aspas ou <tags>) quebre o HTML. */
function escapeHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const NOMES_STATUS = {
    PENDENTE: "Pendente",
    CONFIRMADO: "Confirmado",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado"
};

function nomeStatus(status) {
    return NOMES_STATUS[status] || status || "-";
}

/* ---------------- CARRINHO ----------------
   Formato salvo no localStorage:
   [ { idMaterial, nome, preco, quantidade, estoque } ]
------------------------------------------------ */

function lerCarrinho() {
    let itens;
    try {
        itens = JSON.parse(localStorage.getItem("carrinho")) || [];
    } catch (_) {
        itens = [];
    }

    // Converte carrinhos antigos (um item repetido por clique, sem quantidade)
    // e descarta itens sem idMaterial (vinham do catalogo falso antigo).
    const agrupado = {};
    itens.forEach(item => {
        if (!item || !item.idMaterial) return;
        const qtd = Number(item.quantidade) || 1;
        if (agrupado[item.idMaterial]) {
            agrupado[item.idMaterial].quantidade += qtd;
        } else {
            agrupado[item.idMaterial] = { ...item, preco: Number(item.preco) || 0, quantidade: qtd };
        }
    });
    return Object.values(agrupado);
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function limparCarrinho() {
    localStorage.removeItem("carrinho");
}

function totalCarrinho(carrinho) {
    return carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
}

function quantidadeItensCarrinho(carrinho) {
    return carrinho.reduce((soma, item) => soma + item.quantidade, 0);
}

/* ---------------- SESSAO DO CLIENTE ---------------- */

function getClienteLogado() {
    try {
        return JSON.parse(localStorage.getItem("clienteLogado"));
    } catch (_) {
        return null;
    }
}

function salvarClienteLogado(cliente) {
    localStorage.setItem("clienteLogado", JSON.stringify(cliente));
}

function logoutCliente(destino = "index.html") {
    localStorage.removeItem("clienteLogado");
    window.location.href = destino;
}

/**
 * Bloqueia a pagina para quem nao fez login e manda para a tela de login,
 * que depois devolve o usuario para esta mesma pagina.
 */
function exigirLoginCliente(paginaAtual) {
    const cliente = getClienteLogado();
    if (!cliente) {
        window.location.href = `login.html?voltar=${encodeURIComponent(paginaAtual)}`;
    }
    return cliente;
}
