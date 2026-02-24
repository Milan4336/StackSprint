# Cloud-Native Fraud Detection Command Center

Enterprise-grade, cloud-native fraud detection SaaS platform with real-time risk scoring, explainable ML, investigation workflows, case management, audit logging, geospatial intelligence, and production deployment assets.

Last updated: February 24, 2026

## Latest Frontend Upgrade

Completed enterprise-grade frontend refactor and cleanup:

- Upgraded visual system to premium fintech styling (glass cards, gradients, blur layers, stronger spacing and hierarchy).
- Added motion-driven UX with Framer Motion across page transitions, sidebar collapse, cards, and panel loading states.
- Enhanced executive dashboard cards with animated counters, trend deltas, and sparkline mini charts.
- Improved investigation workflows (`/alerts`, `/cases`, `/transactions`) with richer tables, filters, and detail panels.
- Added alert investigation timeline tab and resilient loading/error handling with retry actions.
- Finalized global search dropdown in navbar across transactions, alerts, cases, and users.
- Stabilized global theme state with Zustand-backed persistence.
- Removed legacy/unused frontend scaffold files (`app/`, `features/`, `lib/`, duplicate auth store, and obsolete chart components).

## Product Overview

This repository now operates as a full fraud operations platform (not just a scoring API), with:

- Real-time transaction scoring (rule + ML hybrid)
- Risk response actions (`ALLOW`, `STEP_UP_AUTH`, `BLOCK`)
- Investigation and alert triage workflows
- Case lifecycle management with timeline notes
- Audit trail for security/compliance events
- Model reliability and drift visibility
- System health telemetry and ML circuit breaker status
- Live fraud radar map with heatmap, clustering, and geo-jump detection
- Docker, Kubernetes, and Azure Container Apps deployment assets

## What Is Implemented

### Core fraud pipeline

- JWT authentication and RBAC (`admin`, `analyst`)
- `POST /api/v1/transactions` for scoring + persistence
- Hybrid scoring:
  - Rule engine: amount, velocity, location anomalies, device anomalies, geo velocity
  - ML service: Isolation Forest anomaly score with explanations
  - Weighted final score from runtime settings
- Risk level classification:
  - `0-30 Low`
  - `31-70 Medium`
  - `71-100 High`
- Response action assignment:
  - `High -> BLOCK`
  - `Medium -> STEP_UP_AUTH`
  - `Low -> ALLOW`

### Enterprise investigation features

- Alerts queue with pagination/filter/search
- Alert investigation workspace tabs:
  - Overview
  - User History
  - Geo Movement
  - Device Intelligence
  - Fraud Explanation
  - Case Management
  - Audit Timeline
- Case management system (`cases` collection):
  - statuses: `OPEN`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`
  - priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - timeline + notes
- Audit logging system (`audit_logs` collection)

### Real-time intelligence

- Redis pub/sub + Socket.io fanout
- Live channels:
  - `transactions.live`
  - `fraud.alerts`
  - `simulation.events`
  - `system.status` (initial socket status event)
- Live frontend updates for dashboard, alerts, map, and metrics

### Radar geospatial intelligence

- Backend `GeoService` for coordinate resolution
- IP-based geolocation via configurable API (`GEOIP_API_URL`, default `https://ipwho.is`)
- Redis coordinate cache to avoid repeated lookups
- Persistent geo fields on transactions:
  - `latitude`, `longitude`, `city`, `country`
- Geo velocity rule:
  - flags when same user jumps `>1500 km` within `<2 hours`
  - stored as `geoVelocityFlag`
- Frontend radar features:
  - full-screen world map
  - fraud heatmap layer
  - marker clustering by risk severity
  - pulsing high-risk markers
  - suspicious geo-jump paths with arrows
  - timeline filtering (`10m`, `1h`, `24h`, `custom`)
  - global stats overlay (count, density, most-targeted country)

### ML reliability and model health

- Circuit breaker in API Gateway ML client
- ML runtime states:
  - `HEALTHY`
  - `DEGRADED`
  - `OFFLINE`
- Fallback mode: if ML is unavailable, scoring continues with rule engine
- Model metadata persisted on transaction:
  - `modelName`, `modelVersion`, `modelConfidence`
- Model metrics snapshots (`model_metrics` collection)
- Drift detection based on distribution deltas

### Frontend platform pages

- `/login`
- `/dashboard`
- `/transactions`
- `/alerts`
- `/cases`
- `/radar`
- `/audit`
- `/model-health`
- `/system`
- `/analytics`
- `/settings`

Plus enterprise UX features:

- Protected routing + persistent auth state
- Global search (transactions/users/alerts/cases)
- Collapsible enterprise sidebar
- ML status indicator in navbar
- Theme toggle (dark/light) persisted in `localStorage`
- Crash-proof date rendering utilities (`formatSafeDate`, `safeDate`)
- Loading skeletons and empty states
- Polling + websocket synchronization
- Virtualized transaction table for scalability

## Architecture

```text
Frontend (React + TypeScript + Tailwind + Recharts + Leaflet + React Query + Zustand)
    |
    | HTTPS + JWT + Socket.io
    v
API Gateway (Node.js + Express + TypeScript)
    |-- MongoDB collections (transactions, alerts, cases, audit, metrics, settings, devices, explanations)
    |-- Redis (pub/sub, geo cache)
    v
ML Service (FastAPI + Isolation Forest)
```

