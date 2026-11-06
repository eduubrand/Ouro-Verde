# Guia de Deploy (publicar na internet de graça)

Vamos usar três serviços gratuitos:

| Parte | Serviço | Endereço final (exemplo) |
|---|---|---|
| Banco PostgreSQL | **Neon** (neon.tech) | `ep-xxxx.sa-east-1.aws.neon.tech` |
| Backend Java | **Render** (render.com) | `https://ouro-verde-api.onrender.com` |
| Site (HTML/CSS/JS) | **Netlify** (netlify.com) | `https://ouro-verde.netlify.app` |

Faça **na ordem**: banco → backend → site. Cada etapa usa o endereço da anterior.
Tempo total: uns 30 minutos. Nenhum dos três pede cartão de crédito no plano grátis.

> O código já está preparado: o backend lê banco e porta por variáveis de ambiente,
> e o site escolhe sozinho entre o backend local e o publicado (arquivo `Frontend/config.js`).

---

## Passo 0 — Colocar o código no GitHub

O Render pega o código do GitHub. No repositório da equipe, envie todas as alterações:

```bash
git add -A
git commit -m "Corrige funcionalidades e prepara deploy"
git push
```

(Ou crie um repositório novo no GitHub e envie a pasta `Projeto-Ouro-Verde-main` inteira.)

---

## Passo 1 — Banco no Neon

1. Acesse **neon.tech** → *Sign up* (pode entrar com o GitHub).
2. *Create project*: nome `ouro-verde`, região **São Paulo (sa-east-1)** se aparecer, Postgres 16 ou 17.
3. No menu da esquerda, abra **SQL Editor**.
4. Abra o arquivo `script_banco.sql` do projeto, copie **tudo**, cole no editor e clique em **Run**.
   Deve aparecer sucesso. Para conferir, rode `SELECT * FROM material;` — aparecem os 5 produtos.
5. Clique em **Connect** (ou *Connection Details*). Aparece algo assim:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   Separe as partes — você vai precisar delas no Render:

   | Pedaço | Exemplo | Vira a variável |
   |---|---|---|
   | depois de `//` até `:` | `neondb_owner` | `DB_USER` |
   | entre `:` e `@` | `AbC123xyz` | `DB_PASSWORD` |
   | depois do `@` até o fim | `ep-cool-name-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require` | vai no `DB_URL` |

   O `DB_URL` é `jdbc:postgresql://` + a última parte:
   ```
   jdbc:postgresql://ep-cool-name-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   ⚠ Não coloque usuário e senha dentro do `DB_URL`. Eles vão nas variáveis próprias.

---

## Passo 2 — Backend no Render

1. Acesse **render.com** → *Get Started* → entre com o **GitHub**.
2. *New +* → **Web Service** → escolha o repositório do projeto (autorize o acesso se pedir).
3. Preencha:

   | Campo | Valor |
   |---|---|
   | Name | `ouro-verde-api` (vira parte do endereço) |
   | Region | a mais próxima disponível |
   | Branch | `main` |
   | **Root Directory** | `backend` |
   | **Language / Runtime** | `Docker` |
   | **Instance Type** | `Free` |

4. Em **Environment Variables** adicione as três do passo 1:
   ```
   DB_URL       jdbc:postgresql://ep-....neon.tech/neondb?sslmode=require
   DB_USER      neondb_owner
   DB_PASSWORD  (sua senha do Neon)
   ```
   Não precisa criar `PORT`: o Render define sozinho e o backend já usa.
5. *Create Web Service*. O primeiro build demora **5 a 10 minutos** (ele baixa o Maven e compila).
   Acompanhe em *Logs*. Quando aparecer `Started BackendApplication`, está no ar.
6. Copie o endereço no topo da página (ex.: `https://ouro-verde-api.onrender.com`) e teste no navegador:
   ```
   https://ouro-verde-api.onrender.com/api/materiais
   ```
   Tem que aparecer o JSON com os produtos.

---

## Passo 3 — Apontar o site para o backend

Abra `Frontend/config.js` e troque **só esta linha** pelo endereço do Render (sem `/api` e sem barra no final):

