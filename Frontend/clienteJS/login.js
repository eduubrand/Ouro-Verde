/* ==========================================================
   LOGIN E CADASTRO DO CLIENTE
   ========================================================== */

/**
 * Para onde ir depois de entrar. Vem da URL: login.html?voltar=checkout.html
 * So aceita nomes simples de pagina (evita redirecionar para outro site).
 */
function paginaDeRetorno() {
    const voltar = new URLSearchParams(window.location.search).get("voltar");
    if (voltar && /^(\.\.\/)?[A-Za-z]+\.html$/.test(voltar)) {
        return voltar;
    }
    return "../index.html";
}

function entrarComo(cliente) {
    salvarClienteLogado(cliente);
    window.location.href = paginaDeRetorno();
}

function valor(id) {
    return document.getElementById(id).value.trim();
}

// Se ja esta logado, nao precisa ver esta tela.
if (getClienteLogado()) {
    window.location.href = paginaDeRetorno();
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("erro-login");
    erro.textContent = "";

    try {
        const cliente = await apiFetch("/clientes/login", {
            method: "POST",
            body: JSON.stringify({ email: valor("login-email"), senha: document.getElementById("login-senha").value })
        });
        entrarComo(cliente);
    } catch (err) {
        erro.textContent = err.message;
    }
});

document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("erro-cadastro");
    erro.textContent = "";

    const dados = {
        nome: valor("cad-nome"),
        cpfCnpj: valor("cad-cpf"),
        telefone: valor("cad-telefone"),
        email: valor("cad-email"),
        senha: document.getElementById("cad-senha").value,
        rua: valor("cad-rua"),
        numero: valor("cad-numero"),
        bairro: valor("cad-bairro"),
        cidade: valor("cad-cidade"),
        cep: valor("cad-cep")
    };

    try {
        const cliente = await apiFetch("/clientes", { method: "POST", body: JSON.stringify(dados) });
        alert("Conta criada com sucesso!");
        entrarComo(cliente);
    } catch (err) {
        erro.textContent = err.message;
    }
});
