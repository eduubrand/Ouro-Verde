# Guia de Implementação — Ouro Verde

Este guia explica **como rodar**, **como o sistema funciona por dentro** e **como implementar coisas novas** nele.
Ele substitui o antigo `GUIA_CONEXAO_ADMIN.md`.

---

## 1. Visão geral

```
 Navegador (HTML/CSS/JS puro)                 Backend (Java 25 + Spring Boot 4)            Banco
 ┌──────────────────────────────┐   fetch()   ┌─────────────────────────────────┐   JPA   ┌────────────┐
 │ index.html  (catálogo/cart)  │ ──────────► │ controller/  recebe HTTP        │ ──────► │ PostgreSQL │
 │ clienteHTML/ login, checkout,│   JSON      │ service/     regras de negócio  │         │ ouro_verde │
 │   meusPedidos, sucesso       │ ◄────────── │ repository/  consultas ao banco │ ◄────── │            │
 │ adminHTML/ login, dashboard, │             │ model/       tabelas como classes│        └────────────┘
 │   pedidos, produtos          │             │ exception/   erros → JSON       │
 └──────────────────────────────┘             └─────────────────────────────────┘
        porta 5500 (ou arquivo)                        porta 8080 (/api/...)               porta 5432
```

Cada tela do frontend chama a API usando a função `apiFetch()` (em `clienteJS/api.js` e `adminJS/api.js`).
O backend responde em JSON. Se der erro, responde `{ "message": "explicação" }` e o frontend mostra essa mensagem.

---

## 2. O que estava quebrado e foi corrigido

### Backend
| Problema | Efeito | Correção |
|---|---|---|
| `application.properties` com marcadores de conflito do git (`<<<<<<< HEAD`) | **Backend não subia** | Conflito resolvido; senha do banco agora vem de variável de ambiente (`DB_PASSWORD`), sem precisar editar o arquivo |
| `springdoc 2.5.0` (duas vezes no `pom.xml`) é para Spring Boot 3 | Erro ao iniciar com Spring Boot 4 | Uma única dependência, versão 3.0.0 |
| Duas classes de CORS (`CorsConfig` e `WebConfig`) | Configuração duplicada/conflitante | Mantido só `WebConfig` |
| Reserva **diminuía o estoque para sempre** | Depois de alguns aluguéis os produtos "acabavam", mesmo devolvidos | Estoque = quantidade que a empresa possui. A disponibilidade é calculada **por data**: estoque − o que já está reservado (não cancelado) naquele dia |
| Itens repetidos no pedido | Erro de chave duplicada no banco | Itens do mesmo material são somados |
| Parcelas arredondadas (`100 / 3 = 33,33 × 3 = 99,99`) | Sumia dinheiro | A sobra de centavos vai para a 1ª parcela |
| Reserva cancelada podia ser "reativada" | Itens já liberados para outra pessoa voltavam a ser usados | `CANCELADO` e `CONCLUIDO` são finais |
| Status aceitava qualquer texto | Status inválidos no banco | Só aceita `PENDENTE, CONFIRMADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO` |
| Erros viravam `500` genérico | Frontend não sabia o que dizer | `GlobalExceptionHandler` devolve 400/401/404/409/422 com mensagem |
| Não havia cadastro/login de cliente (UC01/UC02) | Todas as reservas iam para o cliente **ID 1** | `POST /api/clientes` e `POST /api/clientes/login` |
| Excluir produto/categoria em uso | Erro 500 de chave estrangeira | Mensagem explicando o motivo |
| `PUT` de material não salvava a imagem; `PUT` de admin sem senha apagava a senha | Dados perdidos | Corrigido |
| `@Data` do Lombok em relações bidirecionais | Risco de `StackOverflowError` em `toString/hashCode` | `@ToString.Exclude` / `@EqualsAndHashCode.Exclude` |
| Tabela `administrador` em script separado; `implementacao_ouro_verde.sql` desatualizado | Banco montado errado | Tudo em um único `script_banco.sql` |
| `Dockerfile` usava imagem `openjdk:25` (não existe) e o compose tinha senhas diferentes | Docker não funcionava | Dockerfile em 2 etapas e `docker-compose.yml` na raiz que sobe banco + backend + frontend |

