document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');

    const validations = {
        fullname: {
            regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,60}$/,
            error: 'El nombre debe contener solo letras y espacios (2-60 caracteres)'
        },
        email: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            error: 'Introduce un correo electrónico válido'
        },
        password: {
            regex: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
            error: 'Mínimo 8 caracteres, al menos una letra y un número'
        },
        confirmPassword: {
            validate: (value, formData) => value === formData.get('password'),
            error: 'Las contraseñas no coinciden'
        }
    };

    function showFieldError(input, message) {
        input.classList.add('form__input--error');
        let err = input.parentNode.querySelector('.form__error-message');
        if (!err) {
            err = document.createElement('span');
            err.className = 'form__error-message';
            const hint = input.parentNode.querySelector('.form__hint');
            input.parentNode.insertBefore(err, hint || null);
        }
        err.textContent = message;
        err.classList.add('form__error-message--visible');
        const hint = input.parentNode.querySelector('.form__hint');
        if (hint) hint.style.display = 'none';
    }

    function clearFieldError(input) {
        input.classList.remove('form__input--error');
        const err = input.parentNode.querySelector('.form__error-message');
        if (err) err.classList.remove('form__error-message--visible');
        const hint = input.parentNode.querySelector('.form__hint');
        if (hint) hint.style.display = '';
    }

    function validateField(input) {
        const name = input.name;
        const value = input.value.trim();
        clearFieldError(input);

        if (!value) {
            showFieldError(input, 'Este campo es obligatorio');
            return false;
        }

        const v = validations[name];
        if (v) {
            const ok = v.regex
                ? v.regex.test(value)
                : v.validate(value, new FormData(form));
            if (!ok) { showFieldError(input, v.error); return false; }
        }
        return true;
    }

    form.querySelectorAll('.form__input').forEach(input => {
        input.addEventListener('input', () => validateField(input));
        input.addEventListener('blur', () => validateField(input));
    });

    const showSuccess = () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center';
        overlay.innerHTML = '<div style="background:#fff;padding:2rem 2.5rem;border-radius:16px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.15)">' +
            '<svg style="width:48px;height:48px;color:#059669" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
            '<p style="margin:.75rem 0 0;font-weight:700;font-size:1.1rem">¡Cuenta creada!</p></div>';
        document.body.appendChild(overlay);
        setTimeout(() => { window.location.href = './login.html'; }, 1800);
    };

    const doRegister = async () => {
        const formData = new FormData(form);
        const payload = {
            email: formData.get('email'),
            password: formData.get('password'),
            fullname: formData.get('fullname')
        };
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
        try {
            await ApiClient.post('/api/auth/register', payload);
            hideConfirmModal();
            showSuccess();
        } catch (error) {
            hideConfirmModal();
            submitBtn.disabled = false;
            submitBtn.dataset.i18n && (submitBtn.textContent = 'Registrarse');
            await AppModal.alert(error.message);
        }
    };

    form.addEventListener('submit', e => {
        e.preventDefault();
        const inputs = form.querySelectorAll('.form__input');
        let valid = true;
        inputs.forEach(input => { if (!validateField(input)) valid = false; });
        if (valid) showConfirmModal();
    });

    const hideConfirmModal = () => {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.style.display = 'none';
    };

    const showConfirmModal = () => {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.style.display = 'flex';
    };

    const cancelBtn = document.getElementById('cancelRegisterConfirm');
    const confirmBtn = document.getElementById('confirmRegisterBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', hideConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener('click', doRegister);

    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.value = TranslationManager.getCurrentLanguage();
        languageSelect.addEventListener('change', async e => {
            await TranslationManager.setLanguage(e.target.value);
        });
    }
});
