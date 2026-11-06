/* ==========================================================
   CONFIGURACAO DA API E FUNCOES COMUNS - TELAS ADMIN
   ========================================================== */

// O endereco do backend (API_BASE_URL) fica em Frontend/config.js

/**
 * Faz uma requisicao para a API e ja trata erros comuns.
 * Retorna o JSON da resposta (ou null se nao houver corpo).
 */
async function apiFetch(endpoint, options = {}) {
    let resposta;

    try {
        // Obs.: "...options" vem ANTES de headers. Na versao antiga vinha depois,
        // e se alguem passasse headers proprios o Content-Type sumia.
        resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (erro) {
        throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está rodando em " + API_BASE_URL);
    }

    const texto = await resposta.text();
    let corpo = null;
    try { corpo = texto ? JSON.parse(texto) : null; } catch (_) { corpo = texto; }

    if (!resposta.ok) {
        throw new Error((corpo && corpo.message) || `Erro ${resposta.status} ao acessar ${endpoint}`);
    }
    return corpo;
}

/* ---------------- AUTENTICACAO ---------------- */

function salvarAdminLogado(admin) {
    localStorage.setItem("adminLogado", JSON.stringify(admin));
}

function getAdminLogado() {
    try {
        const admin = JSON.parse(localStorage.getItem("adminLogado"));
        // versoes antigas salvavam so "true"; exige o objeto com id
        return admin && admin.idAdmin ? admin : null;
    } catch (_) {
        return null;
    }
}

function logoutAdmin() {
    localStorage.removeItem("adminLogado");
    window.location.href = "login.html";
}

/** Chame no topo de cada tela protegida. */
function exigirLogin() {
    if (!getAdminLogado()) {
        window.location.href = "login.html";
    }
}

/** Liga o botao SAIR e o modal de confirmacao (igual em todas as telas). */
function configurarLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    const modal = document.getElementById("logoutModal");

    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.add("show");
    });
    document.getElementById("cancelLogout")?.addEventListener("click", () => modal.classList.remove("show"));
    // Antes so redirecionava, sem apagar o login -> dava pra voltar ao painel.
    document.getElementById("confirmLogout")?.addEventListener("click", logoutAdmin);
}

/* ---------------- FORMATACAO ---------------- */

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

/** "25/12/2026" -> Date */
function parseDataBR(texto) {
    if (!texto || typeof texto !== "string") return null;
    const [dia, mes, ano] = texto.split("/").map(Number);
    return ano ? new Date(ano, mes - 1, dia) : null;
}

function escapeHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const STATUS_RESERVA = ["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"];

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

function badgeStatus(status) {
    return `<span class="status ${(status || "").toLowerCase()}">${nomeStatus(status)}</span>`;
}

/**
 * Receita do mes = soma das reservas NAO canceladas cujo evento e no mes atual.
 * (Antes somava todas as reservas de todos os tempos, inclusive canceladas.)
 */
function calcularReceitaDoMes(reservas) {
    const hoje = new Date();
    return reservas
        .filter(r => r.status !== "CANCELADO")
        .filter(r => {
            const data = parseDataBR(r.dataEvento);
            return data && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
        })
        .reduce((soma, r) => soma + Number(r.valorTotal || 0), 0);
}
