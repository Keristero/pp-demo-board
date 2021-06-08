FROM node:14.17.0-buster

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY . .
#COPY package*.json ./

RUN apt-get install nodejs-legacy

RUN apt-get install build-essential

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source

#EXPOSE 3000

CMD ["npm","start"]