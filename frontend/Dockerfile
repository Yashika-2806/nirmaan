FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG BACKEND_URL=http://nirmaan-backend:5000
ENV BACKEND_URL=${BACKEND_URL}

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
