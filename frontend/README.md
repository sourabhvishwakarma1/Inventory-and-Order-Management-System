# InvenTrack Frontend

React + Vite frontend for the InvenTrack Inventory & Order Management System.

## Development

```bash
npm install
npm run dev
```

Dev server runs on http://localhost:5173.

## Build

```bash
npm run build
```

Output is in the `dist/` directory, served by Nginx in production (Docker).

## Environment Variables

| Variable | Description | Default |
|:---|:---|:---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8001` |
