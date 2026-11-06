/* ==========================================================
   LOGIN DO ADMINISTRADOR
   ========================================================== */

// Ja logado? Vai direto para o painel.
if (getAdminLogado()) {
    window.location.href = "dashboard.html";
}

const formLogin = document.getElementById("loginForm");
const mensagemErro = document.getElementById("errorMessage");

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagemErro.classList.remove("show");

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    try {
        const admin = await apiFetch("/administradores/login", {
            method: "POST",
            body: JSON.stringify({ email, senha })
        });

        // Antes salvava so "true". Agora guarda o admin (sem senha) para mostrar o nome etc.
        salvarAdminLogado(admin);
        window.location.href = "dashboard.html";
    } catch (erro) {
        mensagemErro.textContent = erro.message;
        mensagemErro.classList.add("show");
    }
});
