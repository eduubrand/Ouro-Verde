/* ==========================================================
   PRODUTOS (UC08) E CATEGORIAS (UC07)
   ========================================================== */

configurarLogout();

let materiais = [];
let categorias = [];

const form = document.getElementById("produtoForm");
const produtosTbody = document.getElementById("produtosTable");
const selectCategoria = document.getElementById("categoria");

/* ---------------- CARREGAR DADOS ---------------- */

async function carregarTudo() {
    produtosTbody.innerHTML = `<tr><td colspan="7" class="celula-aviso">Carregando...</td></tr>`;
    try {
        [materiais, categorias] = await Promise.all([apiFetch("/materiais"), apiFetch("/categorias")]);
        renderizarCategorias();
        renderizarProdutos();
        renderizarCards();
    } catch (erro) {
        produtosTbody.innerHTML = `<tr><td colspan="7" class="celula-erro">${escapeHtml(erro.message)}</td></tr>`;
    }
}

function renderizarCards() {
    document.getElementById("totalProdutos").textContent = materiais.length;
    document.getElementById("semEstoque").textContent = materiais.filter(m => m.quantidadeEstoque <= 0).length;
    document.getElementById("totalCategorias").textContent = categorias.length;
}

function renderizarProdutos() {
    if (materiais.length === 0) {
        produtosTbody.innerHTML = `<tr><td colspan="7" class="celula-aviso">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    produtosTbody.innerHTML = materiais.map(m => `
        <tr>
            <td>${m.idMaterial}</td>
            <td>${m.urlImagem ? `<img class="miniatura" src="${escapeHtml(m.urlImagem)}" alt="">` : "-"}</td>
            <td>${escapeHtml(m.nome)}</td>
            <td>${escapeHtml(m.categoria?.nome ?? "-")}</td>
            <td>${formatarMoeda(m.precoUnitario)}</td>
            <td>${m.quantidadeEstoque}</td>
            <td><div class="acoes-celula">
                <button class="btn-action" onclick="editarProduto(${m.idMaterial})">Editar</button>
                <button class="btn-action excluir" onclick="excluirProduto(${m.idMaterial})">Excluir</button>
            </div></td>
        </tr>
    `).join("");
}

/* ---------------- CADASTRAR / EDITAR PRODUTO ---------------- */

function editarProduto(id) {
    const m = materiais.find(x => x.idMaterial === id);
    if (!m) return;

    document.getElementById("idEdicao").value = m.idMaterial;
    document.getElementById("nome").value = m.nome;
    document.getElementById("categoria").value = m.categoria?.idCategoria ?? "";
    document.getElementById("preco").value = m.precoUnitario;
    document.getElementById("estoque").value = m.quantidadeEstoque;
    document.getElementById("imagem").value = m.urlImagem ?? "";

    document.getElementById("tituloForm").textContent = `Editando produto #${m.idMaterial}`;
    document.getElementById("btnSalvar").textContent = "Salvar alterações";
    document.getElementById("btnCancelar").style.display = "inline-flex";
    form.scrollIntoView({ behavior: "smooth" });
}

function sairDoModoEdicao() {
    form.reset();
    document.getElementById("idEdicao").value = "";
    document.getElementById("tituloForm").textContent = "Novo produto";
    document.getElementById("btnSalvar").textContent = "Adicionar produto";
    document.getElementById("btnCancelar").style.display = "none";
}

document.getElementById("btnCancelar").addEventListener("click", sairDoModoEdicao);

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idEdicao = document.getElementById("idEdicao").value;
    const material = {
        nome: document.getElementById("nome").value.trim(),
        precoUnitario: Number(document.getElementById("preco").value),
        quantidadeEstoque: Number(document.getElementById("estoque").value),
        categoria: { idCategoria: Number(selectCategoria.value) },
        // Antes o campo de imagem era ignorado e nunca ia para o banco.
        urlImagem: document.getElementById("imagem").value.trim() || null
    };

    try {
        if (idEdicao) {
            await apiFetch(`/materiais/${idEdicao}`, { method: "PUT", body: JSON.stringify(material) });
            alert("Produto atualizado!");
        } else {
            await apiFetch("/materiais", { method: "POST", body: JSON.stringify(material) });
            alert("Produto cadastrado!");
        }
        sairDoModoEdicao();
        carregarTudo();
    } catch (erro) {
        alert("Erro ao salvar: " + erro.message);
    }
});

async function excluirProduto(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
        await apiFetch(`/materiais/${id}`, { method: "DELETE" });
        carregarTudo();
    } catch (erro) {
        alert(erro.message);
    }
}

/* ---------------- CATEGORIAS (UC07) ---------------- */

function renderizarCategorias() {
    const selecionada = selectCategoria.value;
    selectCategoria.innerHTML = `<option value="">Selecione...</option>` +
        categorias.map(c => `<option value="${c.idCategoria}">${escapeHtml(c.nome)}</option>`).join("");
    selectCategoria.value = selecionada;

    document.getElementById("listaCategorias").innerHTML = categorias.map(c => `
        <span class="categoria-chip">
            ${escapeHtml(c.nome)}
            <button title="Renomear" onclick="renomearCategoria(${c.idCategoria})">✎</button>
            <button title="Excluir" onclick="excluirCategoria(${c.idCategoria})">✕</button>
        </span>
    `).join("");
}

document.getElementById("categoriaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const campo = document.getElementById("nomeCategoria");
    try {
        await apiFetch("/categorias", { method: "POST", body: JSON.stringify({ nome: campo.value.trim() }) });
        campo.value = "";
        carregarTudo();
    } catch (erro) {
        alert(erro.message);
    }
});

async function renomearCategoria(id) {
    const categoria = categorias.find(c => c.idCategoria === id);
    const novoNome = prompt("Novo nome da categoria:", categoria?.nome ?? "");
    if (!novoNome || !novoNome.trim()) return;

    try {
        await apiFetch(`/categorias/${id}`, { method: "PUT", body: JSON.stringify({ nome: novoNome.trim() }) });
        carregarTudo();
    } catch (erro) {
        alert(erro.message);
    }
}

async function excluirCategoria(id) {
    if (!confirm("Excluir esta categoria?")) return;
    try {
        await apiFetch(`/categorias/${id}`, { method: "DELETE" });
        carregarTudo();
    } catch (erro) {
        alert(erro.message);
    }
}

carregarTudo();