### Frontend do cliente
| Problema | Correção |
|---|---|
| **Checkout mandava `materiais`/`quantidade`, o Java esperava `itens`/`quantidadeAlocada`** → toda reserva era gravada **sem itens** | Payload corrigido |
| Checkout sempre usava `idCliente: 1` e `idServico: 1` (cobrava R$ 1.500 do salão em todo aluguel de cadeira) | Cliente logado + escolha do espaço (inclui "Somente Locação de Materiais", R$ 0) |
| `index.html` apontava para `css/` e `js/`, mas as pastas são `Css/` e `Js/` | Funciona no Windows, quebra em servidor Linux. Caminhos corrigidos |
| Filtro de categorias comparava objeto com texto fixo ("Cadeiras") → nunca filtrava | Categorias vêm da API e o filtro usa o ID |
| Imagens dos produtos não apareciam | Usa `urlImagem` |
| Carrinho sem quantidade (cada clique duplicava o item) e sem limite de estoque (UC04) | Botões `+`/`−`, subtotal e limite pelo estoque |
| Nome de produto com aspas quebrava o botão (`onclick="...('Sofá d'água')"`) | Texto escapado com `escapeHtml()` |
| Dois catálogos: `index.html` (real) e `clienteHTML/catalogo.html` (produtos falsos, imagens inexistentes) | Removido o falso |
| Data final do checkout era ignorada; entrega/retirada não existia (UC05) | Data do evento + entrega/retirada, salvos no banco |
| "Meus Pedidos" mostrava os pedidos de **todos** os clientes | Só os do cliente logado, com itens e parcelas |
| Forma de pagamento e parcelas não eram enviadas | Salvas na reserva; página de sucesso mostra o resumo financeiro |

### Painel admin
| Problema | Correção |
|---|---|
| "Sair" no dashboard e produtos só redirecionava (continuava logado) | `configurarLogout()` apaga a sessão |
| Login guardava `"true"` | Guarda o objeto do admin |
| Página **Pedidos** não tinha link no menu | Menu: Dashboard / Pedidos / Produtos |
| Coluna "Entrega" repetia a data do evento | Mostra Entrega/Retirada |
| "Receita mensal" somava todas as reservas de todos os tempos, inclusive canceladas | Soma as reservas não canceladas com evento no mês atual |
| Status alterado por `prompt()` digitando texto | Modal com detalhes, itens, parcelas e `<select>` de status |
| Não havia como registrar pagamento manual (extend do UC09) | Botão "Registrar pagamento" por parcela (1º pagamento confirma o pedido) |
| Produto: campo imagem ignorado, sem edição, cards vazios | Cadastro com imagem, edição, cards com números |
| Não havia gestão de categorias (UC07) | Adicionar, renomear e excluir categorias |

---

## 3. Como rodar

### Opção A — Docker (recomendado, 1 comando)
Precisa só do **Docker Desktop** aberto.

```bash
docker compose up --build
```

| O quê | Endereço |
|---|---|
| Site do cliente | http://localhost:5500 |
| Painel admin | http://localhost:5500/adminHTML/login.html |
| API | http://localhost:8080/api/materiais |
| Swagger (documentação da API) | http://localhost:8080/swagger-ui.html |

- Admin: `admin@ouroverde.com` / `123456`
- Cliente de teste: `larissa@email.com` / `senha123` (ou crie uma conta)

> O script `script_banco.sql` roda **só na primeira vez** que o volume do banco é criado.
> Para zerar o banco: `docker compose down -v` e depois `docker compose up --build`.
> Se a porta 5432 já estiver ocupada por outro Postgres, defina `DB_PORT=5434` antes do `up`.
> Mudou um `.js`/`.css` e o navegador não pegou a alteração? Recarregue com **Ctrl+F5** (limpa o cache).
> Mudou código Java? Rode de novo `docker compose up --build`.

### Opção B — Manual (sem Docker)
Precisa de **PostgreSQL** e **JDK 25** instalados.

1. Banco:
   ```bash
   psql -U postgres -c "CREATE DATABASE ouro_verde;"
   psql -U postgres -d ouro_verde -f script_banco.sql
   ```
2. Backend (na pasta `backend`). Se a senha do seu Postgres não for `postgres`, informe-a pela variável de ambiente:
   - Windows (PowerShell): `$env:DB_PASSWORD="minhaSenha"; .\mvnw.cmd spring-boot:run`
   - Linux/Mac: `DB_PASSWORD=minhaSenha ./mvnw spring-boot:run`
3. Frontend: abra a pasta `Frontend` com a extensão **Live Server** do VS Code (porta 5500) ou dê dois cliques no `index.html`.

---

## 4. Roteiro de teste (para apresentar)

**Cliente**
1. Abra o site → filtre por categoria → adicione itens e use `+`/`−` no carrinho.
2. "Finalizar Compra" → como não está logado, vai para o login → crie uma conta.
3. No checkout escolha espaço, data, entrega/retirada, forma de pagamento e parcelas.
   Ao escolher a data aparece se os itens estão disponíveis.
