FROM node:8.12.0-alpine
WORKDIR /usr/src/app
ADD https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VSN:-v1.11.2}/bin/linux/amd64/kubectl /usr/src/app/kubectl
RUN chmod 777 /usr/src/app/kubectl
COPY package.json /usr/src/app
RUN npm install --production && npm cache clean --force
# See .dockerignore for exclusions
COPY . /usr/src/app
EXPOSE 5000
CMD ["node", "app.js"]
