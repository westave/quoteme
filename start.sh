#!/bin/bash

echo "🚀 Запуск QuoteMe в Docker..."
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo "Установите Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен!"
    echo "Запустите Docker Desktop и попробуйте снова"
    exit 1
fi

echo "✅ Docker запущен"
echo ""

# Останавливаем старые контейнеры
echo "🧹 Очистка старых контейнеров..."
docker-compose down 2>/dev/null

# Запускаем сервисы
echo "📦 Запуск сервисов..."
docker-compose up -d

# Ждем запуска БД
echo "⏳ Ожидание запуска PostgreSQL..."
sleep 10

# Проверяем статус
echo ""
echo "📊 Статус сервисов:"
docker-compose ps

# Заполняем тестовыми данными
echo ""
read -p "Заполнить базу данных тестовыми данными? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Заполнение базы данных..."
    docker-compose exec -T backend npm run prisma:seed
fi

echo ""
echo "✅ Готово!"
echo ""
echo "🌐 Приложение доступно:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   Database:  localhost:5432"
echo ""
echo "👤 Тестовые аккаунты:"
echo "   Импортер:   importer@example.com / password123"
echo "   Экспедитор: forwarder@example.com / password123"
echo ""
echo "📋 Полезные команды:"
echo "   Логи:           docker-compose logs -f"
echo "   Остановить:     docker-compose down"
echo "   Перезапустить:  docker-compose restart"
echo "   Prisma Studio:  docker-compose exec backend npx prisma studio"
echo ""
