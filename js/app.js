// TROCAR TEMA (Usando o padrão do Bootstrap 5.3)
const btnTema = document.getElementById("btnTema");

btnTema.addEventListener("click", function () {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.getAttribute("data-bs-theme") === "dark";

    if (isDark) {
        htmlElement.setAttribute("data-bs-theme", "light");
        btnTema.textContent = "Dark Mode";
        btnTema.classList.replace("btn-outline-light", "btn-outline-secondary");
    } else {
        htmlElement.setAttribute("data-bs-theme", "dark");
        btnTema.textContent = "Light Mode";
        btnTema.classList.replace("btn-outline-secondary", "btn-outline-light");
    }
});

// FUNÇÃO PARA ALERTAS CUSTOMIZADOS NA TELA (Melhor UX)
function mostrarAlerta(mensagem, tipo = "danger") {
    const alertDiv = document.getElementById("alertMessage");
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.innerHTML = `${mensagem} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    
    // Rola a página para cima suavemente para o usuário ver o erro
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const SUPABASE_URL = "https://shdiawaqacvhtsigpidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_OwmxEctTMBA0UHXJXHOPPA_zr2DVkY3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const campos = document.querySelectorAll("input, select");
const btnSubmit = document.getElementById("btnSubmit");

const CAMPOS_OBRIGATORIOS = [
    "firstName",
    "lastName",
    "userName",
    "email",
    "password",
    "confirmPassword",
    "zip",
    "country",
    "state",
    "city",
    "district",
    "street",
    "number",
    "complement",
    "invalidCheck"
];

function verificarTodosCampos() {
    for (const id of CAMPOS_OBRIGATORIOS) {
        const campo = document.getElementById(id);
        if (!campo) continue;

        if (campo.type === "checkbox") {
            if (!campo.checked) return false;
            if (campo.classList.contains("is-invalid")) return false;
        } else {
            if (campo.classList.contains("is-invalid")) return false;
            if (!campo.classList.contains("is-valid")) return false;
        }
    }
    return true;
}

function atualizarBotaoSubmit() {
    btnSubmit.disabled = !verificarTodosCampos();
}

campos.forEach((campo) => {
    campo.addEventListener("blur", async function (event) {
        const valor = event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value.trim();

        if (event.target.id === "invalidCheck") {
            if (!event.target.checked) {
                event.target.classList.add("is-invalid");
                document.getElementById("invalidCheckFeedback").textContent = "You must agree to the terms and conditions";
            } else {
                event.target.classList.remove("is-invalid");
                event.target.classList.add("is-valid");
            }
            atualizarBotaoSubmit();
            return;
        }

        if (valor === "") {
            event.target.classList.add("is-invalid");
            event.target.classList.remove("is-valid");
            atualizarBotaoSubmit();
            return;
        }

        event.target.classList.remove("is-invalid");

        if (event.target.id === "firstName" || event.target.id === "lastName") {
            if (valor.length < 3) {
                event.target.classList.add("is-invalid");
                atualizarBotaoSubmit();
                return;
            }
            event.target.classList.add("is-valid");
        }

        if (event.target.id === "userName") {
            if (valor.length < 3) {
                event.target.classList.add("is-invalid");
                atualizarBotaoSubmit();
                return;
            }
            const { data, error } = await supabaseClient.from("account").select("id").eq("userName", valor);
            if (error) {
                console.error(error);
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerUsernameFeedback").textContent = "Unable to verify username";
                atualizarBotaoSubmit();
                return;
            }
            if (data && data.length > 0) {
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerUsernameFeedback").textContent = "Username already exists";
                atualizarBotaoSubmit();
                return;
            }
            event.target.classList.add("is-valid");
        }

        if (event.target.id === "email") {
            if (valor.length < 5 || !valor.includes("@")) {
                event.target.classList.add("is-invalid");
                atualizarBotaoSubmit();
                return;
            }
            const { data, error } = await supabaseClient.from("account").select("id").eq("email", valor);
            if (error) {
                console.error(error);
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerEmailFeedback").textContent = "Unable to verify email";
                atualizarBotaoSubmit();
                return;
            }
            if (data && data.length > 0) {
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerEmailFeedback").textContent = "Email already exists";
                atualizarBotaoSubmit();
                return;
            }
            event.target.classList.add("is-valid");
        }

        if (event.target.id === "password") {
            if (valor.length < 8) {
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerPasswordFeedback").textContent = "Password must be at least 8 characters long";
                atualizarBotaoSubmit();
                return;
            }
            event.target.classList.add("is-valid");
        }

        if (event.target.id === "confirmPassword") {
            if (valor !== document.getElementById("password").value) {
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerConfirmPasswordFeedback").textContent = "Passwords do not match";
                atualizarBotaoSubmit();
                return;
            }
            event.target.classList.add("is-valid");
        }

        if (event.target.id === "zip") {
            if (valor.length !== 8 || isNaN(valor)) {
                event.target.classList.add("is-invalid");
                document.getElementById("validationServerZipFeedback").textContent = "Zip must be 8 characters";
                atualizarBotaoSubmit();
                return;
            }
            try {
                const response = await fetch(`https://viacep.com.br/ws/${valor}/json/`);
                const data = await response.json();
                if (data.erro) {
                    event.target.classList.add("is-invalid");
                    atualizarBotaoSubmit();
                    return;
                }
                document.getElementById("street").value = data.logradouro;
                document.getElementById("district").value = data.bairro;
                document.getElementById("city").value = data.localidade;
                document.getElementById("state").value = data.uf;

                ["street", "district", "city", "state"].forEach(id => {
                    const campo = document.getElementById(id);
                    campo.classList.remove("is-invalid");
                    campo.classList.add("is-valid");
                });
                event.target.classList.add("is-valid");
            } catch {
                event.target.classList.add("is-invalid");
            }
            atualizarBotaoSubmit();
            return;
        }

        if (event.target.id === "country" && valor.length < 3) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        if (event.target.id === "state" && valor.length < 2) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        if (event.target.id === "city" && valor.length < 3) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        if (event.target.id === "district" && valor.length < 3) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        if (event.target.id === "street" && valor.length < 3) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        if (event.target.id === "number" && valor.length < 1) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        if (event.target.id === "complement" && valor.length < 3) { event.target.classList.add("is-invalid"); atualizarBotaoSubmit(); return; }
        event.target.classList.add("is-valid");
        atualizarBotaoSubmit();
    });
});

