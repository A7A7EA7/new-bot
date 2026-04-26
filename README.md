# Bot-MultiSite — bothost.ru build

Готовая к загрузке на **bothost.ru** сборка Telegram-бота. Длинный polling, без
Express, без webhook, без монорепо. Один файл `index.js` весит ~1 МБ и содержит
весь код кроме нативного `better-sqlite3` (он ставится через `npm install`).

## Что внутри

```
bothost-bot/
├── index.js          ← собранный бандл (его запускает bothost)
├── package.json      ← runtime-зависимости + npm start
├── assets/
│   ├── welcome.png            ← картинка, которую бот шлёт после /start
│   └── description-picture.png ← 640×360, для @BotFather → Bot Settings → Description Picture
├── src/              ← исходники TypeScript (для редактирования)
│   ├── index.ts
│   ├── bot.ts
│   ├── db.ts
│   └── logger.ts
├── build.mjs         ← скрипт пересборки
├── tsconfig.json
└── .gitignore
```

После первого запуска появится папка `data/` с файлом `bot.db` (SQLite). Там же
бот хранит пользовательскую приветственную картинку. **Не удаляйте папку `data/`
между перезапусками** — это вся память бота.

## Деплой на bothost.ru

1. Заархивируйте всё содержимое папки `bothost-bot/` (без самой папки) в `.zip`,
   либо загрузите готовый `bot-multisite-bothost.zip`.
2. На bothost.ru создайте новый Node.js проект.
3. Загрузите архив.
4. В разделе **Переменные окружения** задайте:
   - `TELEGRAM_BOT_TOKEN` — токен от @BotFather (обязательно)
   - `BOT_OWNER_ID` — ваш Telegram ID (опционально, по умолчанию `7900265965`)
   - `OWNER_EMAIL` — email для контакта (опционально)
5. Команда запуска: `npm start` (или `node index.js`).
6. bothost сам выполнит `npm install` (это скомпилирует `better-sqlite3`).
7. Запускайте.

## Локальный запуск

```bash
cd bothost-bot
npm install
TELEGRAM_BOT_TOKEN=123456:ABC... npm start
```

## Пересборка после правки исходников

```bash
npm install
npm run build       # перегенерирует index.js из src/
```

## Переменные окружения

| Переменная | Обязательная | По умолчанию | Что делает |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | да | — | Токен бота |
| `BOT_OWNER_ID` | нет | `7900265965` | Telegram ID владельца (полный доступ к админке) |
| `OWNER_EMAIL` | нет | `s7s704s7@outlook.com` | Email в кнопке «Контакты» |
| `DATABASE_URL` | нет | `./data/bot.db` | Путь к файлу SQLite |
| `LOG_LEVEL` | нет | `info` | `debug` для подробных логов |

> **Важно:** webhook-режим (`BOT_MODE=webhook`, `WEBHOOK_URL`) в этой сборке
> бесполезен — Express-сервер вырезан, так как у bothost.ru нет публичного URL.
> Бот всегда работает в режиме long polling.

## Что было изменено относительно оригинального репо

- Монорепо pnpm → плоский npm-проект.
- `@workspace/db` встроен в `src/db.ts` (схема + создание таблиц через `CREATE
  TABLE IF NOT EXISTS`, без drizzle-kit-миграций).
- Express + webhook + HTTP-роуты удалены — остался только бот.
- `pino` заменён на лёгкий console-логгер (минус ~5 МБ зависимостей).
- Один бандл `index.js` через esbuild, нативный `better-sqlite3` остаётся
  внешней зависимостью.
- Точка входа: `src/index.ts` → `startBot()`.
