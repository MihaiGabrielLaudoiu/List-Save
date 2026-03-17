// Inicializar el formulario cuando cargue la pagina
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.form--login');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Procesar el envio del formulario de login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('remember').checked;

    if (!validateEmail(email)) {
        showError('login-email', 'Por favor, introduce un email válido');
        return;
    }

    if (!password) {
        showError('login-password', 'Por favor, introduce tu contraseña');
        return;
    }

    showSpinner();

    try {
        await ApiClient.post('/api/auth/login', {
            email: email,
            password: password,
            remember: remember
        });

        await SessionManager.refreshSession();
        removeSpinner();
        window.location.href = "./index.html";
    } catch (error) {
        showError('login-password', error.message);
        removeSpinner();
    }
}

// Validar formato de email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Mostrar mensaje de error bajo un campo del formulario
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorSpan = field.nextElementSibling;
    
    field.classList.add('form__input--error');
    errorSpan.textContent = message;
    errorSpan.classList.add('form__error');
}

// Mostrar indicador de carga en el boton
function showSpinner() {
    const button = document.querySelector('.button--primary');
    button.disabled = true;
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    button.appendChild(spinner);
}

// Quitar indicador de carga del boton
function removeSpinner() {
    const button = document.querySelector('.button--primary');
    button.disabled = false;
    const spinner = button.querySelector('.spinner');
    if (spinner) {
        spinner.remove();
    }
} 