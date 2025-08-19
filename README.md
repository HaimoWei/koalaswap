# KoalaSwap 🐨

KoalaSwap is a mobile-first second-hand trading platform tailored for the Australian market. It enables users to easily list, browse, and search for second-hand goods through a clean and secure interface.

## 🌟 Features

- 📱 **Mobile App** built with React Native + TypeScript
- 🧠 **Backend API** powered by Spring Boot + Java
- 💾 PostgreSQL database with Redis caching (optional)
- 🔒 JWT-based user authentication and email verification
- 🔍 Full-text search and filtering for products
- 📦 Image upload support (local or S3)
- 🐳 Dockerized setup for development and deployment
- ☁️ CI/CD pipeline via GitHub Actions + AWS ECS

## 🧱 Tech Stack

| Layer      | Technology                               |
|------------|-------------------------------------------|
| Frontend   | React Native, TypeScript                  |
| Backend    | Java, Spring Boot                         |
| Database   | PostgreSQL                                |
| Caching    | Redis (optional)                          |
| DevOps     | Docker, GitHub Actions, AWS ECS           |
| Testing    | JUnit, Jest, Cypress                      |

## 🗂️ Project Structure

```
koalaswap/
├── backend/
│   ├── common/              # Shared utilities & constants
│   └── user-service/        # User API service (register/login/profile)
├── frontend/                # React Native app
├── infra/                   # docker-compose & infra setup
├── database/                # DB schema or seed files
├── docs/                    # API docs and specifications
```

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose installed
- Node.js and Java 21 if developing locally

### Run with Docker

```bash
# Start all services
docker-compose up --build
```

App will be available at: `http://localhost:8080`

### Environment Variables

Ensure you have a `.env` file at the root for Spring Boot:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/koalaswap_dev
SPRING_DATASOURCE_USERNAME=koalaswap
SPRING_DATASOURCE_PASSWORD=secret
```

## 🧪 Testing

- Run backend tests: `./mvnw test`
- Run frontend tests: `npm test` or `npx cypress open`

## 📄 License

This project is licensed under the MIT License.


./mvnw -pl product-service -am clean package -DskipTests
./mvnw -pl product-service spring-boot:run -Dspring-boot.run.profiles=local

./mvnw -pl common -am -DskipTests clean install
./mvnw -pl user-service -DskipTests clean compile
./mvnw -pl product-service -DskipTests clean compile
./mvnw -pl order-service -DskipTests clean compile
./mvnw -pl review-service -DskipTests clean compile
./mvnw -pl user-service spring-boot:run -Dspring-boot.run.profiles=local
./mvnw -pl product-service spring-boot:run -Dspring-boot.run.profiles=local
./mvnw -pl order-service spring-boot:run -Dspring-boot.run.profiles=local
./mvnw -pl review-service spring-boot:run -Dspring-boot.run.profiles=local

docker compose down -v
docker compose up -d db
docker logs -f koalaswap-pg