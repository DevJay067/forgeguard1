# ForgeGuard 🛡️

**Autonomous Firebase Security Engineering**

ForgeGuard is an advanced, AI-driven platform designed to automate the generation, auditing, and deployment of Firebase security rules (`firestore.rules`). Built with a state-of-the-art tech stack and a premium, highly interactive user interface, ForgeGuard empowers developers to secure their cloud architectures in seconds without manually writing complex security logic.

---

## 🚀 Key Features

*   **AI Orchestration Engine**: Describe your project's architecture (e.g., "SaaS with teams, tasks, file uploads, and admin roles") in plain English. ForgeGuard autonomously analyzes the architecture and streams the generation process in real-time.
*   **Security Rule Generation**: Automatically outputs precise, structured `firestore.rules` blocks based on your input.
*   **Automated Security Auditing**: Every generated rule set is immediately audited. ForgeGuard calculates a Risk Score out of 100, provides a detailed critique, and verifies that critical security flaws (like \`if true\`) are absent.
*   **Deployment Planning**: Generates an actionable deployment plan directly in the UI.
*   **Security Chat Interface**: An integrated, interactive chat UI where you can discuss security requirements or refine rules interactively.
*   **Premium Interactive UI**: Features a custom-built, high-performance HTML5 Canvas "Anti-Gravity" particle background. The dot-matrix grid seamlessly repels your cursor and uses spring physics to snap back, creating an incredibly tactile and engaging experience.

---

## 🛠️ Tech Stack

ForgeGuard leverages the bleeding edge of modern web development:

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **UI Library**: [React 19](https://react.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using inline `@theme` configuration and hex-based custom color variables)
*   **Components**: [shadcn/ui](https://ui.shadcn.com/) architecture for custom, accessible, and unstyled components.
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Monorepo**: [Turborepo](https://turbo.build/) for lightning-fast build systems and workspace management.

---

## 📂 Project Structure

This project is configured as a Turborepo monorepo:

\`\`\`
forgeguard/
├── apps/
│   └── web/                   # The main Next.js 15 application
│       ├── src/
│       │   ├── app/           # App Router pages (/, /orchestration, /api, etc.)
│       │   ├── components/    # Reusable React components
│       │   │   ├── chat/      # Security Chat UI
│       │   │   └── ui/        # Custom shadcn UI elements (Hero, Header, Backgrounds)
│       │   └── lib/           # Utility functions
├── packages/                  # Shared internal packages (if applicable)
├── package.json
└── turbo.json
\`\`\`

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) and your preferred package manager (npm, pnpm, or yarn) installed.

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/your-username/forgeguard.git
    cd forgeguard
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

3.  **Start the development server:**
    \`\`\`bash
    npm run dev
    \`\`\`
    This will start the application at `http://localhost:3000`.

---

## 📖 How to Use ForgeGuard

### 1. The Landing Page
Navigate to `http://localhost:3000`. You will be greeted by the premium ForgeGuard hero section overlaid on the interactive Anti-Gravity Matrix. Move your mouse around to see the canvas physics engine in action.

### 2. The Orchestration Center
Click the **Start Orchestrator** button to navigate to the dedicated `/orchestration` dashboard.
*   **Goal Definition**: In the top-left panel, type a description of your app's architecture and the data models you need secured.
*   **Process Trace**: Click "Generate Security Rules". Watch the Server-Sent Events (SSE) stream trace the AI's internal reasoning and processes in real-time.
*   **Output & Audit**: The right panel will populate with the final, syntax-highlighted `firestore.rules`. Below it, you will see a Security Audit summarizing the safety of the rules and an automated Deployment Plan.

### 3. Security Chat
Click the **Security Chat** toggle button at the top of the Orchestration dashboard to switch to a conversational interface, perfect for debugging existing rules or asking general security architecture questions.

---

## 🎨 Design System

The application uses a custom-defined neutral/zinc theme designed to eliminate generic template styles (often referred to as "AI slop"). 
Colors are rigidly controlled via CSS variables in `src/app/globals.css`. 
The primary interactive element is the `grid-background.tsx`, which implements a `requestAnimationFrame` loop to calculate continuous radial distances between thousands of nodes and the user's cursor, applying velocity and friction to create organic repulsion effects.

---

## 🤝 Contributing

We welcome contributions! Please follow standard Git workflows (fork, branch, commit, pull request).

## 📄 License

This project is licensed under the MIT License.
