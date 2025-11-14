# QuoteMe - Быстрый запуск в Docker

Самый простой способ развернуть систему на любом компьютере.

## Требования

- Docker Desktop для Mac (скачать с https://www.docker.com/products/docker-desktop/)
- Или Docker + Docker Compose для Linux

## Установка Docker на macOS

```bash
# Скачайте и установите Docker Desktop с сайта
# https://www.docker.com/products/docker-desktop/

# После установки запустите Docker Desktop
# Убедитесь, что Docker работает:
docker --version
docker-compose --version
```

## Запуск системы (3 команды!)

```bash
# 1. Клонируйте репозиторий
git clone <repository-url>
cd quoteme

# 2. Запустите все сервисы
docker-compose up -d

# 3. Заполните базу данных тестовыми данными (опционально)
docker-compose exec backend npm run prisma:seed
```

Готово! Система запущена:
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:3001
- 🗄️ PostgreSQL: localhost:5432

## Тестовые аккаунты

После выполнения seed команды будут доступны:

**Импортер:**
- Email: `importer@example.com`
- Пароль: `password123`

**Экспедитор:**
- Email: `forwarder@example.com`
- Пароль: `password123`

## Полезные команды

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Остановить все сервисы
docker-compose down

# Остановить и удалить все данные (включая БД)
docker-compose down -v

# Перезапустить конкретный сервис
docker-compose restart backend

# Пересобрать образы после изменения кода
docker-compose up -d --build

# Открыть Prisma Studio (GUI для БД)
docker-compose exec backend npx prisma studio
# Откроется на http://localhost:5555

# Выполнить миграции вручную
docker-compose exec backend npx prisma migrate deploy

# Войти в контейнер backend
docker-compose exec backend sh

# Войти в PostgreSQL
docker-compose exec postgres psql -U quoteme_user -d quoteme
```

## Разработка с hot reload

Docker Compose настроен с volume mapping, поэтому:
- Изменения в `backend/src` автоматически перезапускают backend (nodemon)
- Изменения в `frontend/src` автоматически обновляют frontend (Vite HMR)

Просто редактируйте файлы и наблюдайте изменения в реальном времени!

## Структура сервисов

### PostgreSQL (postgres)
- Порт: 5432
- База: quoteme
- Пользователь: quoteme_user
- Пароль: quoteme_password
- Данные сохраняются в Docker volume

### Backend (backend)
- Порт: 3001
- Node.js + Express + TypeScript
- Автоматически применяет миграции при запуске
- Hot reload для разработки

### Frontend (frontend)
- Порт: 3000
- React + Vite + TypeScript
- Hot reload для разработки
- Proxy к backend настроен автоматически

## Решение проблем

### Порты заняты
Если порты 3000, 3001 или 5432 уже используются:

```bash
# Проверьте, что занимает порты
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Остановите процессы или измените порты в docker-compose.yml
```

### Ошибки при запуске
```bash
# Полная перезагрузка
docker-compose down -v
docker-compose up -d --build

# Если не помогло, очистите все
docker system prune -a --volumes
docker-compose up -d --build
```

### Backend не подключается к БД
```bash
# Проверьте, что PostgreSQL запустился
docker-compose ps
docker-compose logs postgres

# Проверьте health check
docker inspect quoteme-db | grep Health
```

### Изменения кода не применяются
```bash
# Пересоберите образы
docker-compose up -d --build

# Или пересоберите конкретный сервис
docker-compose up -d --build backend
```

## Production режим

Для production используйте отдельный docker-compose:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    # ... то же самое

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: npm start
    # ... остальное

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    # ... остальное
```

Запуск:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Бэкап и восстановление данных

### Создание бэкапа
```bash
docker-compose exec postgres pg_dump -U quoteme_user quoteme > backup.sql
```

### Восстановление
```bash
cat backup.sql | docker-compose exec -T postgres psql -U quoteme_user quoteme
```

## Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Размер образов и контейнеров
docker system df
```

---

Готово! Вся система работает в изолированных контейнерах.
Никаких конфликтов с вашей системой, легко запустить и остановить.
