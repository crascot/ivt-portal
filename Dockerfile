FROM node:20-alpine AS builder

ARG API_BASE_URL
ENV API_BASE_URL=${API_BASE_URL}

WORKDIR /app

COPY package.json ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80