# Architecture du Monorepo OpenEA-Platform

## Structure
- **apps/web**: Application Next.js (Frontend Studio & Portail)
- **apps/server**: Application NestJS (Backend API & Moteur de Règles)
- **packages/database**: Configuration Prisma ORM partagée
- **packages/types**: Définitions TypeScript partagées (DTOs, Interfaces)

## Technologies
- **Monorepo**: Turborepo
- **Backend**: NestJS, PostgreSQL, Prisma
- **Frontend**: Next.js, React Flow, Tailwind CSS, Shadcn/UI
- **Authentification**: Auth.js (NextAuth) / Passport.js

## Démarrage
Utiliser `npm run dev` à la racine pour lancer tous les services.
