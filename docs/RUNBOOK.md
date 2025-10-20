# Operational Runbook

## Quick Reference

### Starting Services

```bash
# All services in development mode
npm run dev

# Or individually
npm run dev --workspace=services/gateway
npm run dev --workspace=services/orchestrator
npm run dev --workspace=services/dte
npm run dev --workspace=services/finops
npm run dev --workspace=services/evidence
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/types
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Type checking
npm run typecheck
```

## Service Management

### Gateway (Port 3001)

**Purpose**: Policy enforcement and redaction

**Health Check**:
```bash
curl http://localhost:3001/health
```

**Logs**:
```bash
# Development
# Output to console

# Production
# Structured JSON to stdout
```

**Common Issues**:
- **Port conflict**: Change `GATEWAY_PORT` in `.env`
- **High latency**: Check redaction patterns, consider caching
- **Memory leak**: Restart service, check for pattern inefficiencies

### Orchestrator (Port 3002)

**Purpose**: Mission lifecycle management

**Health Check**:
```bash
curl http://localhost:3002/health
```

**Common Issues**:
- **Mission not found**: Check mission ID, ensure creation succeeded
- **Checkpoint stuck**: Manually approve via API or CLI
- **Rollback failed**: Check batch ID, verify reversible flag

### DTE (Port 3003)

**Purpose**: Code transformations

**Health Check**:
```bash
curl http://localhost:3003/health
```

**Common Issues**:
- **TypeScript errors**: Ensure valid ChangeSpec, check file paths
- **Slow verification**: Large codebase → increase timeout
- **AST parse error**: Check file encoding, syntax errors in source

### FinOps (Port 3004)

**Purpose**: Cost tracking

**Health Check**:
```bash
curl http://localhost:3004/health
```

**Common Issues**:
- **Budget breach**: Check consumption, adjust limits
- **Forecast inaccurate**: Review calculation logic, update rates

### Evidence (Port 3005)

**Purpose**: Audit trail

**Health Check**:
```bash
curl http://localhost:3005/health
```

**Common Issues**:
- **Disk space**: Events are append-only, monitor storage
- **Export timeout**: Large missions → increase timeout
- **Corrupt archive**: Check file system, retry export

## Common Operations

### Create and Execute a Mission

```bash
# 1. Create mission
curl -X POST http://localhost:3002/missions \
  -H "Content-Type: application/json" \
  -d '{"title":"API Migration","risk":"medium"}' \
  | jq -r '.missionId' > mission-id.txt

MISSION_ID=$(cat mission-id.txt)

# 2. Approve plan checkpoint
curl -X POST http://localhost:3002/missions/$MISSION_ID/checkpoints/plan/approve

# 3. Create ChangeSpec (via CLI)
atomic dte plan \
  --intent "Migrate auth API" \
  --scope "src/**/*.ts" \
  --output changespec.json

# 4. Apply changes
atomic dte apply --spec changespec.json

# 5. Verify
atomic dte verify --spec changespec.json --ci

# 6. Export audit pack
curl -X POST http://localhost:3005/evidence/export \
  -H "Content-Type: application/json" \
  -d "{\"missionId\":\"$MISSION_ID\"}" \
  -o audit-pack.zip
```

### Rollback a Batch

```bash
# Get mission status
curl http://localhost:3002/missions/M-123 | jq '.checkpoints[] | select(.name=="execute") | .batches'

# Rollback specific batch
atomic mission rollback --mission M-123 --batch batch-456
```

### Check Budget Status

```bash
# Get current budget
curl http://localhost:3004/finops/budget | jq

# Update consumption
curl -X POST http://localhost:3004/finops/budget \
  -H "Content-Type: application/json" \
  -d '{"consumed":5.0}'
```

## Monitoring

### Service Health

Create a health check script:

```bash
#!/bin/bash
# health-check.sh

services=(
  "gateway:3001"
  "orchestrator:3002"
  "dte:3003"
  "finops:3004"
  "evidence:3005"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"
  
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  
  if [ "$status" = "200" ]; then
    echo "✅ $name: healthy"
  else
    echo "❌ $name: unhealthy (HTTP $status)"
  fi
done
```

### Log Monitoring

```bash
# Follow logs (development)
npm run dev | grep ERROR

# Production logging
tail -f /var/log/atomic/*.log | jq 'select(.level=="error")'
```

### Metrics

Key metrics to track:

**Gateway**:
- Request rate
- p95 latency (target: ≤80ms)
- Redaction rate
- Policy violations