4. Finalize → página de sucesso com código e parcelas → "Ver pedidos".
5. Tente reservar mais unidades do que existem na mesma data → mensagem de estoque insuficiente.

**Admin**
1. Login → Dashboard mostra receita do mês, produtos e pendentes.
2. Pedidos → filtre por status → "Ver" → registre o pagamento de uma parcela (pedido vira *Confirmado*).
3. Mude o status para *Em andamento* (entregue) e depois *Concluído* (devolvido).
4. Cancele outro pedido → os itens voltam a ficar disponíveis naquela data.
5. Produtos → cadastre/edite um produto com imagem → ele aparece no site. Crie uma categoria.

---

## 5. Como o código funciona

### 5.1 Backend em camadas
```
backend/src/main/java/com/ouroverde/backend/
├── model/        Entidades JPA = tabelas (Reserva, Material, Cliente...)
├── repository/   Interfaces que o Spring transforma em SQL
├── service/      ReservaService: TODA a regra de negócio da reserva
├── controller/   Endpoints REST (/api/...)
├── dto/          Formatos de entrada que não são uma tabela (ex.: ReservaRequestDTO)
├── exception/    Exceções de negócio + GlobalExceptionHandler
└── config/       WebConfig (CORS: permite o navegador chamar a API)
```

**Por que um `service`?** O controller deve só "traduzir" HTTP ↔ Java. Quando a lógica cresce
(validar, verificar estoque, calcular total, gerar parcelas), ela vai para o service. Fica fácil de ler e de testar.

### 5.2 Model (entidade)
```java
@Entity @Table(name = "reserva")
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idReserva;                 // vira a coluna id_reserva

    @ManyToOne @JoinColumn(name = "id_cliente")
    private Cliente cliente;                   // chave estrangeira

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL)
    private List<ReservaMaterial> itens;       // salvar a reserva salva os itens junto
}
```
O Spring converte `camelCase` em `snake_case` sozinho (`dataEvento` → `data_evento`).

### 5.3 Repository
```java
public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
    List<Reserva> findByClienteIdClienteOrderByIdReservaDesc(Integer idCliente);
}
```
Você não escreve SQL: o **nome do método** vira a consulta
(`findBy` + `Cliente.idCliente` + `OrderBy idReserva Desc`). Para consultas mais complexas usa-se `@Query`
(veja `ReservaMaterialRepository.somarReservadoNaData`).

### 5.4 A regra mais importante: disponibilidade por data
```java
long reservado  = reservaMaterialRepository.somarReservadoNaData(idMaterial, dataEvento);
long disponivel = material.getQuantidadeEstoque() - reservado;
if (quantidade > disponivel) throw new EstoqueInsuficienteException(...);
```
É aluguel: a cadeira volta depois da festa. Por isso **não** se subtrai do estoque — conta-se quantas
estão comprometidas naquela data. Cancelou? A consulta ignora reservas `CANCELADO`, e os itens ficam livres de novo.

### 5.5 Erros padronizados
```java
throw new RegraNegocioException("A data do evento não pode estar no passado.");
```
O `GlobalExceptionHandler` transforma isso em `HTTP 400 {"message": "A data do evento..."}`
e o `apiFetch` do frontend lança um `Error` com essa mensagem, que vira um `alert` ou texto na tela.

### 5.6 Frontend
- `clienteJS/api.js` e `adminJS/api.js`: URL da API, `apiFetch`, formatação, sessão (localStorage).
- Carrinho no `localStorage`: `[{ idMaterial, nome, preco, quantidade, estoque }]`.
- Sempre que um texto do banco vai para o HTML, passe por `escapeHtml()`.

**Visual (CSS)** — são só 3 arquivos:

| Arquivo | Usado por | O que tem |
|---|---|---|
| `Css/base.css` | todas as páginas | cores e fontes (variáveis no `:root`), botões `.btn`, campos `.campo`, tabelas `.tabela`, status, modal |
| `Css/style.css` | site do cliente | cabeçalho, hero, catálogo, carrinho, checkout, login, pedidos, sucesso |
| `adminCSS/admin.css` | painel admin | barra lateral, indicadores, formulários, detalhes do pedido, login do admin |

