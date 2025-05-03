# Dockerfile.simple
FROM eclipse-temurin:21-jre-jammy

USER root

RUN apt-get update \
 && apt-get install -y --no-install-recommends netcat-openbsd \
 && rm -rf /var/lib/apt/lists/* \

WORKDIR /app

COPY build/libs/blockchain-service-0.0.1-SNAPSHOT.jar app.jar

COPY wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

EXPOSE 8080 9090
ENTRYPOINT ["wait-for-it", "ganache:8545", "--", "java", "-Dorg.web3j.ens.enabled=false", "-jar", "app.jar"]