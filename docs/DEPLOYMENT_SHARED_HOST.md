# C7-PICS Deployment on Shared VPS (c7-eu-01)

This document describes deploying C7-PICS alongside videofy-live on the shared Contabo VPS c7-eu-01.

## Architecture Overview

**Dedicated VPS (reference topology, not used for shared deployment):**
```
Internet → Caddy (container) → {web, api, worker, postgres, redis}
```

**Shared VPS (c7-eu-01, C7-PICS only):**
```
Internet
   ↓
Host Caddy (:80, :443)
   ↓
Docker backplane (c7-pics-backplane)
   ├── C7-PICS API      (127.0.0.1:4000)
   ├── C7-PICS Web      (127.0.0.1:3000)
   ├── PostgreSQL       (internal, no host port)
   ├── Redis            (internal, no host port)
   └── Worker           (internal, no host port)
   
Coturn (host network, separate ports from videofy)
Private S3 (external)
```

## Key Differences from Dedicated Deployment

### 1. No Container Caddy

The host's `/etc/caddy/Caddyfile` is authoritative. Container Caddy is **disabled** via profile exclusion (primary mechanism) and replicas: 0 (defense-in-depth):

```yaml
caddy:
  profiles:
    - dedicated-edge
  deploy:
    replicas: 0
```

**Why:** One reverse proxy per host. Conflicts with videofy's host Caddy. The `dedicated-edge` profile ensures Caddy is not selected by default; `replicas: 0` prevents accidental startup if the profile is ever included.

### 2. Loopback-Only Application Ports

API and web bind to 127.0.0.1 (loopback), not 0.0.0.0:

```yaml
api:
  ports:
    - "127.0.0.1:${C7_PICS_API_HOST_PORT:-4000}:4000"

web:
  ports:
    - "127.0.0.1:${C7_PICS_WEB_HOST_PORT:-3000}:3000"
```

**Why:** Only the host Caddy can reach these services. Internet-facing access is impossible.

### 3. Internal Database and Cache

PostgreSQL and Redis do NOT publish host ports:

```yaml
postgres:
  # No "ports:" mapping
  # Reachable: Docker backplane only

redis:
  # No "ports:" mapping
  # Reachable: Docker backplane only
```

**Why:** These are internal services. Host (and internet) access is unnecessary and a security risk.

### 4. Separate Coturn Configuration

TURN uses non-conflicting ports and credentials to avoid collision with videofy's TURN:

```yaml
coturn:
  environment:
    TURN_REALM: ${TURN_REALM:-turn.pics.consummate7.com}
    TURN_PORT: ${TURN_PORT:-3479}           # Not videofy's 3478
    TURN_MIN_PORT: ${TURN_MIN_PORT:-49301}  # Not videofy's 49160
    TURN_MAX_PORT: ${TURN_MAX_PORT:-49400}  # Not videofy's 49300
    TURN_USERNAME: ${TURN_USERNAME}
    TURN_CREDENTIAL: ${TURN_CREDENTIAL}
    TURN_TLS_CERT: ${TURN_TLS_CERT:-}       # Disabled for first release
    TURN_TLS_KEY: ${TURN_TLS_KEY:-}
```

**Firewall requirements:**
```
3479/tcp   (TURN control, TCP)
3479/udp   (TURN control, UDP)
49301-49400/udp (TURN relay)
```

## Deployment on Shared VPS

### Pre-Deployment

**On c7-eu-01 (by operator):**

1. Create directory structure (immutable releases model):
   ```bash
   sudo mkdir -p /srv/pics/releases /srv/pics/backups /etc/pics
   sudo chown claude:videofy /srv/pics/releases /srv/pics/backups
   sudo chown videofy:videofy /etc/pics
   # /srv/pics/current is a symlink, created during first deployment
   ```

2. Firewall rules:
   ```bash
   sudo ufw allow 3479/tcp
   sudo ufw allow 3479/udp
   sudo ufw allow 49301:49400/udp
   ```

3. Production environment secrets:
   ```bash
   # Create if missing, or update ownership/permissions if it exists
   if [ ! -e /etc/pics/production.env ]; then
     sudo install \
       -o claude \
       -g videofy \
       -m 600 \
       /dev/null \
       /etc/pics/production.env
   else
     # Existing file: preserve contents, correct ownership/permissions
     sudo chown claude:videofy /etc/pics/production.env
     sudo chmod 600 /etc/pics/production.env
   fi

   # Verify ownership, permissions, and that file is not empty
   stat -c '%U %G %a %s %n' /etc/pics/production.env
   # Expected output: claude videofy 600 <size> /etc/pics/production.env

   # Enforce non-empty file before deployment
   test -s /etc/pics/production.env || {
     echo "ERROR: /etc/pics/production.env is empty"
     exit 1
   }

   # Operator fills in all STORAGE_*, TURN_*, DATABASE_*, JWT_* secrets
   ```

