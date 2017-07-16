FROM debian:stretch-slim

ENV NVM_DIR=/home/laundree/.nvm \
    NODE_VERSION=8.1.4 \
    NODE_PATH=$NVM_DIR/v$NODE_VERSION/lib/node_modules \
    PATH=$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH \
    PORT=3000 \
    REDIS_HOST='redis' \
    REDIS_PORT=6379 \
    MONGO_URL='mongo://mongo/laundree' \
    FACEBOOK_APP_ID='' \
    FACEBOOK_APP_SECRET='' \
    FACEBOOK_CALLBACK_URL='' \
    GOOGLE_CLIENT_ID='' \
    GOOGLE_CLIENT_SECRET='' \
    GOOGLE_CALLBACK_URL='' \
    SESSION_SECRET='' \
    GOOGLE_CLIENT_API_KEY='' \
    GOOGLE_SERVER_API_KEY='' \
    CODECLIMATE_REPO_TOKEN=''

RUN apt-get update \
&&  apt-get install -y curl git \
&&  apt-get -y autoclean \
&&  adduser --disabled-password --gecos "" laundree \
&&  mkdir /opt/laundree \
&&  chown -R laundree:laundree /opt/laundree

WORKDIR /opt/laundree

USER laundree

ARG NODE_ENV
EXPOSE 3000
ADD package.json package-lock.json ./
RUN bash -c " \
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash \
&&  . $NVM_DIR/nvm.sh \
&&  nvm install $NODE_VERSION \
&&  nvm alias default $NODE_VERSION \
&&  nvm use default \
&&  npm i -g npm@latest \
&&  npm install --silent"
ADD . .
USER root
RUN chown -R laundree:laundree .
USER laundree
RUN git remote set-url origin https://github.com/laundree/laundree \
&&  bash -c ". $NVM_DIR/nvm.sh && npm run build"
ENTRYPOINT ["bash"]
CMD ["-c", ". $NVM_DIR/nvm.sh && npm start"]
