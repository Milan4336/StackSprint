# FRAUD COMMAND CENTER (Enterprise Fintech Edition)

A production-grade, cloud-native fraud intelligence platform that detects, explains, and responds to financial fraud in real time using hybrid rule + ML scoring, live geospatial monitoring, and full investigation workflows.

### Why this project stands out
- It is not a single model demo. It is a full fraud operations platform.
- It combines realtime detection + explainability + autonomous response + analyst workflow.
- It is deployable: Docker, Kubernetes manifests, and Azure Container Apps automation are included.
- It is built with production architecture patterns (microservices, clean separation, validation, auth, observability).

### Latest Feature Upgrades (Phase 1 — Bank-Grade Platform)
- **Multi-Model ML Ensemble** — Now using a 3-model weighted ensemble (XGBoost Classifier + PyTorch Autoencoder + Isolation Forest) for ultra-reliable detection.
- **Explainable AI Evolution** — Prediction payloads now include confidence scores, model-specific scores, and voting weights for maximum transparency.
- **Model Registry & Retraining** — New enterprise-grade registry tracks model versions, training metadata, and accuracy; background retraining can be triggered from UI.
- **Cinematic Boot Fix** — Boot animation now correctly only plays after a fresh login (persisted via session-only pending flag). Reloads no longer trigger the intro.
- **ECG Live Feed** — Realtime heartbeat animation (green) vs pulsing flatline (orange) for connection status.
- **Light/Dark Polish** — Full enterprise-grade theme support across all charts, panels, and indicators.

### Latest Feature Upgrades (Phase 2 — Forensic Intelligence)
- **Fraud Relationship Graph** — Realtime D3-powered network analysis detecting shared devices, proxies, and collusion rings.
- **Multi-Dimensional Scoring** — Integrated scoring fusion combining Rules + ML + Behavioral Profiles + Graph Relationship bias.
- **Behavioral Fingerprinting** — Advanced tracking of user behavior patterns, device churn, and geo-velocity anomalies.
- **Platform Evolution Timeline** — New interactive updates system tracking chronological system upgrades and forensics enhancements.

---

## 1) Features

### Live Product URLs (local)
- Frontend Command Center: `http://localhost:5173`
- API Gateway: `http://localhost:8080`
- API Health: `http://localhost:8080/health`
- API Metrics: `http://localhost:8080/metrics`
- ML Health: `http://localhost:8000/health`

### Rapid demo sequence
1. Login as admin/analyst in enterprise UI — cinematic orbital boot animation plays on every login.
2. Dashboard shows live KPIs, animated metric cards, ECG live-feed indicator, and animated charts.
3. Create a transaction and see:
   - fraud score,
   - risk level,
   - action (`ALLOW` / `STEP_UP_AUTH` / `BLOCK`),
   - realtime updates across dashboard/map/alerts.
4. Trigger simulation mode (50 generated attack-pattern transactions).
5. Open alerts and investigate with multi-tab workspace.
6. Create/update cases and view case timeline.
7. Open radar map for global fraud heatmap, clusters, pulsing high-risk markers, and suspicious geo-jump paths.
8. Open model/system health pages for reliability and drift visibility.

---

## 2) Core Product Capabilities (Implemented)

## Fraud Detection Engine
- Hybrid scoring architecture:
  - Rule Engine (behavior + risk heuristics)
  - ML Anomaly Scoring (Isolation Forest via FastAPI service)
- Final score is weighted and runtime-configurable via settings.
- Risk classification:
  - `0-30` -> `Low`
  - `31-70` -> `Medium`
  - `71-100` -> `High`
- Response action mapping:
  - `Low` -> `ALLOW`
  - `Medium` -> `STEP_UP_AUTH`
  - `High` -> `BLOCK`

## Rule Intelligence Signals
- High amount threshold breach.
- Velocity anomalies within configurable time window.
- Location anomaly vs previous user activity.
- New device detection.
- IP change detection.
- Geo-velocity detection (`>1500 km` jump in `<2h`).
- Behavioral profile signals:
  - user average amount deviation,
  - transaction velocity profile,
  - location change frequency,
  - device churn.