4. DNS (if not already configured):
   ```
   A record: pics.consummate7.com → 169.58.215.77
   A record (optional): turn.pics.consummate7.com → 169.58.215.77
   ```

### Deployment Command

From your local machine:

```bash
cd /path/to/c7-pics

# 1. Verify the target SHA
TARGET_SHA="<full 40-character git SHA>"
git fetch origin
git cat-file -e "$TARGET_SHA^{commit}"

# 2. Create and verify bundle (exact history, by branch name)
git bundle create c7-pics.bundle main
git bundle verify c7-pics.bundle
git bundle list-heads c7-pics.bundle

# 3. SCP bundle to c7-eu-01
scp c7-pics.bundle c7-claude:/tmp/

# 4. On c7-eu-01: prepare immutable release
ssh c7-claude bash -c '
  TARGET_SHA="'"${TARGET_SHA}"'"
  RELEASE=/srv/pics/releases/$TARGET_SHA
  
  # Clone release into immutable directory
  git clone /tmp/c7-pics.bundle "$RELEASE"
  cd "$RELEASE"
  git checkout --detach "$TARGET_SHA"
  
  # Verify SHA integrity
  test "$(git rev-parse HEAD)" = "$TARGET_SHA" || exit 1
  test -z "$(git status --short)" || exit 1
  
  # Link production env to external secret
  ln -s /etc/pics/production.env "$RELEASE/.env.production"
  test -L "$RELEASE/.env.production" || exit 1
  test "$(readlink -f "$RELEASE/.env.production")" = "/etc/pics/production.env" || exit 1
  
  # Install dependencies
  npm ci
  npm run build
'

# 5. Build SHA-tagged Docker images (with external env for interpolation)
ssh c7-claude bash -c '
  TARGET_SHA="'"${TARGET_SHA}"'"
  RELEASE=/srv/pics/releases/$TARGET_SHA
  
  cd "$RELEASE"
  IMAGE_TAG="$TARGET_SHA" docker compose \
    -f docker-compose.prod.yml \
    -f deploy/docker-compose.shared-host.yml \
    --env-file /etc/pics/production.env \
    build
'

# 6. Start services with SHA-tagged images
ssh c7-claude bash -c '
  TARGET_SHA="'"${TARGET_SHA}"'"
  RELEASE=/srv/pics/releases/$TARGET_SHA
  
  cd "$RELEASE"
  IMAGE_TAG="$TARGET_SHA" docker compose \
    -f docker-compose.prod.yml \
    -f deploy/docker-compose.shared-host.yml \
    --env-file /etc/pics/production.env \
    up -d
'

# 7. Verify LOCAL health (loopback)
ssh c7-claude bash -c '
  # Wait for services to be healthy
  for i in {1..30}; do
    curl -s http://127.0.0.1:4000/health >/dev/null && break
    sleep 1
  done
  curl -f http://127.0.0.1:4000/health || exit 1
  curl -f http://127.0.0.1:3000 > /dev/null || exit 1
'

# 8. Atomic pointer switch (after LOCAL health confirmed)
ssh c7-claude bash -c '
  TARGET_SHA="'"${TARGET_SHA}"'"
  RELEASE=/srv/pics/releases/$TARGET_SHA
  
  # Atomic symlink swap
  ln -sfn "$RELEASE" /srv/pics/current.tmp
  mv -Tf /srv/pics/current.tmp /srv/pics/current
  
  # Confirm
  test "$(readlink /srv/pics/current)" = "$RELEASE" || exit 1
'

# 9. Install/reload host Caddy (first deployment only)
# Skip this step if Caddy site for C7-PICS already exists in /etc/caddy/Caddyfile
ssh c7-claude bash -c '
  # Backup existing Caddyfile
  sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%s)
  
  # Add C7-PICS block from deploy/caddy/Caddyfile.shared-host
  # (Operator must manually append the block to /etc/caddy/Caddyfile)
  
  # Validate and reload
  sudo caddy validate --config /etc/caddy/Caddyfile
  sudo caddy reload --config /etc/caddy/Caddyfile
'

# 10. Public smoke test (after Caddy reload)
curl -f https://pics.consummate7.com/healthz || exit 1
curl -f https://pics.consummate7.com/ > /dev/null || exit 1
```

### Rollback

Rollback must re-activate the previous release with its exact image versions. Switching the symlink alone will NOT change running containers if images are missing the old tag.

