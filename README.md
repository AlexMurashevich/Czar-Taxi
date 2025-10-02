# Царь Такси - Система геймификации для таксистов

Комплексная административная панель и система управления программой геймификации для водителей такси с иерархической структурой соревнований, вдохновленной древней военной организацией.

## 📋 Оглавление

- [Обзор](#обзор)
- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Установка](#установка)
- [Конфигурация](#конфигурация)
- [Запуск](#запуск)
- [Архитектура](#архитектура)
- [API документация](#api-документация)
- [Иерархия ролей](#иерархия-ролей)
- [База данных](#база-данных)

## 🎯 Обзор

"Царь Такси" - это система управления соревнованиями между водителями такси с автоматическим распределением ролей, командными расчетами производительности, импортом данных через XLSX, интеграцией Telegram-бота и административной панелью для управления системой.

### Ключевые роли

- **Царь (Tsar)** - 1 лидер
- **Сотники (Centurions)** - до 10 командиров
- **Десятники (Decurions)** - до 100 командиров групп
- **Водители (Drivers)** - до 1000 участников

## ✨ Возможности

### Административная панель

- 📊 **Dashboard** - Статистика в реальном времени, обзор иерархии, алерты
- 🏆 **Рейтинги** - Топ сотников и водителей с детальной статистикой
- 👥 **Управление участниками** - Одобрение заявок, блокировка пользователей
- 📅 **Управление сезонами** - Создание, редактирование, завершение сезонов
- 📈 **Аналитика** - Интерактивные графики трендов и производительности
- 🚨 **Антифрод** - Автоматическое обнаружение аномалий и мошенничества
- 📄 **Отчеты** - Генерация и экспорт отчетов в XLSX
- 🔔 **Уведомления** - Система уведомлений через Telegram и WebSocket

### Импорт данных

- Загрузка рабочих часов через XLSX файлы
- Автоматическая валидация и нормализация номеров телефонов
- Детальная отчетность об ошибках импорта
- Создание/обновление пользователей и записей часов

### Telegram бот

- Регистрация участников через контакт
- Команды: `/start`, `/mystats`, `/team`, `/leaderboard`
- Статистика производительности в реальном времени
- Уведомления о изменениях ролей и достижениях

### Экспорт данных

- Итоги сезонов (все участники, роли, часы, проценты)
- Рейтинги (топ-100 сотников/водителей)
- Дневные отчеты по датам
- Алерты мошенничества
- Индивидуальная производительность пользователей

### Система антифрода

- Обнаружение высоких дневных часов (>16 часов)
- Определение аномальных скачков (470% выше медианы)
- Флаги периодов без активности (>7 дней нулевых часов)
- Ранжирование по уровню серьезности (low/medium/high)

## 🛠 Технологический стек

### Frontend

- **React 18** с TypeScript
- **Vite** для сборки и dev сервера
- **Wouter** для роутинга
- **TanStack Query** для управления состоянием сервера
- **Shadcn UI** + Radix UI для компонентов
- **Tailwind CSS** для стилизации
- **Recharts** для графиков

### Backend

- **Express.js** с TypeScript
- **Node.js** в ESM формате
- **Express-session** для аутентификации
- **PostgreSQL** через Neon serverless
- **Drizzle ORM** для работы с БД
- **WebSocket** для real-time уведомлений

### Интеграции

- **Telegram Bot API** для бота
- **XLSX** для импорта/экспорта
- **Multer** для загрузки файлов

## 📦 Установка

### Требования

- Node.js 18+ или 20+
- PostgreSQL база данных (или Neon)
- npm или yarn

### Шаги установки

1. Клонируйте репозиторий:
```bash
git clone https://github.com/AlexMurashevich/Czar-Taxi.git
cd Czar-Taxi
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` (см. [Конфигурация](#конфигурация))

4. Настройте базу данных:
```bash
npm run db:push
```

## ⚙️ Конфигурация

Создайте файл `.env` в корне проекта:

```env
# База данных (обязательно)
DATABASE_URL=postgresql://user:password@host:5432/database

# Session secret (обязательно для production)
SESSION_SECRET=your-random-secret-key-here

# Admin key (обязательно для production)
ADMIN_KEY=your-admin-key-here

# Telegram bot (опционально)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Environment
NODE_ENV=development
PORT=5000
```

### Получение переменных окружения

#### DATABASE_URL
- Используйте [Neon](https://neon.tech) для бесплатной PostgreSQL БД
- Или установите PostgreSQL локально

#### TELEGRAM_BOT_TOKEN
1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Скопируйте токен

#### SESSION_SECRET
Сгенерируйте случайную строку:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### ADMIN_KEY
Выберите безопасный пароль для доступа к админ-панели

## 🚀 Запуск

### Development режим

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5000`

### Production режим

```bash
# Сборка
npm run build

# Запуск
npm start
```

### База данных

```bash
# Применить изменения схемы
npm run db:push

# Применить изменения схемы (с force)
npm run db:push --force

# Открыть Drizzle Studio
npm run db:studio
```

## 🏗 Архитектура

### Структура проекта

```
czar-taxi/
├── client/                 # Frontend React приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   │   ├── ui/       # Shadcn UI компоненты
│   │   │   ├── layout/   # Layout компоненты (Sidebar, Header)
│   │   │   └── */        # Доменные компоненты
│   │   ├── pages/        # Страницы роутинга
│   │   ├── hooks/        # Кастомные React хуки
│   │   └── lib/          # Утилиты
│   └── index.html
├── server/                # Backend Express API
│   ├── routes.ts         # API маршруты
│   ├── storage.ts        # Слой работы с БД
│   ├── services/         # Бизнес-логика
│   │   ├── calculations.ts      # Расчеты агрегатов
│   │   ├── role-transitions.ts  # Переходы ролей
│   │   ├── anti-fraud.ts        # Система антифрода
│   │   ├── xlsx-processor.ts    # Обработка XLSX
│   │   ├── telegram-bot.ts      # Telegram бот
│   │   ├── analytics.ts         # Аналитика
│   │   ├── export.ts            # Экспорт XLSX
│   │   └── notifications.ts     # Уведомления
│   ├── websocket.ts      # WebSocket сервер
│   └── index.ts          # Точка входа
├── shared/               # Общий код
│   └── schema.ts        # Drizzle схема БД
└── package.json
```

### Поток данных

1. Админ загружает XLSX файл с часами работы
2. XLSX Processor валидирует и парсит данные
3. Storage создает/обновляет записи в БД
4. Calculations Service пересчитывает агрегаты
5. Anti-Fraud Service проверяет аномалии
6. Frontend обновляется через TanStack Query
7. Telegram Bot отправляет уведомления участникам

## 📡 API документация

### Аутентификация

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/status
```

### Dashboard

```
GET /api/dashboard/stats
GET /api/dashboard/hierarchy-stats/:seasonId
GET /api/dashboard/waitlist-count
```

### Сезоны

```
GET  /api/seasons
GET  /api/seasons/active
POST /api/seasons
PUT  /api/seasons/:id
POST /api/seasons/:id/close
```

### Рейтинги

```
GET /api/leaderboards/centurions/:seasonId/:limit
GET /api/leaderboards/drivers/:seasonId/:limit
```

### Участники

```
GET  /api/participants/waitlist
POST /api/participants/approve
POST /api/participants/block/:userId
```

### Импорт

```
POST /api/imports/upload
GET  /api/imports
GET  /api/imports/:id
```

### Иерархия

```
GET /api/hierarchy/:seasonId
```

### Антифрод

```
GET /api/fraud/alerts
```

### Аналитика

```
GET /api/analytics/:seasonId
```

### Экспорт

```
GET /api/export/season/:seasonId
GET /api/export/leaderboard/:seasonId/:role
GET /api/export/daily/:seasonId/:date
GET /api/export/fraud-alerts
GET /api/export/user/:userId/season/:seasonId
```

### Уведомления

```
GET  /api/notifications
POST /api/notifications/send
```

### Служебные

```
POST /api/recalculate
POST /api/redistribute
POST /api/telegram/webhook
```

## 👑 Иерархия ролей

### Структура

```
Царь (1)
  └─ Сотник 1 (команда макс 10)
      ├─ Десятник 1 (команда макс 10)
      │   └─ Водители (макс 10)
      └─ Десятник 2
          └─ Водители
```

### Расчет производительности

**Личные часы** - часы работы самого участника

**Командные часы** - сумма часов всех подчиненных:
- Царь: все часы системы
- Сотник: часы всех десятников и водителей в его команде
- Десятник: часы всех водителей в его команде
- Водитель: 0 (нет подчиненных)

**Итоговые часы** = Личные часы + Командные часы

**Процент выполнения** = (Итоговые часы / Целевые часы) × 100%

### Переходы ролей

В конце сезона автоматически:

**Первый сезон:**
- Топ 1% → Царь
- Топ 10% → Сотники
- Топ 20% → Десятники
- Остальные → Водители

**Последующие сезоны:**
- ≥100% цели → повышение на уровень
- <50% цели → понижение на уровень
- 50-99% → роль сохраняется

## 🗄 База данных

### Основные таблицы

#### users
Информация об участниках
- id, phone, telegram_user_id, full_name, status, consent_at

#### seasons
Сезоны соревнований
- id, name, start_date, end_date, day_count, daily_hour_target, status

#### role_assignments
Назначение ролей участникам в сезонах
- id, season_id, user_id, role, sotnik_id, desyatnik_id, group_index

#### hours_raw
Сырые данные рабочих часов
- id, user_id, date, hours, import_id

#### aggregates_daily
Ежедневные агрегаты
- user_id, season_id, date, personal_hours, team_hours, total_hours

#### aggregates_season
Сезонные агрегаты
- user_id, season_id, personal_total, team_total, total_hours, target_hours, percent

#### imports
История импортов
- id, filename, status, rows_processed, errors_json

#### waitlist
Очередь новых участников
- id, phone, telegram_user_id, full_name, created_at

#### messaging_permissions
Разрешения на сообщения Telegram
- user_id, allow_messages

#### audit_logs
Журнал административных действий
- id, actor_id, action, entity_type, entity_id, payload_json

#### notifications
История уведомлений
- id, user_id, type, title, message, status, delivery_method

#### notification_preferences
Настройки уведомлений пользователей
- user_id, notification_type, enabled, delivery_method

## 📊 Формат XLSX для импорта

### Структура файла

| Телефон | 2025-03-01 | 2025-03-02 | 2025-03-03 | ...
|---------|------------|------------|------------|----
| +79991234567 | 8.5 | 9.0 | 7.5 | ...
| +79991234568 | 10.0 | 8.5 | 9.5 | ...

### Требования

- Первая колонка: номера телефонов (с + или без)
- Последующие колонки: даты в формате YYYY-MM-DD
- Значения: количество часов (число)
- Пустые ячейки игнорируются

### Валидация

- Номера телефонов нормализуются автоматически
- Создаются новые пользователи при необходимости
- Обновляются существующие записи часов
- Детальный отчет об ошибках в response

## 🔐 Безопасность

### Аутентификация

- Session-based аутентификация с PostgreSQL store
- HTTP-only session cookies
- Session regeneration при входе
- Proper session destroy при выходе

### Авторизация

- Все административные эндпоинты защищены `adminAuth` middleware
- ADMIN_KEY не передается на клиент
- В development (без ADMIN_KEY) - auto-login
- В production - обязательный ввод admin key

### Защита данных

- Все экспорты требуют аутентификации
- Credentials включены во все fetch запросы
- Secure cookies в production
- Validation всех входных данных

## 🧪 Тестирование

Система включает end-to-end тесты для:
- Аутентификации (auto-login)
- Экспорта данных (season, leaderboards, fraud)
- Toast уведомлений
- Session management

Запуск тестов через Playwright интегрирован в workflow.

## 📝 Лицензия

© 2025 Царь Такси. Все права защищены.

## 🤝 Поддержка

Для вопросов и предложений создавайте issues в репозитории.

## 🔄 История версий

### v1.0.0 (Октябрь 2025)
- ✅ Полная административная панель
- ✅ Система иерархии и ролей
- ✅ Импорт/экспорт XLSX
- ✅ Telegram бот интеграция
- ✅ Аналитика и графики
- ✅ Система антифрода
- ✅ Уведомления (частично)
- ✅ Session-based аутентификация
- ✅ Экспорт отчетов

### Roadmap
- 📱 Мобильная адаптация
- 🤖 ML модели для антифрода
- 🔔 Полная интеграция уведомлений
- 🌐 Мультиязычность

---

Разработано с ❤️ для оптимизации работы таксопарков
