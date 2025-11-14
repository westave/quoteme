FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем конфигурационные файлы
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./

# Копируем исходный код
COPY src ./src/

EXPOSE 3000

# Команда для запуска в dev режиме
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
