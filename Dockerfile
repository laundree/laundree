FROM node:6
MAINTAINER Christian Budde Christensen <budde377@gmail.com>
ENV PORT 3000
ENV REDIS_HOST 'redis'
ENV REDIS_PORT 6379
ENV MONGO_URL 'mongo://mongo/laundree'
ENV FACEBOOK_APP_ID ''
ENV FACEBOOK_APP_SECRET ''
ENV FACEBOOK_CALLBACK_URL ''
ENV GOOGLE_CLIENT_ID ''
ENV GOOGLE_CLIENT_SECRET ''
ENV GOOGLE_CALLBACK_URL ''
ENV SESSION_SECRET ''
ENV CODECLIMATE_REPO_TOKEN ''
EXPOSE 3000
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash && \
    apt-get install git-lfs && \
    git lfs install
RUN adduser --disabled-password --gecos "" laundree
COPY . /opt/laundree
WORKDIR /opt/laundree
RUN chown -R laundree:laundree /opt/laundree
USER laundree
RUN git lfs pull && npm install
CMD ["start"]
ENTRYPOINT ["npm"]
