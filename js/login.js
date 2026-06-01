// Lógica do Supabase original mantida intacta
const SUPABASE_URL = "https://shdiawaqacvhtsigpidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_OwmxEctTMBA0UHXJXHOPPA_zr2DVkY3";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = document.getElementById('loginUserName').value;
    const pass = document.getElementById('loginPassword').value;

    const alertBox = document.getElementById('loginAlert');
    const btnSubmit = document.getElementById('btnEntrar');

    alertBox.className = "alert d-none mt-3";
    btnSubmit.textContent = "Validando...";
    btnSubmit.disabled = true;

    const { data, error } = await supabaseClient
        .from('account')
        .select('id, userName')
        .eq('userName', user)
        .eq('password', pass)
        .maybeSingle();

    if (error || !data) {
        alertBox.className = "alert alert-danger d-block mt-3";
        alertBox.textContent = "Utilizador ou senha incorretos!";
        btnSubmit.textContent = "Entrar";
        btnSubmit.disabled = false;
    } else {
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userName', data.userName);
        window.location.href = 'chat.html';
    }
});
