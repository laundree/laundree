FROM node:6
MAINTAINER Christian Budde Christensen <budde377@gmail.com>
RUN adduser --disabled-password --gecos "" laundree && \
    mkdir /opt/laundree && \
    chown -R laundree:laundree /opt/laundree && \
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash && \
    apt-get install git-lfs && \
    git lfs install
WORKDIR /opt/laundree
ENTRYPOINT bash
