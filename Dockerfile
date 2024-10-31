FROM node:lts AS build

USER node

WORKDIR /app

COPY --chown=node . .

RUN npm ci && npm run build

CMD ["npm","start"]

FROM node:alpine AS production

USER node

WORKDIR /app

COPY --from=build /app/dist .

CMD ["node","index.js"]