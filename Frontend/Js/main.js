/* ==========================================================
   PAGINA INICIAL (index.html): catalogo + carrinho
   Depende de clienteJS/api.js (carregado antes no HTML).
   ========================================================== */

let produtos = [];        // materiais vindos da API
let categorias = [];      // categorias vindas da API
let categoriaAtiva = null; // null = "Todos"
let carrinho = lerCarrinho();

/* ---------------- CARRINHO LATERAL ---------------- */

function abrirCarrinho() {
    fecharMenu();
    document.body.classList.add("carrinho-aberto");
}

function fecharCarrinho() {
    document.body.classList.remove("carrinho-aberto");
}

// Esc fecha o carrinho
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharCarrinho();
});

function finalizarCompra() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio. Adicione produtos antes de finalizar.");
        return;
    }
    window.location.href = "clienteHTML/checkout.html";
}

function adicionarCarrinho(idMaterial) {
    const produto = produtos.find(p => p.idMaterial === idMaterial);
    if (!produto) return;

    const item = carrinho.find(i => i.idMaterial === idMaterial);
    const quantidadeAtual = item ? item.quantidade : 0;

    if (quantidadeAtual + 1 > produto.quantidadeEstoque) {
        alert(`Só temos ${produto.quantidadeEstoque} unidade(s) de "${produto.nome}".`);
        return;
    }

    if (item) {
        item.quantidade++;
    } else {
        carrinho.push({
            idMaterial: produto.idMaterial,
            nome: produto.nome,
            preco: Number(produto.precoUnitario),
            estoque: produto.quantidadeEstoque,
            quantidade: 1
        });
    }

    salvarCarrinho(carrinho);
    atualizarCarrinho();

    // Pequeno "pulo" no contador para mostrar que entrou no carrinho
    const contador = document.getElementById("contador");
    contador.classList.remove("pulou");
    void contador.offsetWidth;
    contador.classList.add("pulou");
}

function alterarQuantidade(idMaterial, delta) {
    const item = carrinho.find(i => i.idMaterial === idMaterial);
    if (!item) return;

    const novaQuantidade = item.quantidade + delta;
    if (novaQuantidade <= 0) {
        removerItem(idMaterial);
        return;
    }
    if (item.estoque && novaQuantidade > item.estoque) {
        alert(`Só temos ${item.estoque} unidade(s) de "${item.nome}".`);
        return;
    }

    item.quantidade = novaQuantidade;
    salvarCarrinho(carrinho);
    atualizarCarrinho();
}

function removerItem(idMaterial) {
    carrinho = carrinho.filter(i => i.idMaterial !== idMaterial);
    salvarCarrinho(carrinho);
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const lista = document.getElementById("itens-carrinho");
    document.getElementById("contador").textContent = quantidadeItensCarrinho(carrinho);
    document.getElementById("total").textContent =
        totalCarrinho(carrinho).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (carrinho.length === 0) {
        lista.innerHTML = '<p class="vazio">Seu carrinho está vazio.</p>';
        return;
    }

    lista.innerHTML = carrinho.map(item => `
        <div class="item-carrinho">
            <div>
                <strong>${escapeHtml(item.nome)}</strong>
                <p>${formatarMoeda(item.preco)} cada · subtotal ${formatarMoeda(item.preco * item.quantidade)}</p>
                <div class="controle-quantidade">
                    <button onclick="alterarQuantidade(${item.idMaterial}, -1)" aria-label="Diminuir">−</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${item.idMaterial}, 1)" aria-label="Aumentar">+</button>
                </div>
            </div>
            <button class="btn-remover" onclick="removerItem(${item.idMaterial})">Remover</button>
        </div>
    `).join("");
}

/* ---------------- MENU DO CELULAR ---------------- */

function alternarMenu() {
    const aberto = document.getElementById("menu").classList.toggle("aberto");
    document.getElementById("btn-menu").setAttribute("aria-expanded", aberto);
}

function fecharMenu() {
    document.getElementById("menu").classList.remove("aberto");
    document.getElementById("btn-menu").setAttribute("aria-expanded", "false");
}

// Ao tocar num link do menu, ele fecha
document.querySelectorAll("#menu > a").forEach(link => link.addEventListener("click", fecharMenu));

/* ---------------- CATALOGO ---------------- */