## Explainable AI
- ML returns top explanation factors with impacts and reasons.
- Explanations are persisted and shown in the investigation UI.
- Alert reasons include detailed per-signal lines (Rule + ML explanations).

## Autonomous Fraud Response
- When fraud score exceeds autonomous threshold:
  - creates fraud alert,
  - stores full reason narrative,
  - emits realtime alert event,
  - logs audit event.

## Fraud Simulation Mode
- API endpoint to start controlled attack simulation.
- Generates high-risk and normal transaction mix.
- Realtime simulation events streamed to UI.
- Fully toggleable via runtime settings (`simulationMode`).

## Investigation Workflows
- Alert queue with search/filter/pagination.
- Alert detail workspace tabs:
  - Overview
  - Fraud Explanation
  - User History
  - Geo Movement
  - Device Intelligence
  - Case Management
  - Timeline
- Case management lifecycle:
  - statuses: `OPEN`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`
  - priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - notes + timeline updates + assignee support.

## Compliance + Auditability
- Audit logging for key actions:
  - login/register,
  - transaction scoring,
  - alert generation,
  - case creation/update,
  - settings updates.
- Audit timeline page for analyst/admin review.

## Realtime Operations
- Redis pub/sub event bus.
- Socket.io gateway with JWT auth.
- Live channels:
  - `transactions.live`
  - `fraud.alerts`
  - `simulation.events`
  - `system.status`
- Frontend subscribes and updates dashboard/alerts/radar in realtime.

## Fraud Radar (Geospatial Intelligence)
- World map with realtime marker updates.
- Heatmap layer (fraud intensity).
- Marker clustering by severity.
- High-risk pulse effect.
- Suspicious geo-jump path rendering with directional arrows.
- Time filter presets (`10m`, `1h`, `24h`, custom range).
- Floating live geo stats panel.
- Geo resolution strategy:
  - IP-based lookup (external GeoIP API),
  - Redis cache for repeated lookups,
  - deterministic location fallback mapping,
  - coordinates persisted into transactions.

## Executive Analytics
- Executive KPI cards with animated counters and trend deltas.
- Fraud rate, risk distribution, trend, volume, and country charts.
- Device intelligence and explainability views integrated in dashboard.

## Advanced Forensic Graph
- D3.js force-directed graph for relationship analysis.
- Entity nodes: `USER`, `DEVICE`, `IP`.
- Live degree and risk bias calculations.
- Collusion detection engine for fraud ring identification.

## Model Ops + Reliability
- ML circuit breaker in API gateway.
- Runtime ML status states:
  - `HEALTHY`
  - `DEGRADED`
  - `OFFLINE`
- Fallback behavior: scoring continues with rule engine if ML is unavailable.
- Model metadata persisted per transaction:
  - `modelName`, `modelVersion`, `modelConfidence`, `mlStatus`
- Model metrics snapshots + drift indicators.

## System Health Monitoring
- Aggregated health endpoint includes:
  - API latency
  - ML latency
  - Redis latency
  - Mongo status
  - Redis status
  - ML status
  - WebSocket status + connected clients

## Enterprise Frontend UX
- Protected routes + JWT login flow.
- Global search (transactions, alerts, users, cases).
- Collapsible sidebar, enterprise navbar, indicators, profile menu.
- Theme toggle (dark/light) with persistence.
- Skeleton loaders, retryable error states, empty states.
- Virtualized transaction table (`react-window`) for large datasets.
- Crash-safe date formatting (`N/A` fallback for invalid timestamps).
- Cinematic startup intro (`SystemBootIntro`) with particle network animation.

## Enterprise Route Map (UI)
- `/login` - secure entry.
- `/dashboard` - executive command center.
- `/transactions` - virtualized transaction operations table + investigation panel.
- `/alerts` - alert queue + multi-tab investigation workspace.
- `/cases` - case lifecycle and timeline operations.
- `/radar` - geospatial fraud intelligence map.
- `/analytics` - advanced fraud analytics visualizations.
- `/audit` - compliance and action audit timeline.
- `/model-health` - model drift/performance monitoring.
- `/fraud-network` - forensic relationship graph analysis.
- `/behavior-profiles` - deep behavioral intelligence.
- `/updates` - platform evolution timeline.
- `/system` - service health and reliability telemetry.
- `/settings` - runtime threshold/weights/simulation controls + theme controls.

## Cinematic Boot Intro (Judge Impact Feature)
- Full-screen initialization sequence on first dashboard load.
- Progressive system messages:
  - transaction stream connection
  - fraud engine initialization
  - ML model loading
  - realtime monitoring connection
  - integrity verification
  - ready state
- Animated progress bar + blinking cursor + glow effects.
- Canvas-powered particle network background.
- Smooth fade-out transition into live dashboard.
- Persisted "already seen" state to skip replay on refresh.

---

## 3) Architecture

```text
[Frontend: React + TypeScript + Tailwind + Recharts + Leaflet + React Query + Zustand]
                  |
                  | HTTPS REST + JWT + Socket.io
                  v
