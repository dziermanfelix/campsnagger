#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r api/requirements.txt

exec uvicorn main:app \
  --reload \
  --host 127.0.0.1 \
  --port 8000 \
  --app-dir api
