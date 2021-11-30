FROM node:17-alpine
WORKDIR /usr/src/app

RUN apk upgrade && \
    apk add tzdata

RUN npm install nodemon -g

COPY . .

CMD ["npm", "run", "dev"]