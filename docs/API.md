# API Reference

## Overview

Atomic exposes REST APIs for each service. All APIs use JSON for request/response bodies.

## Base URLs

**Development**:
- Gateway: `http://localhost:3001`
- Orchestrator: `http://localhost:3002`
- DTE: `http://localhost:3003`
- FinOps: `http://localhost:3004`
- Evidence: `http://localhost:3005`

**Production**: Configure via environment variables.

## Authentication

Currently, services are unauthenticated (v1). Authentication will be added in v2.

## Common Headers

```http
Content-Type: application/json
Accept: application/json
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Optional additional info"
}
```

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

---

## Gateway Service

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "gateway"
}
```

### Preflight Check

Validate and sanitize content before processing.

```http
POST /gateway/preflight
```

**Request**:
```json
{
  "content": "API key: sk-1234567890",
  "provider": "copilot",
  "metadata": {}
}
```

**Response**:
```json
{
  "ok": true,
  "violations": [
    {
      "rule": "sensitive_data_detected",
      "severity": "warning",
      "message": "Found 1 sensitive data items that were redacted"
    }
  ],
  "redactions": [
    {
      "type": "secret",
      "position": 9,
      "length": 14,
      "placeholder": "***REDACTED_SECRET***"
    }
  ],
  "sanitizedContent": "API key: ***REDACTED_SECRET***"
}
```

**Headers**:
- `X-Preflight-Latency-Ms`: Latency in milliseconds

### Route Request

Determine which provider to use.

```http
POST /gateway/route
```

**Request**:
```json
{
  "task": "code-generation",
  "budget": 10,
  "preferredProvider": "copilot"
}
```

**Response**:
```json
{
  "provider": "copilot",
  "policyApplied": true,
  "estimatedCost": 5
}
```

---

## Orchestrator Service

### Health Check

```http
GET /health
```

### Create Mission

```http
POST /missions
```

**Request**:
```json
{
  "title": "Migrate Auth API",
  "risk": "medium"
}
```

**Response**:
```json
{
  "missionId": "M-1234567890",
  "title": "Migrate Auth API",
  "risk": "medium",
  "checkpoints": [
    {
      "name": "plan",
      "status": "pending",
      "actor": "human",
      "artifacts": []
    },
    {
      "name": "execute",
      "status": "pending",
      "actor": "agent",
      "batches": []
    },
    {
      "name": "verify",
      "status": "pending",
      "actor": "agent",
      "metrics": {}
    },
    {
      "name": "finalize",
      "status": "pending",
      "actor": "human"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Get Mission

```http
GET /missions/:id
```

**Response**: Same as Create Mission response

### Approve Checkpoint

```http
POST /missions/:id/checkpoints/:name/approve
```

**Example**:
```http
POST /missions/M-123/checkpoints/plan/approve
```

**Response**: Updated mission object

### Create Batch

```http
POST /missions/:id/batches
```

**Response**:
```json
{
  "id": "batch-1234567890",
  "reversible": true,
  "prs": []
}
```

### Rollback Batch

```http
POST /missions/:missionId/rollback/:batchId
```

**Example**:
```http
POST /missions/M-123/rollback/batch-456
```

**Response**:
```json
{
  "success": true,
  "message": "Batch rolled back"
}
```

---

## DTE Service

### Health Check

```http
GET /health
```

### Apply ChangeSpec

Execute AST transformations.

```http
POST /dte/apply
```

**Request**: ChangeSpec object (see CHANGE_SPEC.md)

**Response**:
```json
{
  "success": true,
  "patches": [
    "/path/to/file1.ts",
    "/path/to/file2.ts"
  ],
  "errors": [],
  "warnings": []
}
```

### Verify ChangeSpec

Run invariants and mutation tests.

```http
POST /dte/verify
```

**Request**:
```json
{
  "spec": { /* ChangeSpec object */ },
  "workingDir": "/path/to/project"
}
```

**Response**:
```json
{
  "success": true,
  "errors": [],
  "warnings": [],
  "mutationReport": {
    "score": 0.75,
    "mutantsKilled": 15,
    "mutantsTotal": 20,
    "details": [
      {
        "file": "src/auth.ts",
        "mutant": "BinaryOperator",
        "status": "killed"
      }
    ]
  }
}
```

---

## FinOps Service

### Health Check

```http
GET /health
```

### Cost Forecast

```http
POST /finops/forecast
```

**Request**:
```json
{
  "changeSpec": { /* ChangeSpec object */ },
  "provider": "copilot"
}
```

**Response**:
```json
{
  "usdEstimate": 2.5,
  "tokens": 125000,
  "p95Latency": 2000
}
```

### Get Budget

```http
GET /finops/budget
```

**Response**:
```json
{
  "total": 100,
  "consumed": 25.5,
  "remaining": 74.5,
  "breached": false
}
```

### Update Budget

```http
POST /finops/budget
```

**Request**:
```json
{
  "consumed": 2.5
}
```

**Response**: Updated budget object

### Get Policies

```http
GET /policies/models
```

**Response**:
```json
[
  {
    "task": "code-generation",
    "model": "gpt-4",
    "budgetCeiling": 50,
    "priority": 1
  }
]
```

### Set Policy

```http
PUT /policies/models
```

**Request**:
```json
{
  "task": "code-review",
  "model": "gpt-3.5-turbo",
  "budgetCeiling": 20,
  "priority": 2
}
```

**Response**: Updated policy object

---

## Evidence Service

### Health Check

```http
GET /health
```

### Record Event

```http
POST /evidence/events
```

**Request**:
```json
{
  "type": "MissionCreated",
  "missionId": "M-123",
  "data": {
    "title": "API Migration",
    "risk": "medium"
  }
}
```

**Response**:
```json
{
  "id": "EVT-1234567890",
  "type": "MissionCreated",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "missionId": "M-123",
  "data": {
    "title": "API Migration",
    "risk": "medium"
  }
}
```

### Get Provenance Graph

```http
GET /evidence/mission/:id
```

**Response**:
```json
{
  "nodes": [
    {
      "id": "EVT-123",
      "type": "change",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "actor": "system",
      "data": {}
    }
  ],
  "edges": [
    {
      "from": "EVT-123",
      "to": "EVT-124"
    }
  ]
}
```

### Export Audit Pack

```http
POST /evidence/export
```

**Request**:
```json
{
  "missionId": "M-123",
  "changeSpec": { /* ChangeSpec object */ }
}
```

**Response**: ZIP file download

**Content-Type**: `application/zip`

---

## Rate Limits

Currently no rate limits (v1). Will be added in v2.

## Pagination

Currently no pagination (v1). Large result sets return all items.

Future endpoints will support:
```http
GET /resource?page=1&perPage=50
```

## Versioning

APIs are currently v1. Future versions will use URL versioning:
```
/v2/missions
```

## WebSockets

Not currently supported. Event streaming planned for v2.

## CLI vs REST API

The CLI wraps the REST APIs:

```bash
atomic dte verify --spec spec.json
```

Equivalent to:
```bash
curl -X POST http://localhost:3003/dte/verify \
  -H "Content-Type: application/json" \
  -d @spec.json
```

## OpenAPI Specification

Full OpenAPI 3.0 specs will be added in a future update. Use this document as reference for now.
