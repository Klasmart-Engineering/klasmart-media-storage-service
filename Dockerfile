FROM node:lts-alpine
WORKDIR /usr/src/app
COPY ./dist ./dist
COPY ./node_modules ./node_modules

ENV HUSKY=0
ENV PORT=8080
EXPOSE 8080
CMD node dist/src/index.js