document.getElementById("password")?.addEventListener("input", function () {
    const confirmPassword = document.getElementById("confirmPassword");
    if (confirmPassword.value) {
        if (confirmPassword.value !== this.value) {
            confirmPassword.classList.add("is-invalid");
        } else {
            confirmPassword.classList.remove("is-invalid");
            confirmPassword.classList.add("is-valid");
        }
        atualizarBotaoSubmit();
    }
});

document.getElementById("invalidCheck")?.addEventListener("change", function () {
    if (this.checked) {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    } else {
        this.classList.add("is-invalid");
    }
    atualizarBotaoSubmit();
});

document.getElementById("mainForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!verificarTodosCampos()) {
        mostrarAlerta("Please fill all fields correctly.", "danger");
        return;
    }

    document.getElementById("alertMessage").classList.add("d-none");

    const userName = document.getElementById("userName").value;
    const email = document.getElementById("email").value;

    const { data: usernameCheck } = await supabaseClient.from("account").select("id").eq("userName", userName);
    if (usernameCheck && usernameCheck.length > 0) {
        mostrarAlerta("Username already exists", "warning");
        return;
    }

    const { data: emailCheck } = await supabaseClient.from("account").select("id").eq("email", email);
    if (emailCheck && emailCheck.length > 0) {
        mostrarAlerta("Email already exists", "warning");
        return;
    }

    // AQUI ESTÁ A CORREÇÃO: ADICIONADA A SENHA NO INSERT
    const { data, error } = await supabaseClient.from("account").insert({
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        userName: userName,
        password: document.getElementById("password").value, // SENHA ENVIADA PRO BANCO
        email: email,
        zip: document.getElementById("zip").value,
        country: document.getElementById("country").value,
        state: document.getElementById("state").value,
        city: document.getElementById("city").value,
        district: document.getElementById("district").value,
        street: document.getElementById("street").value,
        number: document.getElementById("number").value,
        complement: document.getElementById("complement").value
    });

    if (error) {
        console.error(error);
        mostrarAlerta("Error creating account", "danger");
        return;
    }

    mostrarAlerta("Conta criada com sucesso! Redirecionando para o login...", "success");
    setTimeout(() => {
        // AGORA ELE VAI PRO LOGIN DEPOIS DE CADASTRAR
        window.location.href = "login.html"; 
    }, 2000);
});