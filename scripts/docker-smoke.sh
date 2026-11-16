#!/usr/bin/env bash
set -euo pipefail
image=ceos-ceos:qa
build_image=ceos-ceos:qa-build
container=ceos-qa-app-$$
mongo=ceos-qa-mongo-$$
network=ceos-qa-network-$$
test ! -e .env.ceos-docker-smoke
test ! -e .ceos-docker-smoke.key
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then docker logs --tail 40 "$container" 2>/dev/null || true; fi
  docker rm -f "$container" "$mongo" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  rm -f .env.ceos-docker-smoke .ceos-docker-smoke.key
  exit "$status"
}
trap cleanup EXIT
printf 'DOCKER_CONTEXT_SENTINEL=not-a-real-secret\n' > .env.ceos-docker-smoke
printf 'not-a-real-private-key\n' > .ceos-docker-smoke.key
docker build --target build --build-arg REACT_APP_API_LOGIN_URL=http://localhost:8081 --build-arg REACT_APP_API_MATH_URL=http://localhost:8080 -t "$build_image" .
docker run --rm --entrypoint sh "$build_image" -ec 'node --version | grep -q "^v22."; test ! -e /app/.env.ceos-docker-smoke; test ! -e /app/.ceos-docker-smoke.key'
docker build --build-arg REACT_APP_API_LOGIN_URL=http://localhost:8081 --build-arg REACT_APP_API_MATH_URL=http://localhost:8080 -t "$image" .
docker run -d --name "$container" -p 127.0.0.1:18000:80 "$image" >/dev/null
port=18000
route=/
ready=false
for attempt in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$port$route" >/dev/null; then ready=true; break; fi
  sleep 1
done
test "$ready" = true
curl -fsS http://127.0.0.1:$port/login | grep -q '<div id="root">'
curl -fsS http://127.0.0.1:$port/iot | grep -q '<div id="root">'
docker exec "$container" sh -ec 'test -z "$(find /usr/share/nginx/html -name "*.map" -print -quit)"'
echo 'Frontend: root, SPA deep links, Node 22 build and sensitive-file exclusions passed.'

# Optional short-lived artifact for scanning the exact tested image with the
# existing local Docker Scout installation, without pushing to a registry.
if [ -n "${CEOS_DOCKER_IMAGE_ARCHIVE:-}" ]; then
  docker save -o "$CEOS_DOCKER_IMAGE_ARCHIVE" "$image"
fi
