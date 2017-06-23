FROM laundree/base:latest
MAINTAINER Christian Budde Christensen <budde377@gmail.com>
ENV PORT=3000 \
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
ARG NODE_ENV
EXPOSE 3000
ADD package.json package.json
RUN npm install --silent
ADD . .
RUN chown -R laundree:laundree .
USER laundree
RUN git remote set-url origin https://github.com/laundree/laundree && \
    npm run build
CMD ["start"]
ENTRYPOINT ["npm"]
