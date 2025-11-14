# QuickStart - Запуск за 2 минуты 🚀

## Для macOS (самый простой способ)

### 1. Установите Docker Desktop

```bash
# Скачайте с официального сайта:
open https://www.docker.com/products/docker-desktop/

# Или через Homebrew:
brew install --cask docker
```

После установки **запустите Docker Desktop** из Applications.

### 2. Клонируйте репозиторий

```bash
git clone <repository-url>
cd quoteme
```

### 3. Запустите систему

#### Вариант А: Автоматический запуск (рекомендуется)

```bash
./start.sh
```

Скрипт автоматически:
- ✅ Проверит Docker
- ✅ Запустит все сервисы
- ✅ Применит миграции БД
- ✅ Заполнит тестовыми данными (опционально)

#### Вариант Б: Ручной запуск

```bash
# Запустить все сервисы
docker-compose up -d

# Подождать 10 секунд запуска БД, затем заполнить данными
docker-compose exec backend npm run prisma:seed
```

### 4. Откройте приложение

Откройте в браузере: **http://localhost:3000**

**Тестовые аккаунты:**
- 👔 Импортер: `importer@example.com` / `password123`
- 🚚 Экспедитор: `forwarder@example.com` / `password123`

---

## Готово! 🎉

Что дальше:
1. Войдите как импортер и создайте новый груз
2. Войдите как экспедитор и подайте ставку
3. Вернитесь к импортеру и закройте груз - все ставки откроются

---

## Полезные команды

```bash
# Посмотреть логи
docker-compose logs -f

# Посмотреть логи конкретного сервиса
docker-compose logs -f backend

# Остановить систему
docker-compose down

# Перезапустить
docker-compose restart

# Остановить и удалить всё (включая данные БД)
docker-compose down -v

# Пересобрать после изменений
docker-compose up -d --build

# Открыть Prisma Studio (GUI для БД)
docker-compose exec backend npx prisma studio
# Откроется на http://localhost:5555
```

---

## Решение проблем

### Порт занят (например 3000)

```bash
# Найти процесс
lsof -i :3000

# Остановить процесс или изменить порт в docker-compose.yml:
# - "3001:3000"  # Теперь доступно на порту 3001
```

### Docker не запускается

1. Откройте Docker Desktop
2. Подождите, пока не появится зеленый индикатор
3. Попробуйте снова

### Ошибки при запуске

```bash
# Полная перезагрузка
docker-compose down -v
docker-compose up -d --build

# Очистить весь Docker
docker system prune -a --volumes
```

### Код не обновляется

```bash
# Пересобрать образы
docker-compose up -d --build
```

---

## Структура

Система состоит из 3 контейнеров:

1. **PostgreSQL** (порт 5432) - База данных
2. **Backend** (порт 3001) - API сервер
3. **Frontend** (порт 3000) - Веб-интерфейс

Все работает изолированно в Docker, не затрагивая вашу систему.

---

## Разработка

Изменения в коде применяются автоматически:
- Редактируйте файлы в `backend/src` или `frontend/src`
- Сервисы автоматически перезапустятся
- Просто обновите страницу в браузере

Hot reload работает из коробки! 🔥

---

Подробная документация: см. [DOCKER_SETUP.md](./DOCKER_SETUP.md)
