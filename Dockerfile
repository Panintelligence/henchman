FROM node:9

RUN mkdir -p /code/discord-builder-bot
COPY bot /code/discord-builder-bot/bot
VOLUME /code/discord-builder-bot/bot
WORKDIR /code/discord-builder-bot/bot
RUN npm install
ENTRYPOINT ["entrypoint.sh"]