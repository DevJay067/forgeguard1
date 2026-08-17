# ForgeGuard Technology Stack

This document outlines the technologies, libraries, frameworks, and APIs utilized across the ForgeGuard platform.

---

## 1. Frontend Architecture
ForgeGuard's web app is located in `apps/web` and is built as a responsive, high-performance dashboard:

* **Framework**: [Next.js (v15.5.19)](https://nextjs.org/) utilizing React 19 and App Router architecture.
* **Styling**: [TailwindCSS](https://tailwindcss.com/) with a dark-mode optimized design system featuring glassmorphism, gradient borders, and responsive grid layouts.
* **Animations**: [Framer Motion (v12)](https://www.framer.com/motion/) for fluid transitions, tab switching animations, modal spring physics, and interactive hover feedback.
* **Components & Icons**: 
  - [Lucide React](https://lucide.dev/) for crisp, uniform iconography.
  - Radix UI Primitives (radix-ui/react-navigation-menu, radix-ui/react-slot) for accessible interface patterns.
* **Score & Metric Counters**: [@number-flow/react](https://number-flow.barvian.me/) for high-framerate, smooth scroll transitions on audit score updates.
* **Markdown Rendering**: [React Markdown](https://github.com/remarkjs/react-markdown) for formatting security critiques, AI reasoning reports, and auditing logs.

---

## 2. Multi-Agent AI Orchestration
The core logic in `apps/web/src/lib/agents` uses an intelligent multi-agent pipeline:

* **Primary AI Engine**: [@google/generative-ai (v0.24.1)](https://www.npmjs.com/package/@google/generative-ai) calling Google's `gemini-2.5-flash` model.
* **Resilience & Fallbacks**: Integrated [OpenRouter API](https://openrouter.ai/) client. If Gemini API rate limits (429) or fetch connections fail, the backend seamlessly diverts execution to free-tier fallback models:
  - `google/gemma-4-26b-a4b-it:free`
  - `google/gemma-4-31b-it:free`
* **Agent System Roles**:
  - **Reasoning Agent (Agent R)**: Extracts schema entities and designs access-control rules based on natural language user descriptions.
  - **Rules Generator (Agent F)**: Writes raw, valid, production-grade Firebase Firestore Security Rules.
  - **Auditor Agent (Agent A)**: Critiques rule vulnerabilities and calculates a security score (0-100).
  - **Simulator Agent**: Performs live test evaluation, constructs query execution plan tables, and runs self-healing rule repairs.

---

## 3. Database & Security Testing Engine
Security rules validation is powered by a hybrid engine to guarantee correct evaluation:

* **Local Emulator Validation**: [@firebase/rules-unit-testing (v5.0.1)](https://www.npmjs.com/package/@firebase/rules-unit-testing) loads the local Firestore Emulator instance to run test cases through Firestore's official rules evaluation compiler.
* **AI Evaluation (Fallback & Trace)**: If the emulator is offline or skipped, the `SimulatorAgent` evaluates rules against the operation context to return trace logs.
* **Database Target**: Firestore is the core database target (following the architecture specified in [GEMINI.md](file:///C:/Users/jay%20ashok%20magar/Documents/forgeguard/GEMINI.md)).

---

## 4. Development & Build Tools
* **Monorepo Manager**: [Turborepo](https://turbo.build/) manages the building, linting, and development pipelines across the packages.
* **Language**: [TypeScript (v5.3.3)](https://www.typescriptlang.org/) for workspace type safety.
* **Script Runners**: [tsx](https://github.com/privatenumber/tsx) and [ts-node](https://typestrong.org/ts-node/) for running diagnostic checks and verification scripts.
* **Configuration**: `dotenv` for securely configuring API keys (`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`).
