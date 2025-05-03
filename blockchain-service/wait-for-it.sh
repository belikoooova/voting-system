#!/usr/bin/env bash
set -e

hostport="$1"
shift

host=${hostport%%:*}
port=${hostport##*:}

echo "Waiting for $host on port $port…"

for i in $(seq 1 60); do
  if nc -z "$host" "$port"; then
    echo "$host:$port is up!"
    exec "$@"
  fi
  sleep 1
done

echo "Timeout waiting for $host:$port" >&2
exit 1
