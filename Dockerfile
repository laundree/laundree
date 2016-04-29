FROM node:6
MAINTAINER Christian Budde Christensen <budde377@gmail.com>
EXPOSE 3000
RUN adduser --disabled-password --gecos "" laundree
COPY . /opt/laundree
WORKDIR /opt/laundree
RUN chown -R laundree:laundree /opt/laundree
USER laundree
RUN npm install
CMD ["start"]
ENTRYPOINT ["npm"]
