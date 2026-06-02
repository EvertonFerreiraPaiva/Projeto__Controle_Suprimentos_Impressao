function getAccessToken() {
    return localStorage.getItem('sb_access_token');
}

function requireAuth() {
    if (!getAccessToken()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

async function signUp(email, password) {
    return supabaseRequest('POST', '/auth/v1/signup', { email, password });
}

async function signIn(email, password) {
    const data = await supabaseRequest(
        'POST',
        '/auth/v1/token?grant_type=password',
        { email, password }
    );

    localStorage.setItem('sb_access_token', data.access_token);
    localStorage.setItem('sb_refresh_token', data.refresh_token || '');
    localStorage.setItem('sb_user_email', data.user?.email || email);

    return data;
}

function signOut() {
    localStorage.removeItem('sb_access_token');
    localStorage.removeItem('sb_refresh_token');
    localStorage.removeItem('sb_user_email');
    window.location.href = 'index.html';
}

async function getUser() {
    const token = getAccessToken();
    if (!token) return null;
    return supabaseRequest('GET', '/auth/v1/user', null, token);
}

// ============================================================
// HANDLERS DOS FORMULÁRIOS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.endsWith('index.html')
        || window.location.pathname === '/'
        || window.location.pathname.endsWith('/');

    if (getAccessToken() && isLoginPage) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const cadastroForm = document.getElementById('form-cadastro');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', handleCadastro);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const erroEl = document.getElementById('mensagem-erro');

    if (erroEl) erroEl.classList.add('hidden');

    try {
        await signIn(email, senha);
        window.location.href = 'dashboard.html';
    } catch (err) {
        if (erroEl) {
            erroEl.textContent = err.message;
            erroEl.classList.remove('hidden');
        }
    }
}

async function handleCadastro(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar-senha').value;
    const erroEl = document.getElementById('mensagem-erro');
    const sucessoEl = document.getElementById('mensagem-sucesso');

    if (erroEl) erroEl.classList.add('hidden');
    if (sucessoEl) sucessoEl.classList.add('hidden');

    if (senha !== confirmar) {
        if (erroEl) {
            erroEl.textContent = 'As senhas não conferem.';
            erroEl.classList.remove('hidden');
        }
        return;
    }

    try {
        await signUp(email, senha);
        if (sucessoEl) {
            sucessoEl.textContent = 'Cadastro realizado! Redirecionando para o login...';
            sucessoEl.classList.remove('hidden');
        }
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    } catch (err) {
        if (erroEl) {
            erroEl.textContent = err.message;
            erroEl.classList.remove('hidden');
        }
    }
}
