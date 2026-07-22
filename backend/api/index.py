"""Vercel Python entrypoint.

Vercel's Python runtime looks for an ASGI application named `app` in the
service entrypoint. We re-export the FastAPI app defined in `app.main`.
"""

from app.main import app  # noqa: F401
