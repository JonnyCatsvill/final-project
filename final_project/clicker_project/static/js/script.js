const API_BASE = '/api/';

// Вспомогательные функции
function setTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

async function apiRequest(url, method, body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE}${url}`, options);
    if (response.status === 401) {
        // Попытка обновить токен (для простоты – просто выходим)
        clearTokens();
        window.location.reload();
        throw new Error('Unauthorized');
    }
    return response;
}

// ДОБАВЛЕНО: Глобальная переменная для хранения множителя буста
let boostCount = 1;

// Регистрация
document.getElementById('register-btn').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const res = await apiRequest('register/', 'POST', { username, password });
    if (res.ok) {
        alert('Регистрация успешна! Теперь войдите.');
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
    } else {
        const data = await res.json();
        alert('Ошибка: ' + JSON.stringify(data));
    }
});

// Логин
document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const res = await fetch(`${API_BASE}login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (res.ok) {
        const data = await res.json();
        setTokens(data.access, data.refresh);
        await loadProfile();
        showGame();
    } else {
        alert('Неверное имя пользователя или пароль');
    }
});

// Загрузка профиля (счётчик кликов)
async function loadProfile() {
    const res = await apiRequest('profile/', 'GET');
    if (res.ok) {
        const data = await res.json();
        document.getElementById('username').innerText = data.username;
        document.getElementById('click-count').innerText = data.clicks;
        // ДОБАВЛЕНО: Загрузка и отображение буста
        boostCount = data.boost_count;
        const boostElement = document.getElementById('boost-value');
        if (boostElement) boostElement.innerText = boostCount;
    }
}

// Клик
document.getElementById('click-btn').addEventListener('click', async () => {
    // ИЗМЕНЕНО: Отправляем на сервер количество кликов с учётом буста
    const res = await apiRequest('click/', 'POST', { clicks_to_add: boostCount });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('click-count').innerText = data.clicks;
        // ДОБАВЛЕНО: Обновляем буст если он изменился
        if (data.boost_count !== undefined) {
            boostCount = data.boost_count;
            const boostElement = document.getElementById('boost-value');
            if (boostElement) boostElement.innerText = boostCount;
        }
    } else {
        alert('Ошибка при клике');
    }
});

// ДОБАВЛЕНО: Покупка буста
const boostBtn = document.getElementById('boost-btn');
if (boostBtn) {
    boostBtn.addEventListener('click', async () => {
        const res = await apiRequest('buy_boost/', 'POST', {});
        if (res.ok) {
            const data = await res.json();
            boostCount = data.boost_count;
            const boostElement = document.getElementById('boost-value');
            if (boostElement) boostElement.innerText = boostCount;
            document.getElementById('click-count').innerText = data.clicks;
            alert(`Буст куплен! Теперь множитель x${boostCount}`);
        } else {
            const error = await res.json();
            alert('Ошибка при покупке буста: ' + JSON.stringify(error));
        }
    });
}

// Выход
document.getElementById('logout-btn').addEventListener('click', () => {
    clearTokens();
    showAuth();
});

// Переключение интерфейса
function showGame() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
}

function showAuth() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('game-section').style.display = 'none';
}

// Проверка токена при загрузке
async function checkAuth() {
    const token = getAccessToken();
    if (token) {
        const res = await apiRequest('profile/', 'GET');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('username').innerText = data.username;
            document.getElementById('click-count').innerText = data.clicks;
            // ДОБАВЛЕНО: Загрузка буста при проверке авторизации
            boostCount = data.boost_count;
            const boostElement = document.getElementById('boost-value');
            if (boostElement) boostElement.innerText = boostCount;
            showGame();
        } else {
            clearTokens();
            showAuth();
        }
    } else {
        showAuth();
    }
}

checkAuth();