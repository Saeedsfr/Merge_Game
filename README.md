# Merge Game

A lightweight, modular merge‑style idle game built with React, TypeScript, and Vite, designed for fast iteration and seamless deployment as a Telegram Mini App.

## 🎮 Gameplay Features
- Drag & drop items on a grid
- Merge identical items to create higher‑level objects
- Idle / offline income handled through modular core logic
- Auto‑merge and spawn queue for smoother progression
- Config‑driven economy and grid behavior via core/config.ts

## 🧱 Project Structure
src/
  App.tsx
  main.tsx
  gameLogic.ts
  core/
    config.ts
    types.ts
    economy.ts
    grid.ts
    merge.ts
    offline.ts
  ui/
    components/
      GameGrid.tsx
      Controls.tsx
      TrashBin.tsx
      OfflinePopup.tsx
    hooks/
      useGameState.ts

## 🚀 Getting Started
npm install
npm run dev

## 📦 Build for Production
npm run build
npm run preview

## 🌐 Telegram Mini App (Planned)
- Deployment via Vercel or similar hosting
- WebApp integration with a Telegram bot
- Future additions: cloud save, analytics, boosters, shop, daily rewards

## 📝 Roadmap
- UI polish and mobile‑first improvements
- Daily rewards and retention mechanics
- Boosters and monetization hooks
- Full Telegram Mini App integration
