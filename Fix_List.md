# Argus: Cyber-Intelligence & Fraud Hardening Roadmap

This document serves as the high-fidelity technical specification for project Argus (Stack Sprint). It details existing broken features and the path toward "Cinematic" autonomous defense.

## Phase 1: Core System Hardening (Resolution of Technical Debt)

### 1. [x] Explainable AI (XAI) Panel Restoration
- **Feature**: Real-time SHAP (SHapley Additive exPlanations) visualization.
- **Detail**: The frontend `FraudExplanationPanel.tsx` must render the `featureImpacts` array. If the ML service is down, the `FraudScoringService.ts` must generate a rule-based weighted synthetic explanation to prevent a "empty state" UI.
- **Goal**: Show exactly *why* a transaction was flagged (e.g., "70% due to Location Anomaly").

### 2. [x] Investigation Workspace: High-Risk Node Visiblity
- **Feature**: D3.js Graph Highlighting for precarious entities.
- **Detail**: Modify `FraudNetwork.tsx` to apply neon-red rings and "glitch" animations to nodes with a `riskScore > 80`. Ensure connections between flagged users and known blocked devices are thicker/pulsing.
- **Goal**: Immediate visual triage for analysts.

### 3. [x] Geo-Analytics & Impossible Travel Hardening
- **Feature**: Pure Haversine vs. Time-Delta Logic.
- **Detail**: Refine `RuleEngineService.ts` to calculate precise velocity (Km/Hr). If a user spends in Tokyo and then NY in 2 hours, trigger a CRITICAL Geo-Velocity alert.
- **Status**: Implemented >900km/h "Impossible Travel" trigger.

### 4. [x] Zero Trust Verification HUD
- **Feature**: Mid-flight step-up authentication.
- **Detail**: Executed via a 3-stage cinematic HUD (Neural, Bio, Device).
- **Status**: Implemented with animated scanners and cryptographic handshakes.

### 5. [x] Unified Alert Center & Real-time Pulse
- **Feature**: WebSocket-bridged fraud alerts.
- **Detail**: Fixed the disconnect between Redis publisher and Socket.io listener.
- **Status**: Real-time alerts now stream correctly to the dashboard.

### 6. [x] Global Threat Globe (Information Expansion)
- **Feature**: Cinematic orbital surveillance visualization.
- **Detail**: Enhanced with AI Drone markers, vector arcs, and holographic HUD overlays.
- **Status**: Complete with "extensive information" and interactive threat nodes.
- **Feature**: Generalist Intelligence + Domain Expertise.
- **Detail**: Remove the strict system-prompt rejection in `CopilotService.ts`. Allow the model to analyze any data, acting as a full senior fraud architect rather than a restricted lookup tool.

---

## Phase 2: Advanced Cyber-Intelligence Layers (New Objectives)

### 6. [x] Mule-Account Detection Layer (Graph Intelligence)
- **Feature**: Financial "Siphon" Detection.
- **Detail**: Implement a service that scans the `FraudGraphService` for "Fan-In/Fan-Out" patterns.
- **Mechanism**: Identify regular accounts receiving multiple small transfers from disparate sources, followed by a single large outbound transfer (classic money mule behavior).
- **Impact**: Detects the infrastructure of fraud, not just the individual thief.

### 7. [x] AI-Scam Advisor
- **Feature**: LLM-powered social engineering analysis.
- **Detail**: A dedicated chat where users can paste suspicious messages or screenshots. Uses Gemini to match patterns like "Electricity Bill" or "KYC Update" scams against a database of known scam templates.
- **HUD feedback**: "Warning! Predicted Scam Type: Phishing. Active in your region."

### 8. [x] Autonomous Action & Micro-Isolation
- **Feature**: Machine-Speed Enforcement.
- **Detail**: Scores > 95 trigger `AUTONOMOUS_ENFORCEMENT` with account freeze and audit logs.
- **Status**: Complete with "Battle Log" visualization in the Autonomous tab.

---

## Phase 3: Cinematic "WOW" Features (The Future)

### 9. [x] Predictive "Pre-Crime" Heatmaps
- **Feature**: Temporal Risk Forecasting.
- **Detail**: Added "Predictive Burst Window" HUD with orbital telemetry forecasts to the globe.
- **Status**: Complete with live-animating trend indicators.

### 10. [x] Digital Fingerprint Replay
- **Feature**: Forensic Session Reconstruction.
- **Detail**: Timeline scrubber allows replaying recorded (or synthetic) user click-paths and mouse movements.
- **Status**: Integrated into Transaction Stream for immediate analyst drill-down.
