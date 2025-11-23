"""
api/__main__.py - Run FastAPI server
Usage:
  python -m api              # defaults to port 8000
  API_PORT=9000 python -m api
  API_RELOAD=1 python -m api
"""

import os
import uvicorn


def main():
  port = int(os.environ.get("API_PORT", "8000"))
  reload = os.environ.get("API_RELOAD", "0").lower() in {"1", "true", "yes"}
  uvicorn.run("api.app:app", host="0.0.0.0", port=port, reload=reload)


if __name__ == "__main__":
  main()
