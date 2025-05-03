# Dockerfile.simple
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY build/libs/voting-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080 9090
ENTRYPOINT ["java", "-jar", "app.jar"]