- Para mudar uma cor no site inteiro, troque a variável em `base.css` (ex.: `--verde-700`).
- **Responsivo:** cada arquivo termina com um bloco `RESPONSIVO` (`@media`). Pontos de quebra: 900px (tablet: menu vira botão, barra do admin vai para o topo) e 600/720px (celular).
- Tabelas com `class="tabela responsiva"` viram cartões no celular. O rótulo de cada linha do cartão vem do cabeçalho da tabela, copiado sozinho por `rotularTabelas()` (no `api.js`). Uma tabela nova só precisa da classe.

---

## 6. Endpoints da API

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/materiais` | catálogo |
| GET | `/api/materiais/disponibilidade?data=2026-12-20` | unidades livres por produto na data |
| POST / PUT / DELETE | `/api/materiais[/{id}]` | admin: produtos |
| GET / POST / PUT / DELETE | `/api/categorias[/{id}]` | categorias |
| GET / POST / PUT / DELETE | `/api/servicos[/{id}]` | espaços/serviços |
| POST | `/api/clientes` | cadastro do cliente |
| POST | `/api/clientes/login` | login do cliente |
| POST | `/api/administradores/login` | login do admin |
| POST | `/api/reservas` | criar reserva (corpo em `ReservaRequestDTO`) |
| GET | `/api/reservas` | todas (admin) |
| GET | `/api/reservas/cliente/{idCliente}` | "Meus Pedidos" |
| PATCH | `/api/reservas/{id}/status?novoStatus=CONFIRMADO` | mudar status |
| PATCH | `/api/reservas/{id}/parcelas/{n}/pagar` | registrar pagamento |

Exemplo de criação de reserva:
```json
{
  "idCliente": 1, "idServico": 1, "dataEvento": "2026-12-20",
  "tipoEntrega": "ENTREGA", "formaPagamento": "PIX", "quantidadeParcelas": 2,
  "itens": [ { "idMaterial": 2, "quantidadeAlocada": 10 } ]
}
```

---

## 7. Exercício guiado: implementando uma funcionalidade do zero

O UC08 pede **descrição** no produto, e isso ainda não existe. É um ótimo exercício porque passa por todas as camadas.

**Passo 1 — Banco** (`script_banco.sql`, tabela `material`):
```sql
descricao TEXT,
```
Com `ddl-auto=update` o Hibernate também criaria a coluna sozinho, mas mantenha o script atualizado.

**Passo 2 — Model** (`model/Material.java`):
```java
@Column(columnDefinition = "TEXT")
private String descricao;
```
O Lombok (`@Data`) já gera `getDescricao()` e `setDescricao()`.

**Passo 3 — Controller** (`MaterialController.atualizarMaterial`): o `POST` já salva o objeto inteiro,
mas o `PUT` copia campo por campo, então adicione:
```java
material.setDescricao(dados.getDescricao());
```

**Passo 4 — Admin** (`adminHTML/produtos.html` + `adminJS/produtos.js`):
```html
<div class="form-group description-field">
    <label for="descricao">DESCRIÇÃO</label>
    <textarea id="descricao"></textarea>
</div>
```
```js
// no objeto "material" do submit:
descricao: document.getElementById("descricao").value.trim(),
// em editarProduto():
document.getElementById("descricao").value = m.descricao ?? "";
```

**Passo 5 — Site** (`Js/main.js`, dentro de `carregarProdutos`):
```js
<p class="descricao-card">${escapeHtml(produto.descricao ?? "")}</p>
```

**Passo 6 — Testar:** reinicie o backend, edite um produto no admin, confira no site e em
`http://localhost:8080/api/materiais`.

Esse mesmo roteiro (banco → model → repository/service → controller → JS → HTML) serve para qualquer funcionalidade nova.

---

## 8. Limitações conhecidas / próximos passos

1. **Senhas em texto puro** no banco. Próximo passo: guardar o hash com `BCryptPasswordEncoder`
   (dependência `spring-security-crypto`) no cadastro e usar `encoder.matches(...)` no login.
2. **Sessão só no navegador** (localStorage), sem token. Qualquer um que conheça a API consegue chamá-la.
   Próximo passo: Spring Security + JWT e proteger as rotas de admin.
3. **Imagem por URL**: não há upload de arquivo.
4. **Disponibilidade por dia**: um item reservado para o dia 20 está livre no dia 21. Se a empresa precisar
   de aluguel por período (ex.: 3 dias), troque `data_evento` por `data_inicio`/`data_fim` e a consulta
   `somarReservadoNaData` por uma verificação de sobreposição de datas.
5. **Testes automatizados**: o `BackendApplicationTests` só verifica se o contexto sobe. Um bom começo é testar o
   `ReservaService` (estoque insuficiente, divisão de parcelas, status finais).
