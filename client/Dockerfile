FROM node:12

ENV BASE_DIR=/var/www/think-chat-learn

WORKDIR ${BASE_DIR}/client

COPY package.json .

RUN yarn

CMD echo -e "\n\n======== Run \n\n\t'docker exec -it client-app /bin/bash'\n\n======== to log into the container ========\n"  && \
  cd ${BASE_DIR}/common && yarn && cd ${BASE_DIR}/client && yarn &&  yarn run build_dev_watch
