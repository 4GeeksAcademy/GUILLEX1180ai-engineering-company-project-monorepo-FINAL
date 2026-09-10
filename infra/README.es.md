# Carpeta `infra`

Esta carpeta contiene las **configuraciones de infraestructura** para el monorepo (por ejemplo: Dockerfiles, scripts de Terraform, manifiestos de despliegue, configuraciones de Nginx, etc.).

- **Propósito principal**: centralizar la definición de la infraestructura necesaria para ejecutar las aplicaciones y servicios de la compañía.
- **Recomendación**: documenta cómo aprovisionar y desplegar la infraestructura.

---

## 🚀 Cómo desplegar el sitio web de TrackFlow

El sitio web está en `uis/website/` y es **100% estático** (HTML + Tailwind CDN + CSS + JS). Puedes desplegarlo de varias formas:

### 🖥️ Local (desarrollo)

```bash
# Opción 1 — con serve (recomendado)
npx serve uis/website

# Opción 2 — con Python (sin dependencias)
python3 -m http.server 8080 -d uis/website
```

Luego abre `http://localhost:8080` en el navegador.

### 🌐 GitHub Pages (gratis, automático)

Crea el archivo `.github/workflows/deploy-pages.yml` en la raíz del repo con este contenido:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'uis/website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: uis/website
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Luego en GitHub: **Settings → Pages → Source → GitHub Actions**.

### ☁️ Netlify (1 clic)

1. Ve a [netlify.com](https://netlify.com) y haz login con GitHub
2. "Import from Git" → selecciona tu repo
3. **Publish directory**: `uis/website`
4. **Build command**: déjalo vacío (no necesita build)
5. ¡Listo! Se despliega automáticamente en cada push

### ▲ Vercel (1 clic)

1. Ve a [vercel.com](https://vercel.com) y haz login con GitHub
2. "Import from Git" → selecciona tu repo
3. **Root directory**: `uis/website`
4. **Framework**: `Other`
5. ¡Listo!

### 🐳 Docker

```bash
docker build -f infra/Dockerfile.web -t trackflow-web .
docker run -p 8080:80 trackflow-web
```

Luego abre `http://localhost:8080`.

### 📦 ¿Y los demás servicios (backend, agents, etc.)?

Cuando el proyecto crezca con servicios backend, agents o APIs, se añadirán más Dockerfiles y un `docker-compose.yml` aquí mismo en `infra/`. Por ahora, el sitio web es completamente estático y no necesita backend.

---

## Archivos en esta carpeta

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile.web` | Imagen Nginx para servir el sitio web estático |
| `README.es.md` | Esta guía de despliegue (español) |
| `README.md` | Guía de despliegue (inglés) |
