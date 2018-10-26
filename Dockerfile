FROM node:9

RUN mkdir -p /code/henchman-discord-bot
COPY src /code/henchman-discord-bot/bot
VOLUME /code/henchman-discord-bot/bot
WORKDIR /code/henchman-discord-bot/bot
RUN npm install
ENTRYPOINT ["./entrypoint.sh"]