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
    document.getElementById("carrinho-lateral").classList.add("ativo");
}

function fecharCarrinho() {
    document.getElementById("carrinho-lateral").classList.remove("ativo");
}

function irParaCatalogo() {
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

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
        lista.innerHTML = '<p class="vazio">Seu carrinho está vazio</p>';
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
            <button class="btn-remover" onclick="removerItem(${item.idMaterial})" aria-label="Remover">✕</button>
        </div>
    `).join("");
}

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
        container.innerHTML = "<p>Nenhum produto nesta categoria.</p>";
        return;
    }

    container.innerHTML = lista.map(produto => {
        const semEstoque = produto.quantidadeEstoque <= 0;
        const imagem = produto.urlImagem
            // onerror: se o link da imagem estiver quebrado, mostra o quadro dourado padrao
            ? `<img class="imagem" src="${escapeHtml(produto.urlImagem)}" alt="${escapeHtml(produto.nome)}"
                    onerror="this.outerHTML='<div class=&quot;imagem&quot;></div>'">`
            : `<div class="imagem"></div>`;

        return `
            <div class="card">
                ${imagem}
                <h3>${escapeHtml(produto.nome)}</h3>
                <p class="categoria-card">${escapeHtml(produto.categoria?.nome ?? "")}</p>
                <p>${formatarMoeda(produto.precoUnitario)} <small>/ unidade</small></p>
                <p class="estoque-card">${semEstoque ? "Indisponível" : `Estoque: ${produto.quantidadeEstoque} un.`}</p>
                <button onclick="adicionarCarrinho(${produto.idMaterial})" ${semEstoque ? "disabled" : ""}>
                    ${semEstoque ? "Indisponível" : "Adicionar ao Carrinho"}
                </button>
            </div>
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
            `<p style="color: red;">Erro ao carregar os produtos: ${escapeHtml(erro.message)}</p>`;
    }
}

/* ---------------- CLIENTE LOGADO ---------------- */

function mostrarAreaCliente() {
    const area = document.getElementById("area-cliente");
    const cliente = getClienteLogado();

    if (cliente) {
        const primeiroNome = escapeHtml(cliente.nome.split(" ")[0]);
        area.innerHTML = `Olá, ${primeiroNome} · <a href="#" onclick="logoutCliente('index.html'); return false;">Sair</a>`;
    } else {
        area.innerHTML = `<a href="clienteHTML/login.html?voltar=..%2Findex.html">Entrar</a>`;
    }
}

mostrarAreaCliente();
atualizarCarrinho();
buscarDadosDoBanco();
