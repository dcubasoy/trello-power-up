FROM mhart/alpine-node:latest

ADD . .
EXPOSE 80
CMD ["node", "server.js"]
