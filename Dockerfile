FROM node:11-alpine as builder
EXPOSE 3000
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install
COPY . .