function carregarFiltros() {
    const filtros = document.getElementById("filtros");
    const botoes = [{ idCategoria: null, nome: "Todos" }, ...categorias];

    filtros.innerHTML = botoes.map(c => `
        <button class="${c.idCategoria === categoriaAtiva ? "ativo" : ""}"
                onclick="filtrarProdutos(${c.idCategoria})">
            ${escapeHtml(c.nome)}
        </button>
    `).join("");
}

function filtrarProdutos(idCategoria) {
    categoriaAtiva = idCategoria;
    carregarFiltros();

    // Antes comparava o objeto categoria com um texto ("Cadeiras"), entao nunca filtrava.
    const lista = idCategoria === null
        ? produtos
        : produtos.filter(p => p.categoria && p.categoria.idCategoria === idCategoria);

    carregarProdutos(lista);
}

function carregarProdutos(lista) {
    const container = document.getElementById("lista-produtos");

    if (lista.length === 0) {
        container.innerHTML = '<p class="mensagem-lista">Nenhum produto nesta categoria.</p>';
        return;
    }

    container.innerHTML = lista.map(produto => {
        const semEstoque = produto.quantidadeEstoque <= 0;
        const imagem = produto.urlImagem
            // onerror: se o link da imagem estiver quebrado, mostra o quadro padrao
            ? `<img class="produto-foto" src="${escapeHtml(produto.urlImagem)}" alt="${escapeHtml(produto.nome)}"
                    loading="lazy" onerror="this.outerHTML='<div class=&quot;produto-foto sem-foto&quot;></div>'">`
            : `<div class="produto-foto sem-foto"></div>`;

        return `
            <article class="produto">
                ${imagem}
                <div class="produto-info">
                    <span class="eyebrow">${escapeHtml(produto.categoria?.nome ?? "")}</span>
                    <h3>${escapeHtml(produto.nome)}</h3>
                    <p class="produto-preco">${formatarMoeda(produto.precoUnitario)} <small>/ unidade</small></p>
                    <p class="produto-estoque ${semEstoque ? "esgotado" : ""}">
                        ${semEstoque ? "Indisponível no momento" : `${produto.quantidadeEstoque} unidades no estoque`}
                    </p>
                    <button class="btn btn-contorno" onclick="adicionarCarrinho(${produto.idMaterial})" ${semEstoque ? "disabled" : ""}>
                        ${semEstoque ? "Indisponível" : "Adicionar ao carrinho"}
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

async function buscarDadosDoBanco() {
    try {
        [produtos, categorias] = await Promise.all([
            apiFetch("/materiais"),
            apiFetch("/categorias")
        ]);

        // Atualiza preco/estoque dos itens que ja estavam no carrinho
        // e remove os que nao existem mais.
        carrinho = carrinho
            .map(item => {
                const p = produtos.find(prod => prod.idMaterial === item.idMaterial);
                return p ? { ...item, nome: p.nome, preco: Number(p.precoUnitario), estoque: p.quantidadeEstoque } : null;
            })
            .filter(Boolean);
        salvarCarrinho(carrinho);
        atualizarCarrinho();

        carregarFiltros();
        carregarProdutos(produtos);
    } catch (erro) {
        console.error(erro);
        document.getElementById("lista-produtos").innerHTML =
            `<p class="mensagem-lista erro">Erro ao carregar os produtos: ${escapeHtml(erro.message)}</p>`;
    }
}

/* ---------------- CLIENTE LOGADO ---------------- */

function mostrarAreaCliente() {
    const cliente = getClienteLogado();
    let html;

    if (cliente) {
        const primeiroNome = escapeHtml(cliente.nome.split(" ")[0]);
        html = `Olá, ${primeiroNome} · <a href="#" onclick="logoutCliente('index.html'); return false;">Sair</a>`;
    } else {
        html = `<a href="clienteHTML/login.html?voltar=..%2Findex.html">Entrar</a>`;
    }

    // Mesmo conteudo no cabecalho (computador) e dentro do menu (celular)
    document.getElementById("area-cliente").innerHTML = html;
    document.getElementById("area-cliente-menu").innerHTML = html;
}

document.getElementById("ano").textContent = new Date().getFullYear();

mostrarAreaCliente();
atualizarCarrinho();
buscarDadosDoBanco();
