FROM node:20-alpine 

WORKDIR /app

COPY package*.json ./

RUN npm install --production  # Install only production dependencies

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]