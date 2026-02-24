# Cloud-Native Fraud Detection Command Center

Production-grade, real-time fraud detection platform with:
- Hybrid fraud scoring (rule engine + ML anomaly detection)
- Explainable AI outputs
- Autonomous fraud alerts
- Device fingerprint tracking
- Live websocket updates
- Professional fintech dashboard with radar map and analytics

## Architecture

- `frontend`: React + TypeScript + Tailwind + Recharts + React-Leaflet
- `api-gateway`: Node.js + Express + TypeScript
- `ml-service`: FastAPI + Isolation Forest
- `mongo`: primary document store (`transactions`, `fraud_alerts`, `user_devices`, `fraud_explanations`)
- `redis`: pub/sub for real-time event fanout
- Docker Compose for local runtime
- Azure deployment assets for Container Apps + ACR + Cosmos DB + Redis

## Core Features

- Authentication: JWT login + RBAC (`admin`, `analyst`)
- Transaction processing: create/list/stats
- Risk scoring: weighted rules + ML anomaly score
- Explainable AI: per-transaction explanation factors with impact
- Real-time command center:
  - websocket channels: `transactions.live`, `fraud.alerts`, `simulation.events`
  - live radar map markers with fraud-safe color coding
  - live alerts, charts, and transaction table refresh
- Simulation mode: generates controlled fraud/legit patterns
- Autonomous response: creates and publishes fraud alerts above threshold
- Observability: structured logs, request IDs, `/health`, `/metrics`

## API Endpoints

- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- Transactions:
  - `POST /api/v1/transactions`
  - `GET /api/v1/transactions`
  - `GET /api/v1/transactions/stats`
- Simulation:
  - `POST /api/v1/simulation/start`
- Monitoring:
  - `GET /api/v1/alerts`
  - `GET /api/v1/devices`
  - `GET /api/v1/explanations`
- Platform:
  - `GET /health`
  - `GET /metrics`

## Local Run (Docker)

1. Create environment file:
```bash
cp .env.example .env
```

2. Build and start:
```bash
docker compose down
docker compose up --build -d
```

3. Open:
- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:8080`
- ML Service: `http://localhost:8000`
- API Health: `http://localhost:8080/health`
- API Metrics: `http://localhost:8080/metrics`

## Environment Variables

Main runtime variables:
- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `REDIS_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ML_SERVICE_URL`
- `ALLOWED_ORIGINS`
- `HIGH_AMOUNT_THRESHOLD`
- `VELOCITY_WINDOW_MINUTES`
- `VELOCITY_TX_THRESHOLD`
- `SCORE_RULE_WEIGHT`
- `SCORE_ML_WEIGHT`
- `AUTONOMOUS_ALERT_THRESHOLD`

Frontend build variables:
- `VITE_API_URL`
- `VITE_WS_URL`

## Azure Deployment

Azure assets are provided in:
- `azure/env.template`
- `azure/containerapps.yaml` (reference template)
- `azure/deploy.sh` (automated deployment)

### Prerequisites

- Azure CLI (`az`)
- Docker
- `curl`
- `python3`
- Azure subscription with permissions to create:
  - Resource Group
  - Azure Container Registry
  - Azure Container Apps Environment and apps
  - Azure Cosmos DB (Mongo API)
  - Azure Cache for Redis

### Deploy Steps

1. Create Azure env file:
```bash
cp azure/env.template azure/.env
```

2. Update `azure/.env` values:
- `AZ_RESOURCE_GROUP`, `AZ_LOCATION`
- `AZ_ACR_NAME`
- `AZ_COSMOS_ACCOUNT`, `AZ_COSMOS_DB_NAME`
- `AZ_REDIS_NAME`
- `AZ_FRONTEND_APP`, `AZ_API_APP`, `AZ_ML_APP`
- `JWT_SECRET` (use a strong secret)

3. Run deployment:
```bash
bash azure/deploy.sh
```

### What `azure/deploy.sh` Automates

- `az login` and subscription selection
- Resource group creation
- ACR creation and login
- Cosmos DB Mongo API account + database setup
- Azure Redis setup
- Container Apps environment creation
- Docker build and push:
  - `<registry>.azurecr.io/frontend:<tag>`
  - `<registry>.azurecr.io/api-gateway:<tag>`
  - `<registry>.azurecr.io/ml-service:<tag>`
- Container Apps deployment:
  - `ml-service` internal ingress (`8000`)
  - `api-gateway` external ingress (`8080`)
  - `frontend` external ingress (`80`)
- Post-deploy verification:
  - frontend reachable
  - API health reachable
  - auth/login works
  - transaction creation works
  - simulation endpoint works

### Azure Output URLs

At the end of deployment, the script prints:
- Frontend URL
- API Gateway URL
- ML Service URL

## Notes

- `MONGO_URI` is environment-driven and compatible with Azure Cosmos DB Mongo API.
- `REDIS_URI` is environment-driven and supports Azure Redis (`rediss://...`).
- Existing local Docker workflow remains unchanged.
