#MiniGames

Website with a collection of mini-games.

Built with TypeScript, SCSS and Vite - no frameworks.

## run locally

```bash
npm ci
npm run dev
```

## Firebase Authentication setup

Create a Firebase project and register a web app in the Firebase Console.
In **Authentication → Sign-in method**, enable **Email/Password**. Copy the
web app configuration values into `.env.local` (start from `.env.example`);
Vite exposes these Firebase client configuration values in the frontend bundle,
so they are not authentication credentials. Do not put passwords or Firebase
user tokens in this file.

The Firebase SDK is initialized by `src/shared/firebase.ts` when imported.
Missing configuration is reported explicitly; Firebase project creation and
provider enablement must be completed in the Firebase Console.

The client app session is stored under
`minigames:aista12:app-session` in local storage. It contains only the display
name, email, authentication timestamp, and an avatar URL when available. It
expires five minutes after authentication; reloads and app activity do not
extend that fixed lifetime. Firebase credentials and tokens are not stored in
this session record.

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
