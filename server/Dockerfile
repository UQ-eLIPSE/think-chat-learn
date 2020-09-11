FROM node:12

ENV BASE_DIR=/var/www/think-chat-learn

WORKDIR ${BASE_DIR}/server

COPY package.json yarn.lock* ./

# Run yarn and install packages
RUN yarn

CMD echo -e "\n\n======== Run \n\n\t'docker exec -it server-app /bin/bash'\n\n======== to log into the container ========\n"  && \
  cd ${BASE_DIR}/common && yarn && cd ${BASE_DIR}/server && yarn && yarn run build_server_main && yarn start