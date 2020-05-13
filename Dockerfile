FROM node:12

WORKDIR /var/www/think-chat-learn/server

COPY package.json .

# Run npm and install packages
RUN npm i

# Keep the container running
CMD echo -e "\n\n======== Run \n\n\t'docker exec -it admin-app /bin/bash'\n\n======== to log into the container ========\n"  && \
  npm run build
