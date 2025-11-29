# Бэкенд для Simple Auth App

Простой сервер на Node.js + Express для авторизации и регистрации пользователей.

## Быстрый старт

1. **Установите зависимости:**
   ```bash
   cd server
   npm install
   ```

2. **Запустите сервер:**
   ```bash
   npm start
   ```
   Или для автоматической перезагрузки при изменениях:
   ```bash
   npm run dev
   ```

3. **Сервер будет доступен на:** `http://localhost:3000`

## API Endpoints

### POST `/api/auth/register`
Регистрация нового пользователя. Поддерживаются два типа:

- `user` — обычный пользователь, идентификатором служит email
- `mop` — агент, идентификатором служит код из 5 цифр (вместо email)

**Тело запроса (обычный пользователь):**
```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "password123",
  "type": "user"
}
```

**Тело запроса (агент MOP):**
```json
{
  "name": "Agent Smith",
  "identifier": "12345",
  "password": "password123",
  "type": "mop"
}
```

**Ответ:**
```json
{
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": "1234567890",
    "name": "Agent Smith",
    "type": "mop",
    "identifier": "12345",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/api/auth/login`
Авторизация пользователя

**Тело запроса (обычный пользователь):**
```json
{
  "email": "ivan@example.com",
  "password": "password123",
  "type": "user"
}
```

**Тело запроса (агент MOP):**
```json
{
  "identifier": "12345",
  "password": "password123",
  "type": "mop"
}
```

**Ответ:**
```json
{
  "message": "Успешный вход",
  "user": {
    "id": "1234567890",
    "name": "Agent Smith",
    "type": "mop",
    "identifier": "12345",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET `/api/auth/me`
Получить информацию о текущем пользователе (требует токен)

**Заголовки:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ответ:**
```json
{
  "user": {
    "id": "1234567890",
    "name": "Иван Иванов",
    "type": "user",
    "identifier": "ivan@example.com",
    "email": "ivan@example.com",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/api/health`
Проверка работы сервера

## Как это работает

- **Хранение данных:** Пользователи сохраняются в файле `users.json`
- **Безопасность паролей:** Пароли хешируются с помощью bcrypt перед сохранением
- **Токены:** После успешной регистрации/входа возвращается JWT токен
- **CORS:** Сервер настроен для работы с фронтендом на другом порту

## Важные замечания

⚠️ **Этот сервер создан для обучения и разработки!**

- В продакшене нужно использовать реальную базу данных (MongoDB, PostgreSQL и т.д.)
- Секретный ключ для JWT должен храниться в переменных окружения
- Добавьте валидацию данных (например, библиотеку `joi` или `express-validator`)
- Настройте HTTPS для безопасности
- Добавьте rate limiting для защиты от атак

## Структура файлов

```
server/
  ├── server.js      # Основной файл сервера
  ├── package.json   # Зависимости проекта
  ├── users.json     # Файл с данными пользователей (создается автоматически)
  └── README.md      # Эта документация
```

