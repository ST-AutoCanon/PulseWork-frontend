# my-app/Dockerfile (dev-friendly)
FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache bash

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001

# dev command (ensure package.json has "dev")
CMD ["npm", "run", "dev"]
