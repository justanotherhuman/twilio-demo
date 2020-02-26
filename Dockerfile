
FROM node:alpine

# Create app directory
WORKDIR /

#Install app dependencies
COPY package*.json ./

RUN npm install 
# RUN pwd

# COPY init-letsencrypt.sh ./
# RUN ls
# RUN chmod +x init-letsencrypt.sh 
# RUN ./init-letsencrypt.sh

#Bundle app source
COPY . .

EXPOSE 3456

CMD ["npm", "run", "start"]