```js
const URL_BACKEND_PRODUCAO = "https://ouro-verde-api.onrender.com";
```

No seu computador nada muda: em `localhost` o site continua usando `http://localhost:8080`.

Envie a alteração para o GitHub (`git add`, `commit`, `push`).

---

## Passo 4 — Site no Netlify

**Opção A — ligado ao GitHub (recomendado: atualiza sozinho a cada `git push`)**
1. Acesse **netlify.com** → *Sign up* com o GitHub.
2. *Add new site* → **Import an existing project** → GitHub → escolha o repositório.
3. Preencha:

   | Campo | Valor |
   |---|---|
   | Base directory | `Frontend` |
   | Build command | *(deixe vazio)* |
   | Publish directory | `Frontend` |

4. *Deploy*. Em segundos sai um endereço como `https://nome-aleatorio.netlify.app`.
5. Para um nome melhor: *Site configuration* → *Change site name* → `ouro-verde` (se estiver livre).

**Opção B — arrastar a pasta (mais rápido, mas manual)**
1. Entre na sua conta Netlify **antes** (sem login, o site some em 1 hora).
2. Vá em *Sites* → arraste a pasta `Frontend` para a área "drag and drop".
3. A cada mudança no site, arraste a pasta de novo.

---

## Passo 5 — Testar tudo publicado

1. Abra o endereço do Netlify. Se os produtos demorarem, **espere até 1 minuto** (o Render está "acordando", veja abaixo).
2. Faça um pedido completo como cliente (crie uma conta).
3. Abra `https://SEU-SITE.netlify.app/adminHTML/login.html` → `admin@ouroverde.com` / `123456` → confira o pedido.
4. **Troque a senha do admin** antes de divulgar o link (o padrão `123456` está no GitHub). No SQL Editor do Neon:
   ```sql
   UPDATE administrador SET senha = 'umaSenhaForte' WHERE email = 'admin@ouroverde.com';
   ```

---

## Limitações do plano grátis (importante saber)

- **O backend dorme.** Sem acesso por ~15 minutos, o Render desliga o backend. A próxima visita demora
  ~50 segundos e o site mostra "Carregando..." ou erro de conexão nesse meio-tempo.
  **Antes de apresentar, abra o site 1–2 minutos antes** (ou acesse `/api/materiais`) para acordá-lo.
- **Neon também pausa** o banco sem uso, mas acorda em menos de 1 segundo — não dá para perceber.
- **Segurança:** as senhas ficam salvas sem criptografia e a API não exige token
  (ver seção 8 do `GUIA_IMPLEMENTACAO.md`). Use só dados de teste; não cadastre clientes reais.

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Build do Render falha em `mvn` com erro de download | Internet do Render oscilou | *Manual Deploy* → *Deploy latest commit* |
| Log do Render: `Connection refused` ou `password authentication failed` | Variáveis do banco erradas | Confira `DB_URL` (começa com `jdbc:postgresql://`, termina com `?sslmode=require`), `DB_USER` e `DB_PASSWORD` |
| Log: `relation "material" does not exist` | Script não foi rodado no Neon | Passo 1, item 4 |
| Site abre mas diz "Não foi possível conectar ao servidor" | `config.js` com endereço errado, ou backend dormindo | Confira `URL_BACKEND_PRODUCAO`; espere 1 minuto e recarregue |
| Mudei o site e nada mudou | Cache do navegador | **Ctrl+F5** |
| Render: *Out of memory* | 512 MB é pouco | Já limitamos o Java a 75% da memória no `Dockerfile`; faça redeploy. Se persistir, veja os logs |

## Atualizações depois de publicado

- **Mudou o site?** `git push` → Netlify atualiza sozinho (Opção A).
- **Mudou o Java?** `git push` → Render recompila sozinho (*Auto-Deploy*, ligado por padrão).
- **Mudou a estrutura do banco?** Rode o `ALTER TABLE` correspondente no SQL Editor do Neon.
  Não rode o `script_banco.sql` de novo: ele **apaga todos os dados** antes de recriar as tabelas.
