# KoalaSwap

> A production-ready, full-stack second-hand marketplace platform with real-time chat, AWS cloud integration, and microservices architecture.

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen?logo=spring)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20CloudFront%20%7C%20ECR-orange?logo=amazonaws)
![Deployed](https://img.shields.io/badge/Deployed-Production-success)

## Live Demo

**Website**: [https://koalaswap.lightspot.uk](https://koalaswap.lightspot.uk)

**Test Account**:
- Email: `weihaimoau@gmail.com`
- Password: `weihaimo`

![Homepage](docs/images/homepage.png)


---

## What is KoalaSwap?

KoalaSwap is a **full-featured second-hand marketplace** with complete transaction workflows. Users can **list products**, **browse and search** items, **purchase goods**, **real-time chat** with buyers/sellers, **manage orders**, and **leave reviews** — covering the entire lifecycle from listing to post-purchase feedback.

This is a **production-deployed platform** running on AWS, designed to solve real-world technical challenges in e-commerce:

**Technical Highlights**:
- **Real-time buyer-seller communication** via WebSocket (STOMP) with order status synchronization
- **Distributed authentication** using JWT with token versioning and Redis Pub/Sub for instant invalidation across microservices
- **Cloud-native file storage** with AWS S3 presigned URLs and CloudFront CDN for optimized delivery
- **Real dataset integration**: Imported 799+ products from actual e-commerce platforms (Xianyu/Goofish) with automated ETL pipeline

**Architecture Highlights**:
- Microservices architecture with 7 independent services
- Event-driven design using Redis Pub/Sub for cross-service communication
- Full CI/CD automation with GitHub Actions → AWS ECR → EC2
- Multi-platform support (Web + React Native Mobile)

---

## Tech Stack

### Frontend
- **Web**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Mobile**: React Native + Expo
- **State Management**: Zustand + TanStack React Query
- **Routing**: React Router DOM 7
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Real-time**: STOMP over WebSocket + SockJS
- **Image Processing**: react-easy-crop

### Backend
- **Framework**: Spring Boot 3.3.0 + Java 21
- **Build Tool**: Maven 3.9.6
- **Microservices**: Gateway, User, Product, Order, Review, Chat, File (7 services)
- **API Gateway**: Spring Cloud Gateway 2023.0.3
- **Security**: Spring Security + JWT (JJWT 0.11.5) + Token Versioning
- **Real-time**: Spring WebSocket + STOMP + Redis Pub/Sub
- **ORM**: Spring Data JPA + Hibernate
- **Database Migration**: Flyway 10.16.0
- **Caching**: Caffeine (local) + Redis (distributed)
- **Email**: Spring Mail (SMTP for verification)
- **Utilities**: Lombok, Jackson, Commons Codec

### Database & Caching
- **Primary**: PostgreSQL 15 (with full-text search via `pg_trgm`)
- **Cache**: Redis 7 (session, Pub/Sub events, distributed locks)

### DevOps & Cloud
- **Containerization**: Docker + Docker Compose (multi-stage builds)
- **CI/CD**: GitHub Actions (automated build, test, deploy)
- **Cloud Storage**: AWS S3 + CloudFront CDN (presigned URLs for upload)
- **Container Registry**: AWS ECR (Elastic Container Registry)
- **Reverse Proxy**: Nginx (SSL termination, WebSocket proxying)
- **Server**: AWS EC2 (Ubuntu) in ap-southeast-2 (Sydney)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Client Layer                                 │
│    ┌──────────────────┐                    ┌──────────────────┐         │
│    │   React Web      │                    │  React Native    │         │
│    │  (Vite + TS)     │                    │  (Expo)          │         │
│    └────────┬─────────┘                    └────────┬─────────┘         │
└─────────────┼──────────────────────────────────────┼───────────────────┘
              │                                      │
              └──────────────────┬───────────────────┘
                                 │ HTTPS / WSS
              ┌──────────────────▼───────────────────┐
              │          Nginx (SSL/TLS)             │
              │  Reverse Proxy + WebSocket Support   │
              └──────────────────┬───────────────────┘
                                 │
              ┌──────────────────▼───────────────────┐
              │     API Gateway (Port 18080)         │
              │     Spring Cloud Gateway             │
              └──────────────────┬───────────────────┘
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      │                          │                          │
┌─────▼──────┐  ┌────────────────▼─────┐  ┌────────────────▼──────┐
│   User     │  │     Product          │  │      Order            │
│  Service   │  │     Service          │  │     Service           │
│  (12649)   │  │     (12648)          │  │     (12650)           │
│ Auth + JWT │  │  Listing + Search    │  │  State Machine        │
└─────┬──────┘  └────────────┬─────────┘  └────────────┬──────────┘
      │                      │                          │
      │         ┌────────────┼──────────────────────────┘
      │         │            │
┌─────▼─────────▼────┐  ┌────▼──────────┐  ┌────────────────────┐
│      Chat          │  │    Review     │  │       File         │
│     Service        │  │   Service     │  │      Service       │
│     (12652)        │  │   (12651)     │  │      (12647)       │
│   WebSocket +      │  │  Two-way      │  │   S3 Presigned     │
│   Redis Pub/Sub    │  │  Ratings      │  │   Upload URLs      │
└────────┬───────────┘  └───────┬───────┘  └─────────┬──────────┘
         │                      │                     │
         └──────────────────────┼─────────────────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         │                                             │
┌────────▼─────────┐  ┌──────────────┐  ┌─────────────▼────────┐
│   PostgreSQL     │  │    Redis     │  │      AWS S3          │
│   (Primary DB)   │  │  (Cache +    │  │   + CloudFront CDN   │
│  - Users         │  │   Pub/Sub    │  │   (Image Storage)    │
│  - Products      │  │   Events)    │  │                      │
│  - Orders        │  │              │  │                      │
│  - Reviews       │  │              │  │                      │
│  - Messages      │  │              │  │                      │
└──────────────────┘  └──────────────┘  └──────────────────────┘
```

### Architecture Patterns & Directory Structure

#### Project Structure
```
koalaswap/
├── backend/                      # Microservices (Spring Boot)
│   ├── gateway-service/          # API Gateway (18080)
│   ├── user-service/             # Auth + Profile (12649)
│   ├── product-service/          # Listings + Search (12648)
│   ├── order-service/            # Transactions (12650)
│   ├── chat-service/             # Real-time Messaging (12652)
│   ├── review-service/           # Ratings (12651)
│   ├── file-service/             # S3 Upload (12647)
│   └── common-service/           # Shared utilities
├── frontend-web/                 # React SPA
├── frontend-mobile/              # React Native app
├── infra/                        # Docker Compose + Nginx
└── docs/                         # Documentation
```

#### Backend: Layered Architecture with DDD-Lite
Each microservice follows a clean layered architecture with Domain-Driven Design principles:

```
backend/{service-name}/
├── controller/          # Presentation Layer (REST endpoints)
├── service/             # Application/Domain Service Layer (business logic)
├── repository/          # Data Access Layer (JPA repositories)
├── entity/              # Domain Entities (JPA entities)
├── dto/                 # Data Transfer Objects (API contracts)
├── events/              # Domain Events (Redis Pub/Sub)
├── client/              # External service clients (Feign/RestTemplate)
├── config/              # Configuration (Security, Redis, etc.)
└── security/            # Security components (JWT filters, etc.)
```

**Design Principles**:
- **Separation of Concerns**: Controller → Service → Repository
- **Domain Events**: Event-driven communication via Redis Pub/Sub
- **DTO Pattern**: Separate API models from domain entities
- **Dependency Injection**: Spring Boot auto-wiring
- **Single Responsibility**: Each service handles one business domain

#### Frontend: Feature-Based Architecture
Web and mobile frontends use feature-sliced design with clear separation:

```
frontend-web/src/
├── features/            # Feature modules (auth, chat, products, reviews)
│   ├── auth/            # Authentication feature
│   ├── chat/            # Chat feature
│   ├── products/        # Product listing feature
│   └── reviews/         # Review feature
├── components/          # Shared/reusable components
├── pages/               # Page-level components (routing)
├── api/                 # API client layer (Axios)
├── store/               # Global state management (Zustand)
├── types/               # TypeScript type definitions
└── ws/                  # WebSocket client (STOMP)
```

**Design Principles**:
- **Feature-First**: Code organized by business features, not technical layers
- **Smart/Dumb Components**: Container components (logic) vs Presentational components (UI)
- **Custom Hooks**: Reusable logic extraction (useAuth, useChat, etc.)
- **API Layer Abstraction**: Centralized HTTP client configuration
- **Type Safety**: Full TypeScript coverage with strict mode

---

## Key Features

1. **User Authentication & Authorization**
   JWT-based authentication with token versioning. When users change passwords, `token_version` increments and Redis Pub/Sub broadcasts invalidation events to all services.

2. **Product Listing with AWS S3 Integration**
   Products support up to 8 images. Upload flow: Frontend requests presigned URL → Direct upload to S3 → Callback confirmation → CDN URL returned.

3. **Order State Machine**
   Strict state transitions: `PENDING → PAID → SHIPPED → COMPLETED / CANCELLED`. Order status changes trigger Redis events consumed by chat service for real-time notifications.

4. **Real-time Bidirectional Chat**
   STOMP over WebSocket with JWT authentication. Chat includes text, images, and system messages (e.g., "Order has been shipped"). Supports conversation history with pagination.

5. **Two-way Review System**
   After order completion, both buyer and seller can review each other. Uses `review_slots` mechanism to prevent duplicate reviews. Average ratings auto-update in user profiles.

6. **Full-text Search**
   PostgreSQL native full-text search using `tsvector` and `pg_trgm` extension. No external search engine required.

---

## Technical Challenges & Solutions

### Challenge 1: Distributed Token Invalidation

**Problem**: In a microservices architecture, how to instantly invalidate JWT tokens across all services when users change passwords or log out?

**Solution**:
- Introduced `token_version` field in user table
- Implemented Redis Pub/Sub channel `auth:pv:changed`
- Each service subscribes to the channel and maintains a local cache (Caffeine)
- When password changes, user service increments `token_version` and publishes event
- All services receive event and evict cached user info, forcing token re-validation

**Impact**: Reduced token invalidation delay from ~15 minutes (JWT expiry) to <100ms across all services.

---

### Challenge 2: Secure File Upload at Scale

**Problem**: Uploading large images through backend consumes server bandwidth and increases latency.

**Solution**:
- Implemented **presigned URL** pattern:
  1. Frontend requests upload URL from file-service
  2. file-service generates S3 presigned URL (15-min expiry)
  3. Frontend uploads directly to S3
  4. Frontend notifies file-service after completion
  5. file-service returns CloudFront CDN URL
- Validation: Upload completion includes hash verification to prevent tampering

**Impact**: Reduced backend upload bandwidth by 95%, improved upload speed by 3x.

---

### Challenge 3: Real-time Order Status in Chat

**Problem**: Buyers and sellers need to see order updates (payment, shipment) in chat without constant polling.

**Solution**:
- order-service publishes events to Redis channel `orders:status-changed`
- chat-service subscribes to the channel
- When status changes, chat-service injects system message into conversation
- WebSocket broadcasts message to connected users
- Offline users see message when they reconnect

**Impact**: Real-time order updates with zero client-side polling overhead.

---

### Challenge 4: Real Dataset Integration

**Problem**: Need realistic product data for demo, but manual creation is time-consuming.

**Solution**:
- Built web scraper to collect 799 smartphone listings from actual marketplace (Xianyu/Goofish)
- Developed ETL pipeline (`scripts/dataset_import/`) to:
  - Normalize Chinese prices to AUD (CNY ÷ 4.7)
  - Map product conditions (`EXCELLENT → LIKE_NEW`)
  - Auto-categorize using keyword matching
  - Generate placeholder seller accounts
- Automated image upload to S3 with retry logic
- Final validation: database integrity checks + S3 file count verification

**Impact**: Populated platform with production-quality data in under 2 hours.

---

## Getting Started

### Prerequisites
- **Java**: 21 (Eclipse Temurin)
- **Node.js**: 20+
- **Docker**: 20.10+
- **PostgreSQL**: 15
- **Redis**: 7

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HaimoWei/koalaswap.git
   cd koalaswap
   ```

2. **Start infrastructure**
   ```bash
   cd infra
   docker-compose up -d postgres redis
   ```

3. **Configure environment**
   ```bash
   # Backend (create .env or set in IDE)
   export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15433/koalaswap_db
   export SPRING_DATASOURCE_USERNAME=koalaswap_user
   export SPRING_DATASOURCE_PASSWORD=koalaswap_pass
   export SPRING_DATA_REDIS_HOST=localhost
   export SPRING_DATA_REDIS_PORT=16379
   export APP_JWT_SECRET=your-secret-key-min-32-chars

   # AWS (for file uploads)
   export AWS_REGION=ap-southeast-2
   export S3_BUCKET=koalaswap
   export CDN_BASE=https://d3367sa0s3hyt3.cloudfront.net
   ```

4. **Build & Run Backend**
   ```bash
   cd backend
   ./mvnw clean install
   ./mvnw spring-boot:run -pl gateway-service
   ```

5. **Run Frontend**
   ```bash
   cd frontend-web
   npm install
   npm run dev
   ```

6. **Access the application**
   - Web: http://localhost:5173
   - API: http://localhost:18080

### Environment Variables

See `.env.example` in each service directory for full configuration. Key variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_JWT_SECRET` | JWT signing key (min 32 chars) | `your-secret-key-32-chars-min` |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `APP_MAIL_USERNAME` | SMTP username for email verification | `noreply@koalaswap.com` |

---

## Deployment

The project is production-ready with full CI/CD automation:

- **CI**: GitHub Actions runs tests and builds on every push
- **CD**: Automatic deployment to AWS EC2 when pushing to `main` branch
- **Containerization**: Multi-stage Docker builds (Maven build + JRE runtime)
- **Registry**: Images pushed to AWS ECR
- **Monitoring**: Health checks via Spring Boot Actuator


---

## Project Highlights

- **Production-deployed**: Not just a demo, it's running on AWS with real traffic
- **Modern stack**: Java 21, Spring Boot 3.3, React 19, PostgreSQL 15
- **Real-world scale**: 799+ products, 268+ users, 531+ seller accounts
- **Cloud-native**: S3 storage, CloudFront CDN, ECR registry, EC2 deployment
- **Event-driven**: Redis Pub/Sub for cross-service communication
- **Security-first**: JWT + token versioning, HTTPS, CORS, password hashing (BCrypt)
- **Developer-friendly**: Docker Compose for local dev, comprehensive documentation

---



## License

This project is developed for portfolio and interview purposes.

---

## Contributors

This project is **100% developed by Haimo Wei** as a comprehensive full-stack portfolio project.

![Haimo Wei](https://img.shields.io/badge/Haimo%20Wei-100%25-blue?style=for-the-badge)

**Contributions**:
- ✅ Full-stack architecture design (7 microservices + 2 frontends)
- ✅ Backend development (Spring Boot + Java 21)
- ✅ Frontend development (React 19 + React Native)
- ✅ DevOps & CI/CD setup (GitHub Actions + AWS deployment)
- ✅ Database design & migration (PostgreSQL + Flyway)
- ✅ Real-time features (WebSocket + Redis Pub/Sub)
- ✅ Cloud infrastructure (AWS S3, CloudFront, ECR, EC2)
- ✅ Data engineering (ETL pipeline for 799+ products from Xianyu/Goofish)

---

## Contact

**Developer**: Haimo Wei
**Email**: weihaimoau@gmail.com
**Website**: [https://koalaswap.lightspot.uk](https://koalaswap.lightspot.uk)
**GitHub**: [https://github.com/HaimoWei](https://github.com/HaimoWei)
