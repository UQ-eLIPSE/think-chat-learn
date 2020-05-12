# build stage
FROM node:lts-alpine as build-stage
WORKDIR /client
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build_dev_watch

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]