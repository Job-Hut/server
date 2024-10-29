FROM node:latest

USER node

WORKDIR /app

COPY --chown=node . .

RUN npm ci && npm run build

CMD ["npm","start"]