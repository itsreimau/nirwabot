FROM node:20

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

RUN npm run setup

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["node", "index.js"]