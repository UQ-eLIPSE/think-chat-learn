FROM node:12

WORKDIR /var/www/think-chat-learn/client
COPY package.json .

RUN npm i

CMD echo -e "\n\n======== Run \n\n\t'docker exec -it client-app /bin/bash'\n\n======== to log into the container ========\n" && \
tail -f /dev/null