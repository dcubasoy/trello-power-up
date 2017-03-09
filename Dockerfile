FROM mhart/alpine-node:latest

ADD . .
EXPOSE 80
CMD ["node", "name-look-up-test2.js"]