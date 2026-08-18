FROM node:20

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install
RUN npm run setup

COPY . .

CMD ["node", "index.js"]