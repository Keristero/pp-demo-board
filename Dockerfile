FROM node:14.17.0-buster

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN apt-get update && \
    apt-get install -y build-essential udev --no-install-recommends

RUN npm install

CMD ["npm","start"]