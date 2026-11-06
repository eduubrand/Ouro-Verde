# Etapa 1: compila o projeto com Maven (nao precisa ter Java instalado na maquina)
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build
COPY pom.xml .
# Baixa as dependencias numa camada separada (builds seguintes ficam mais rapidos).
# As opcoes de retry evitam falha quando a internet oscila durante o download.
RUN mvn -q -B -Dmaven.wagon.http.retryHandler.count=5 dependency:resolve dependency:resolve-plugins || true
COPY src ./src
RUN mvn -q -B -Dmaven.wagon.http.retryHandler.count=5 package -DskipTests

# Etapa 2: imagem final, so com o Java e o .jar
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /build/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
# Planos gratis tem pouca memoria (ex.: 512 MB no Render). Limita o Java a 75% dela.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
ENTRYPOINT ["java", "-jar", "app.jar"]
