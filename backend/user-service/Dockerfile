######################## build stage ########################
FROM maven:3.9.6-eclipse-temurin-21 AS build

# 整个 backend 目录会在 /backend
WORKDIR /backend

# ====== 1) 复制父 POM + 公共模块 + 当前服务 ======
COPY pom.xml ./pom.xml
COPY common ./common
COPY user-service/pom.xml ./user-service/pom.xml
COPY user-service/src ./user-service/src

# ====== 2) 打包 user-service（会自动编译 common）======
RUN mvn -pl user-service -am -B package -DskipTests

######################## run stage ##########################
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 把构建产物复制进运行镜像
COPY --from=build \
     /backend/user-service/target/user-service-1.0.0-SNAPSHOT.jar \
     app.jar

ENTRYPOINT ["java","-jar","/app/app.jar"]
