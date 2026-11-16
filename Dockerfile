FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG REACT_APP_API_MATH_URL
ARG REACT_APP_API_LOGIN_URL
ARG REACT_APP_SITE_ASSETS_MODE=local
ENV REACT_APP_API_MATH_URL=$REACT_APP_API_MATH_URL
ENV REACT_APP_API_LOGIN_URL=$REACT_APP_API_LOGIN_URL
ENV REACT_APP_SITE_ASSETS_MODE=$REACT_APP_SITE_ASSETS_MODE
RUN npm run build

FROM nginx:1.30.6-alpine-slim@sha256:e2355aa95529a7999dad94ddcb45a8768abf6fb0b204c93b1a3ffce477d7b893
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
