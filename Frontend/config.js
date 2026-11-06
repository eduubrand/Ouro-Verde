/* ==========================================================
   CONFIGURACAO DO ENDERECO DO BACKEND (unico lugar para mudar)
   ==========================================================
   - Rodando no seu computador (localhost ou abrindo o arquivo),
     o site usa o backend local: http://localhost:8080
   - Publicado na internet (Netlify), usa o backend do Render.

   >>> Depois de publicar o backend no Render, cole o endereco
   >>> dele abaixo (sem barra no final e sem /api).
   ========================================================== */

const URL_BACKEND_PRODUCAO = "https://ouro-verde-api.onrender.com";

const RODANDO_LOCAL =
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1"].includes(location.hostname);

const API_BASE_URL = RODANDO_LOCAL
    ? "http://localhost:8080/api"
    : `${URL_BACKEND_PRODUCAO}/api`;
