# Usa imagem Debian slim (recomendado pelo Render)
FROM node:18-slim

# Diretório de trabalho
WORKDIR /app

# Copia package.json primeiro (melhor cache)
COPY backend/package*.json ./backend/

# Instala dependências
WORKDIR /app/backend
RUN npm install

# Copia o resto do projeto
WORKDIR /app
COPY . .

# Render usa a variável PORT
EXPOSE 10000

# Comando de start
CMD ["node", "backend/start.js"]

