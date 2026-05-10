FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
RUN npm install

COPY . .
WORKDIR /app/apps/api
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start:prod"]
