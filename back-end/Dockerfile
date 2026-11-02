FROM node:22-alpine

WORKDIR /app

# Camada de dependências separada: só reinstala quando o package-lock muda
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
