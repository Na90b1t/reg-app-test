const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key-change-in-production'; // В продакшене использовать переменную окружения!
const SUPPORTED_USER_TYPES = ['user', 'mop'];

// Путь к файлу с данными пользователей
const DATA_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors()); // Разрешаем запросы с фронтенда
app.use(express.json()); // Парсим JSON из запросов

// Функция для чтения пользователей из файла
function getUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Ошибка чтения файла:', error);
    return [];
  }
}

// Функция для сохранения пользователей в файл
function saveUsers(users) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Ошибка записи файла:', error);
    return false;
  }
}

function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).toLowerCase());
}

function isValidMopCode(value = '') {
  return /^\d{5}$/.test(value);
}

function prepareSafeUser(user) {
  const identifier = user.identifier ?? user.email ?? '';
  return {
    id: user.id,
    name: user.name,
    type: user.type || 'user',
    identifier,
    email: user.email || undefined,
    createdAt: user.createdAt
  };
}

// Маршрут для регистрации
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, type = 'user', identifier } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        error: 'Имя и пароль обязательны для заполнения'
      });
    }

    if (!SUPPORTED_USER_TYPES.includes(type)) {
      return res.status(400).json({
        error: 'Неверный тип пользователя'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Пароль должен быть не менее 6 символов'
      });
    }

    let normalizedIdentifier;
    if (type === 'user') {
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({
          error: 'Укажите корректный email'
        });
      }
      normalizedIdentifier = email.toLowerCase();
    } else {
      if (!identifier || !isValidMopCode(identifier)) {
        return res.status(400).json({
          error: 'Код агента должен состоять из 5 цифр'
        });
      }
      normalizedIdentifier = identifier;
    }

    const users = getUsers();

    if (users.find(u => (u.identifier ?? u.email) === normalizedIdentifier)) {
      return res.status(400).json({
        error: 'Пользователь с такими данными уже существует'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      type,
      identifier: normalizedIdentifier,
      name,
      email: type === 'user' ? normalizedIdentifier : null,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign(
      { id: newUser.id, identifier: newUser.identifier, type: newUser.type },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: prepareSafeUser(newUser),
      token
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Маршрут для авторизации
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, type = 'user', identifier } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Пароль обязателен'
      });
    }

    if (!SUPPORTED_USER_TYPES.includes(type)) {
      return res.status(400).json({
        error: 'Неверный тип пользователя'
      });
    }

    let normalizedIdentifier;
    if (type === 'user') {
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({
          error: 'Укажите корректный email'
        });
      }
      normalizedIdentifier = email.toLowerCase();
    } else {
      if (!identifier || !isValidMopCode(identifier)) {
        return res.status(400).json({
          error: 'Код агента должен состоять из 5 цифр'
        });
      }
      normalizedIdentifier = identifier;
    }

    const users = getUsers();
    const user = users.find(u => {
      const userType = u.type || 'user';
      const storedIdentifier = u.identifier ?? u.email;
      return userType === type && storedIdentifier === normalizedIdentifier;
    });

    if (!user) {
      return res.status(401).json({
        error: 'Неверные данные для входа'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Неверные данные для входа'
      });
    }

    const token = jwt.sign(
      { id: user.id, identifier: user.identifier ?? user.email, type: user.type || 'user' },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Успешный вход',
      user: prepareSafeUser(user),
      token
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

// Маршрут для получения информации о текущем пользователе (защищенный)
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      user: prepareSafeUser(user)
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истек' });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Простой маршрут для проверки работы сервера
app.get('/api/health', (req, res) => {
  res.json({ message: 'Сервер работает!', status: 'ok' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 API доступен по адресу http://localhost:${PORT}/api`);
  console.log(`💡 Для остановки нажмите Ctrl+C`);
});

