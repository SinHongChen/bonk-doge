FROM node:17-alpine
WORKDIR /usr/src/app

RUN apk upgrade && \
    apk add tzdata

RUN npm install nodemon -g

COPY ./package* ./

RUN npm install

CMD ["npm", "run", "dev"]