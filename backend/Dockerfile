FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
COPY tsconfig.json ./
COPY nodemon.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем Prisma схему
COPY prisma ./prisma/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY src ./src/

EXPOSE 3001

# Команда для запуска в dev режиме
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