[API Gateway: Node.js + Express + TypeScript]
  - Controllers / Services / Repositories
  - Rule Engine + ML client + circuit breaker
  - Alerting, Cases, Audit, Search, Settings
  - Redis pub/sub + WebSocket fanout
                  |
      +-----------+-----------+
      |                       |
      v                       v
[MongoDB]                 [Redis]
transactions, alerts,     pub/sub channels,
cases, audit_logs,        geolocation cache,
model_metrics, settings   websocket streaming
                  |
                  v
        [ML Service: FastAPI + Isolation Forest]
        - /predict
        - /health
        - /metrics
```

### Backend design discipline
- Clean separation: Controllers -> Services -> Repositories.
- Validation at boundary (Zod schemas).
- Centralized error handling + typed service contracts.
- Environment-driven configuration (`env.ts` schema validation).

---

## 4) Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- React Query
- Zustand
- Recharts
- Leaflet + MarkerCluster + Heat Layer
- Socket.io Client

### Backend
- Node.js + Express + TypeScript
- Mongoose (MongoDB)
- ioredis (Redis)
- Socket.io
- Zod validation
- JWT auth + RBAC
- Helmet + CORS + Rate limiting
- Pino logging + Prometheus metrics

### ML Service
- FastAPI
- scikit-learn Isolation Forest
- Feature engineering for anomaly context

### Infra
- Docker + Docker Compose
- Kubernetes manifests (`k8s/`)
- Azure Container Apps deployment assets (`azure/`)

---

## 5) Data Model Collections

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

---

## 6) API Surface (Implemented)

Base: `http://localhost:8080/api/v1`

## Auth
- `POST /auth/register`
- `POST /auth/login`

## Transactions
- `POST /transactions`
- `GET /transactions`
- `GET /transactions/query`
- `GET /transactions/:transactionId`
- `GET /transactions/stats`

## Forensic Intelligence
- `GET /api/v1/graph` (D3 network graph data)

## Simulation
- `POST /simulation/start` (admin)

## Monitoring / Investigation
- `GET /alerts`
- `GET /alerts/:alertId`
- `GET /devices`
- `GET /explanations`

## Cases
- `POST /cases`
- `GET /cases`
- `PATCH /cases/:id`

## Audit + Search
- `GET /audit`
- `GET /search`

## Model + System
- `GET /model/info`
- `GET /model/health`
- `GET /system/ml-status`
- `GET /system/health`

## Runtime Settings
- `GET /settings`
- `PATCH /settings` (admin)

## Platform endpoints
- `GET /health`
- `GET /metrics`

---

## 7) Realtime Event Contract

## Redis / Socket.io channels
- `transactions.live`
- `fraud.alerts`
- `simulation.events`
- `system.status`

## transaction live payload (key fields)
- `transactionId`
- `userId`
- `amount`
- `location`
- `latitude`, `longitude`, `city`, `country`
- `fraudScore`, `riskLevel`, `isFraud`
- `ruleScore`, `mlScore`, `mlStatus`
- `action`
- `modelName`, `modelVersion`, `modelConfidence`
- `geoVelocityFlag`
- `timestamp`

---

