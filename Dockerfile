FROM mhart/alpine-node:14
EXPOSE 3000
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install
COPY . .
