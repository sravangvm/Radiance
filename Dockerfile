
FROM node:14


WORKDIR /usr/src/app


COPY package*.json ./


RUN npm install


COPY . .


EXPOSE 3000

# Specify the command to run your application
CMD ["node", "app.js"]
