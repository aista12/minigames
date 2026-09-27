#MiniGames

Website with a collection of mini-games.

Built with TypeScript, SCSS and Vite - no frameworks.

## run locally

```bash
npm ci
npm run dev
```

## gitHub pages deployment

The `story-2` branch is built and deployed to GitHub Pages by the
`.github/workflows/deploy-pages.yml` workflow. The workflow can also be started
manually from the GitHub Actions tab.

In the repository settings, select **Settings → Pages → Build and deployment →
Source → GitHub Actions**. After the workflow succeeds, the site is available at
<https://aista12.github.io/minigames/>.

Production builds use `/minigames/` as their base path for this repository;
the Vite development server continues to use `/` locally.




branch story-1: deployed at: https://minigames1-hazel.vercel.app/
