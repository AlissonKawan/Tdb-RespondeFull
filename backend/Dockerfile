FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN if [ -f mvnw ]; then chmod +x mvnw && ./mvnw package -DskipTests; else mvn package -DskipTests; fi

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/quarkus-app/ ./target/quarkus-app/

EXPOSE 8080

CMD ["java", "-jar", "target/quarkus-app/quarkus-run.jar"]
