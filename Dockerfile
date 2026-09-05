FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG REACT_APP_API_MATH_URL
ARG REACT_APP_API_LOGIN_URL
ENV REACT_APP_API_MATH_URL=$REACT_APP_API_MATH_URL
ENV REACT_APP_API_LOGIN_URL=$REACT_APP_API_LOGIN_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
