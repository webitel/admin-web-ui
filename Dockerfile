FROM node:slim
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"

ENV VERSION

COPY src /admin
COPY docker-entrypoint.sh /

WORKDIR /admin
RUN npm install && npm cache clear

EXPOSE 10020
ENTRYPOINT ["/docker-entrypoint.sh"]
