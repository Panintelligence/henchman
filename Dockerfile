FROM node:11

RUN mkdir -p /code/henchman-discord-bot
COPY src /code/henchman-discord-bot/bot
WORKDIR /code/henchman-discord-bot/bot
RUN npm install
ENTRYPOINT ["./entrypoint.sh"]