## Services and Ports

| Service | Tech | URL | Docker service |
|---|---|---|---|
| Frontend | React/Vite build on Nginx | `http://localhost:5173` | `frontend` |
| API Gateway | Express + TypeScript | `http://localhost:8080` | `api-gateway` |
| ML Service | FastAPI | `http://localhost:8000` | `ml-service` |
| MongoDB | Mongo 7 | `mongodb://localhost:27017` | `mongo` |
| Redis | Redis 7 | `redis://localhost:6379` | `redis` |

## MongoDB Collections

- `users`
- `transactions`
- `fraud_alerts`
- `fraud_explanations`
- `user_devices`
- `cases`
- `audit_logs`
- `model_metrics`
- `system_settings`
- `user_risk_profiles`

## API Reference

Base URL: `http://localhost:8080/api/v1`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Transactions

- `POST /transactions`
- `GET /transactions`
- `GET /transactions/query`
- `GET /transactions/:transactionId`
- `GET /transactions/stats`

### Simulation

- `POST /simulation/start` (admin)

### Monitoring and investigation

- `GET /alerts`
- `GET /alerts/:alertId`
- `GET /devices`
- `GET /explanations`
- `POST /cases`
- `GET /cases`
- `PATCH /cases/:id`
- `GET /audit`

### Platform intelligence

- `GET /search`
- `GET /model/info`
- `GET /model/health`
- `GET /system/ml-status`
- `GET /system/health`
- `GET /settings`
- `PATCH /settings`

### Basic platform endpoints

- `GET /health`
- `GET /metrics`

## Fraud Scoring and Response

Final score formula:

```text
fraudScore = round((ruleScore * scoreRuleWeight) + (mlScore * 100 * scoreMlWeight))
```

Runtime weights and thresholds are loaded from system settings (`/api/v1/settings`) and validated so:

```text
scoreRuleWeight + scoreMlWeight = 1
```

Action mapping:

- `High` -> `BLOCK`
- `Medium` -> `STEP_UP_AUTH`
- `Low` -> `ALLOW`

## Environment Variables

Root `.env.example` contains complete defaults for local Docker networking.

Key variables:

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
- `GEOIP_API_URL`
- `GEO_CACHE_TTL_SECONDS`
- `MODEL_NAME`
- `MODEL_VERSION`
- `ML_CIRCUIT_FAIL_THRESHOLD`
- `ML_CIRCUIT_RESET_SECONDS`
- `VITE_API_URL`
- `VITE_WS_URL`

## Local Run (Docker Compose)

### 1) Configure env

```bash
cp .env.example .env
```

### 2) Start stack

```bash
docker compose down
docker compose up --build -d
```

### 3) Validate

```bash
curl http://localhost:8080/health
curl http://localhost:8080/metrics
curl http://localhost:8000/health
curl -I http://localhost:5173
```

## Seed and Test

Seed via API Gateway script:

```bash
npm run seed -w api-gateway
```

Or REST script:

```bash
TOKEN=<jwt> API_URL=http://localhost:8080 bash scripts/seed-transactions.sh
```

## Local Development (Non-Docker)

Install:

```bash
npm run install:all
pip install -r ml-service/requirements.txt
```

Run services:

```bash
npm run dev -w api-gateway
npm run dev -w frontend
uvicorn ml-service.main:app --host 0.0.0.0 --port 8000
```

Build all:

```bash
npm run build
```

## Kubernetes Assets

Available in `k8s/`:

- `api-deployment.yaml`
- `ml-deployment.yaml`
- `mongo.yaml`
- `redis.yaml`
- `frontend.yaml`
- `ingress.yaml`

## Azure Deployment (Container Apps)

Deployment assets:

- `azure/env.template`
- `azure/deploy.sh`
- `azure/containerapps.yaml`

Script flow (`azure/deploy.sh`):

- Azure login and subscription setup
- Resource group creation
- ACR creation/login and image push
- Cosmos DB Mongo API provisioning
- Azure Redis provisioning
- Container Apps environment creation
- Deploy/update `ml-service`, `api-gateway`, `frontend`
- Runtime env injection
- Health and smoke verification

Run:

```bash
cp azure/env.template azure/.env
# edit azure/.env
bash azure/deploy.sh
```

## Security and Observability

Security:

- Helmet
- CORS allow-list from env
- JWT auth middleware
- RBAC middleware
- Zod validation
- API rate limiting

Observability:

- Structured logging with Pino
- Request IDs
- `/health` and `/metrics`
- container healthchecks in Docker Compose
- system telemetry endpoint (`/api/v1/system/health`)

## Project Structure

```text
api-gateway/   Express API, scoring, realtime, repositories, controllers
ml-service/    FastAPI model inference and feature engineering
frontend/      React enterprise dashboard, charts, radar, investigation UI
k8s/           Kubernetes manifests
azure/         Azure Container Apps deployment automation
scripts/       Utility scripts
```

## Notes

- Real-time UX is event-driven and also polling-backed for resilience.
- Date handling in frontend is hardened against invalid/null timestamps (`N/A` fallback).
- Geo rendering avoids random coordinate generation; uses backend coordinates first, then deterministic fallback mapping.
- Rotate credentials and secrets before any public deployment.
