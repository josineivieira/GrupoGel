# Deploy with Docker (local / VPS)

This project includes a multi-stage `Dockerfile` and `docker-compose.yml` to run the app (frontend + backend) as a single service.

Quick start (build + run):

```bash
# Build and run in foreground (useful for debugging)
docker compose up --build

# Or run detached
docker compose up -d --build

# Check logs
docker compose logs -f app

# Health check (should return { success: true, message: 'Server is running' })
curl http://localhost:5000/api/health
```

Notes:
- The container serves the React `build/` generated during image build using the backend Express server.
- Persistent data:
  - `./backend/uploads` is mounted into the container so uploaded photos are preserved.
  - `./backend/data` is mounted so the `db.json` (mock DB) persists between runs.
- If you change frontend code locally and want the image to include the change, rebuild the image with `docker compose up --build`.

Security:
- Do not commit `.env` files with secrets.
- If deploying to public servers, set up HTTPS, firewall, and secrets management.

Troubleshooting:
- If build fails due to network/npm issues, try again or run `docker system prune -f` to recover disk space.
- To run the app in development mode (hot-reload) keep running backend and frontend separately with `npm run dev`.

If you want, I can: build the image here and run the container to validate it locally.