## 8) Security + Observability

## Security controls
- JWT authentication on protected APIs.
- Role-based authorization for sensitive operations.
- Zod request validation.
- Helmet secure headers.
- CORS allow-list via env.
- API rate limiter.
- Password hashing in auth workflow.

## Observability controls
- Structured logs via Pino.
- Request ID tracing middleware.
- `/health` and `/metrics` for API.
- `/health` and `/metrics` for ML service.
- Container-level health checks in Docker Compose.
- System health aggregation endpoint.

---

## 9) Environment Configuration

Copy and edit:

```bash
cp .env.example .env
```

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

---

## 10) Run Locally (Docker)

## Start
```bash
docker compose down
docker compose up --build -d
```

## Verify
```bash
curl http://localhost:8080/health
curl http://localhost:8080/metrics
curl http://localhost:8000/health
curl -I http://localhost:5173
```

## Bootstrap demo data (optional but recommended)
Create admin user (if not already present):

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fraud.local","password":"StrongPass123!","role":"admin"}'
```

Seed sample transactions:

```bash
npm run seed -w api-gateway
```

Or seed through API flow:

```bash
TOKEN=<jwt> API_URL=http://localhost:8080 bash scripts/seed-transactions.sh
```

---

## 11) Judge-Friendly Demo Script

## Step A: Login
- Open `http://localhost:5173`
- Default login used in UI:
  - `admin@fraud.local`
  - `StrongPass123!`

## Step B: Show Enterprise Dashboard
- Point out:
  - animated KPI cards,
  - fraud/risk charts,
  - realtime socket indicator,
  - cinematic intro (first load).

## Step C: Create a High-Risk Transaction
- Use Create Transaction form.
- Show returned score + risk action reflected in table.

## Step D: Show Autonomous Alerting
- Open alerts panel/page.
- Explain reason narrative includes:
  - rule signals (velocity/device/IP/geo),
  - ML explanation factors.

## Step E: Trigger Simulation
- Click "Start Fraud Attack Simulation".
- Show live spikes in alerts/map/charts.

## Step F: Investigation + Case Workflow
- Open alert workspace tabs.
- Create or update case.
- Show case timeline and notes.

## Step G: Radar Intelligence
- Open `/radar`.
- Demonstrate heatmap, clustering, pulsing markers, geo-jump paths.

## Step H: Platform Reliability
- Open `/model-health` and `/system`.
- Explain circuit-breaker fallback and health telemetry.

---

## 12) Non-Docker Local Development

```bash
npm run install:all
pip install -r ml-service/requirements.txt

npm run dev -w api-gateway
npm run dev -w frontend
uvicorn ml-service.main:app --host 0.0.0.0 --port 8000
```

Build all:

```bash
npm run build
```

---

## 13) Deployment Assets

## Kubernetes
Available in `k8s/`:
- `api-deployment.yaml`
- `ml-deployment.yaml`
- `mongo.yaml`
- `redis.yaml`
- `frontend.yaml`
- `ingress.yaml`

## Azure Container Apps
Available in `azure/`:
- `env.template`
- `deploy.sh`
- `containerapps.yaml`

`deploy.sh` provisions/publishes:
- Resource group
- ACR
- Cosmos DB (Mongo API)
- Azure Redis
- Container Apps environment
- Frontend, API Gateway, ML Service containers

---

## 14) Project Structure

```text
api-gateway/   Backend APIs, fraud scoring, realtime, security, repositories
ml-service/    ML inference + explainability + metrics
frontend/      Enterprise command center UI
k8s/           Kubernetes manifests
azure/         Azure deployment automation
scripts/       Utility scripts (seed/testing)
```

---

## 15) Conclusion

This project delivers the full lifecycle of fraud defense:
- detect in realtime,
- explain why,
- respond automatically,
- investigate collaboratively,
- monitor model/system reliability,
- deploy in cloud-native production environments.

It is built as a real fintech operations platform, not a toy dashboard.

### Closing Line
"We are not just predicting fraud. We built a complete fraud operations system where detection, explanation, autonomous response, investigation, graph forensics, and reliability monitoring work together in realtime."
