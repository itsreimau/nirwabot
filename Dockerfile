FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN node scripts/setup.js --skip-install
CMD ["npm", "start"]