**Orchestrator**:
- Active missions
- Checkpoint approval time
- Rollback frequency

**DTE**:
- Verification pass rate
- Mutation score average
- AST transformation errors

**FinOps**:
- Budget consumption rate
- Cost per mission
- Forecast accuracy

**Evidence**:
- Event ingestion rate
- Storage usage
- Export frequency

## Backup & Recovery

### Events (Evidence)

```bash
# Backup events
curl http://localhost:3005/evidence/mission/M-123 > backup/M-123.json

# Restore (reimport events via POST)
```

### Missions (Orchestrator)

Currently in-memory. In production:
```bash
# PostgreSQL backup
pg_dump atomic > backup/atomic-$(date +%Y%m%d).sql

# Restore
psql atomic < backup/atomic-20240115.sql
```

### Configuration

```bash
# Backup environment
cp .env backup/.env.$(date +%Y%m%d)

# Backup policies
curl http://localhost:3004/policies/models > backup/policies.json
```

## Troubleshooting

### Service Won't Start

```bash
# Check port availability
lsof -i :3001

# Check environment
cat .env | grep PORT

# Check logs
npm run dev 2>&1 | less
```

### High Memory Usage

```bash
# Check process memory
ps aux | grep node

# Restart service
pkill -f "services/gateway"
npm run dev --workspace=services/gateway
```

### Disk Space

```bash
# Check usage
df -h

# Clean build artifacts
npm run clean

# Clean node_modules
rm -rf node_modules
npm install
```

### Network Issues

```bash
# Test connectivity
curl -v http://localhost:3001/health

# Check firewall
sudo iptables -L

# Check DNS
nslookup localhost
```

## Performance Tuning

### Gateway Optimization

```env
# Increase request size limit
MAX_REQUEST_SIZE=20971520  # 20MB

# Disable PII redaction if not needed
PII_REDACTION_ENABLED=false
```

### DTE Optimization

```bash
# Parallel processing (future)
DTE_WORKERS=4

# Cache AST indexes
DTE_CACHE_ENABLED=true
```

### Evidence Optimization

```bash
# Batch event writes
EVIDENCE_BATCH_SIZE=100

# Compress archives
EVIDENCE_COMPRESSION_LEVEL=9
```

## Scaling

### Horizontal Scaling (Future)

```yaml
# docker-compose.yml
services:
  gateway:
    image: atomic-gateway
    replicas: 3
    
  orchestrator:
    image: atomic-orchestrator
    replicas: 2
```

### Database Scaling

```bash
# Add read replicas
# Use connection pooling
# Implement caching layer (Redis)
```

## Security Operations

### Rotate Secrets

```bash
# 1. Generate new secret
NEW_KEY=$(openssl rand -hex 32)

# 2. Update .env
sed -i "s/API_KEY=.*/API_KEY=$NEW_KEY/" .env

# 3. Restart services
npm run dev
```

### Audit Security

```bash
# Check for vulnerabilities
npm audit

# Scan for secrets (pre-commit)
git diff --cached | grep -E "(api[_-]?key|password|secret)"

# Review access logs
grep "POST /missions" logs/*.log
```

## Maintenance Windows

### Planned Maintenance

```bash
# 1. Notify users (webhook, email, etc.)

# 2. Stop accepting new missions
# (implement via feature flag)

# 3. Wait for in-flight missions to complete
curl http://localhost:3002/missions?status=active

# 4. Stop services
pkill -f "services/"

# 5. Perform maintenance
npm run build
npm run migrate  # future

# 6. Restart services
npm run dev

# 7. Verify health
./health-check.sh
```

## Emergency Procedures

### Service Outage

```bash
# 1. Check health
./health-check.sh

# 2. Identify failed service
# 3. Check logs for errors
# 4. Restart service
npm run dev --workspace=services/[failed-service]

# 5. Verify recovery
curl http://localhost:[port]/health
```

### Data Loss

```bash
# 1. Stop writes
# 2. Restore from backup
# 3. Verify data integrity
# 4. Resume operations
```

### Security Incident

```bash
# 1. Isolate affected systems
# 2. Revoke compromised credentials
# 3. Review audit logs
curl http://localhost:3005/evidence/mission/M-123

# 4. Patch vulnerability
# 5. Document incident
```

## Contact Information

**On-call**: [Contact details]
**Email**: ops@atomic.dev
**Slack**: #atomic-ops
**Escalation**: [Manager contact]

## Additional Resources

- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Security](./SECURITY.md)
- [Change Spec](./CHANGE_SPEC.md)
