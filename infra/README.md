# `infra` folder

This folder contains **infrastructure configurations** for the monorepo (for example: Dockerfiles, Terraform scripts, deployment manifests, Nginx configs, etc.).

- **Main purpose**: to centralize the definition of the infrastructure required to run the company's applications and services.
- **Recommendation**: document how to provision and deploy the infrastructure.

> _Spanish version with full deployment guide: [README.es.md](./README.es.md)._

## Quick deploy — TrackFlow website

The site is in `uis/website/` (100% static — HTML + Tailwind CDN + CSS + JS).

### Locally
```bash
npx serve uis/website
# or
python3 -m http.server 8080 -d uis/website
```

### One-click platforms
- **Netlify**: Import your repo → Publish directory: `uis/website`
- **Vercel**: Import your repo → Root directory: `uis/website`
- **GitHub Pages**: Use the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`

### Docker
```bash
docker build -f infra/Dockerfile.web -t trackflow-web .
docker run -p 8080:80 trackflow-web
```

See [README.es.md](./README.es.md) for detailed instructions (in Spanish).
