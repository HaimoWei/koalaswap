# syntax=docker/dockerfile:1

FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY common-service/pom.xml common-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY product-service/pom.xml product-service/pom.xml
COPY file-service/pom.xml file-service/pom.xml
COPY order-service/pom.xml order-service/pom.xml
COPY review-service/pom.xml review-service/pom.xml
COPY chat-service/pom.xml chat-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml
RUN mvn -pl product-service -am -B dependency:go-offline

COPY . ./
RUN mvn -pl product-service -am -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=
COPY --from=build /workspace/product-service/target/product-service-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
