FROM node:13-alpine

RUN mkdir -p /usr/src/api-cacher
WORKDIR /usr/src/api-cacher

COPY package*.json ./
RUN npm install

COPY . /usr/src/api-cacher
RUN npm run build

ENV NODE_ENV production

EXPOSE 8888
CMD ["npm", "start"]