# Technology Stack

## Core Framework & Language

- **React 19.2.4** - Latest React with concurrent rendering
- **TypeScript 5.9.3** - Type-safe development
- **React Router 7.13.0** - Client-side routing

## Build & Development

- **Vite 8.0.2** - Fast build tool and dev server (http://localhost:5173)
- **Node.js** - Runtime environment (uses `npm` as package manager)

## Styling & UI

- **Tailwind CSS 4.2.2** - Utility-first CSS framework with custom design tokens
- **@tailwindcss/vite 4.2.2** - Vite plugin for Tailwind
- **@tailwindcss/typography 0.5.19** - Typography plugin for content styling
- **tailwindcss-animate 1.0.7** - Animation utilities
- **tailwind-merge 3.5.0** - Merge Tailwind classes intelligently
- **tailwindcss-react-aria-components 2.0.1** - React Aria styling integration

## Component & Accessibility Foundation

- **React Aria Components 1.16.0** - Accessible, unstyled components
- **React Aria 3.47.0** - Hooks and utilities for accessible interactions

## UI Components & Icons

- **@untitledui/icons 0.0.22** - Icon library (1,100+ line-style icons)
- **@untitledui/file-icons 0.0.9** - File type icons

## Interactions & Animation

- **motion 12.38.0** (Framer Motion) - Complex animations and interactions
- **react-hotkeys-hook 5.2.4** - Keyboard shortcut handling

## Data & Charts

- **recharts 3.8.0** - React charting library
- **embla-carousel-react 8.6.0** - Carousel/slider component

## Form & Input

- **input-otp 1.4.2** - OTP (One-Time Password) input component
- **qr-code-styling 1.9.2** - QR code generation and styling

## Code Quality & Formatting

- **Prettier 3.8.1** - Code formatter
- **prettier-plugin-tailwindcss 0.7.2** - Tailwind class sorting
- **@trivago/prettier-plugin-sort-imports 6.0.2** - Import sorting
- **typescript-eslint 8.53.1** - TypeScript linting

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Preview production build
npm run preview
```

## Key Configuration

- **Base URL**: `@/*` resolves to `src/*` for clean imports
- **TypeScript Compiler**: Multi-project setup with `tsconfig.app.json` and `tsconfig.node.json`
- **Entry Point**: `src/main.tsx` (implicit, standard Vite setup)
- **Output**: Built files to `dist/` directory

## Package Manager

Uses **npm** with `npm` for dependency management (lock file: `package-lock.json`).

## Development Approach

- **Mobile-First** - Design and develop with mobile as the primary target
- **Highly Responsive** - All components adapt seamlessly across screen sizes
- **TypeScript-First** - Strong typing throughout the codebase
- **Accessibility-First** - Built on React Aria for WCAG compliance