```bash
PREVIOUS_SHA="<previous approved sha>"
PREVIOUS_RELEASE="/srv/pics/releases/$PREVIOUS_SHA"

# 1. Re-activate previous release containers with IMAGE_TAG
ssh c7-claude bash -c '
  PREVIOUS_SHA="'"${PREVIOUS_SHA}"'"
  PREVIOUS_RELEASE=/srv/pics/releases/$PREVIOUS_SHA
  
  cd "$PREVIOUS_RELEASE"
  IMAGE_TAG="$PREVIOUS_SHA" docker compose \
    -f docker-compose.prod.yml \
    -f deploy/docker-compose.shared-host.yml \
    --env-file /etc/pics/production.env \
    up -d
'

# 2. Verify LOCAL health with previous version
ssh c7-claude bash -c '
  for i in {1..30}; do
    curl -s http://127.0.0.1:4000/health >/dev/null && break
    sleep 1
  done
  curl -f http://127.0.0.1:4000/health || exit 1
'

# 3. Atomic pointer switch back
ssh c7-claude bash -c '
  PREVIOUS_SHA="'"${PREVIOUS_SHA}"'"
  PREVIOUS_RELEASE=/srv/pics/releases/$PREVIOUS_SHA
  
  ln -sfn "$PREVIOUS_RELEASE" /srv/pics/current.tmp
  mv -Tf /srv/pics/current.tmp /srv/pics/current
  
  test "$(readlink /srv/pics/current)" = "$PREVIOUS_RELEASE" || exit 1
'

# 4. Public smoke test
curl -f https://pics.consummate7.com/healthz || exit 1
curl -f https://pics.consummate7.com/ > /dev/null || exit 1

# Database rollback compatibility: consult migration design for backward compatibility rules.
# Do not automatically destroy the failed release or its database.
```

### Post-Deployment Verification

```bash
# Health check
curl https://pics.consummate7.com/healthz

# Container status
ssh c7-claude 'docker ps | grep c7-pics'

# Application logs (from current release)
ssh c7-claude 'cd /srv/pics/current && docker compose -f docker-compose.prod.yml -f deploy/docker-compose.shared-host.yml --env-file /etc/pics/production.env logs -f api'

# Caddy access logs
ssh c7-claude 'tail -f /var/log/caddy/c7-pics.log | jq .'

# Database health (from current release)
ssh c7-claude "cd /srv/pics/current && \
docker compose \
  -f docker-compose.prod.yml \
  -f deploy/docker-compose.shared-host.yml \
  --env-file /etc/pics/production.env \
  exec postgres \
  sh -lc 'psql -U \"\$POSTGRES_USER\" -d \"\${POSTGRES_DB:-ogun_production}\" -c \"SELECT NOW();\"'"
```

## Object Storage (S3) Readiness

The voter-document migration preflight does **NOT** verify S3 connectivity.

**Separate S3 readiness gate required before deployment:**

```bash
# Must pass all checks before running migrations:

TIMESTAMP=$(date +%s)
PROBE_OBJECT="voter-verification/pending/predeploy-probe-${TIMESTAMP}.txt"

1. Endpoint resolves and is reachable
   curl -I https://<s3-endpoint>/

2. Credentials authenticate
   aws s3 ls --endpoint-url https://<endpoint> --profile c7pics

3. Bucket exists and is private
   aws s3 ls <bucket> --endpoint-url https://<endpoint> --profile c7pics
   aws s3api get-bucket-acl <bucket> --endpoint-url https://<endpoint> --profile c7pics

4. Versioning is enabled
   aws s3api get-bucket-versioning <bucket> --endpoint-url https://<endpoint> --profile c7pics

5. Test upload in permitted namespace (voter-verification/pending/)
   echo "predeploy-probe" | aws s3 cp - \
     s3://<bucket>/${PROBE_OBJECT} \
     --endpoint-url https://<endpoint> --profile c7pics

6. Test read in permitted namespace
   aws s3 cp s3://<bucket>/${PROBE_OBJECT} - \
     --endpoint-url https://<endpoint> --profile c7pics

7. Test deletion succeeds in permitted namespace
   aws s3 rm s3://<bucket>/${PROBE_OBJECT} \
     --endpoint-url https://<endpoint> --profile c7pics
   # Expected: Success

8. Test deletion is denied outside permitted namespace (optional, if policy testable)
   # Create a test object outside voter-verification/pending/ (if safe)
   TEST_OBJECT="test/policy-probe-${TIMESTAMP}.txt"
   aws s3 cp - s3://<bucket>/${TEST_OBJECT} \
     --endpoint-url https://<endpoint> --profile c7pics
   aws s3 rm s3://<bucket>/${TEST_OBJECT} \
     --endpoint-url https://<endpoint> --profile c7pics
   # Expected: AccessDenied (if policy-protected)
```

Only after these pass should `npm run deploy:migrate` be run.

**Important:** The probe object uses the `voter-verification/pending/` namespace, which matches the bucket policy grant for application deletion. Do NOT use arbitrary test namespaces outside the application's custody model.

## Network Isolation

C7-PICS uses a dedicated Docker bridge network (`c7-pics-backplane`) to avoid accidental interaction with videofy services. Volumes and named containers are prefixed `c7-pics-` to prevent naming collisions.

Videofy and C7-PICS are completely isolated:
- Separate databases
- Separate caches (Redis)
- Separate TURN credentials
- Separate object storage buckets
- Separate Caddy routing
