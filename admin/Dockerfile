FROM node:12

ENV BASE_DIR=/var/www/think-chat-learn

WORKDIR ${BASE_DIR}/admin

COPY package.json .

# Run yarn and install packages
RUN yarn

# Keep the container running
CMD echo -e "\n\n======== Run \n\n\t'docker exec -it admin-app /bin/bash'\n\n======== to log into the container ========\n"  && \
  cd ${BASE_DIR}/common && yarn && cd ${BASE_DIR}/admin && yarn &&  yarn run build_dev && yarn serve
