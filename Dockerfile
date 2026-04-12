# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache gettext

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/esquinarevis-front/browser /usr/share/nginx/html
COPY docker/start.sh /start.sh

RUN chmod +x /start.sh

ENV API_URL=http://localhost:3000/api
EXPOSE 80

CMD ["/start.sh"]
