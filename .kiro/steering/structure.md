# Project Structure

## Root Directory

```
pahoy-front/
├── .github/              # GitHub workflows and sync config
├── .kiro/                # Kiro IDE configuration and specs
├── figma-screens/        # Screenshot references from Figma design
├── public/               # Static assets
├── src/                  # Source code (see below)
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript root config
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind configuration
└── .prettierrc            # Prettier code formatting config
```

## Source Code Structure (`src/`)

```
src/
├── components/           # All React components
│   ├── base/            # Core UI building blocks
│   │   ├── avatar/      # Avatar components
│   │   ├── badge/       # Badge components
│   │   ├── buttons/     # Button variants
│   │   ├── checkbox/    # Checkbox components
│   │   ├── input/       # Text input components
│   │   ├── radio/       # Radio button components
│   │   ├── select/      # Dropdown select components
│   │   ├── textarea/    # Multi-line text inputs
│   │   ├── toggle/      # Toggle switches
│   │   └── ...          # Other base components
│   ├── application/     # Complex application components
│   │   ├── app-navigation/     # Navigation UI
│   │   ├── carousel/           # Carousel component
│   │   ├── charts/             # Chart components
│   │   ├── date-picker/        # Date selection
│   │   ├── empty-state/        # Empty state UI
│   │   ├── file-upload/        # File upload
│   │   ├── loading-indicator/  # Loading spinners
│   │   ├── modals/             # Modal dialogs
│   │   ├── onboarding/         # Onboarding flows
│   │   ├── pagination/         # Pagination
│   │   ├── slideout-menus/     # Sliding menus
│   │   ├── table/              # Data tables
│   │   └── tabs/               # Tab navigation
│   ├── foundations/     # Design tokens and foundational elements
│   │   ├── featured-icon/      # Decorative icons with backgrounds
│   │   └── ...
│   ├── marketing/       # Marketing-specific components
│   └── shared-assets/   # Reusable illustrations and assets
├── hooks/               # Custom React hooks
├── pages/               # Route/page components
├── providers/           # React context providers
│   ├── theme.tsx        # Theme context
│   └── router-provider.tsx # Router context
├── styles/              # Global styling
│   ├── globals.css      # Global styles
│   ├── theme.css        # CSS variables and theme tokens
│   └── typography.css   # Typography definitions
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── cx.ts            # Class name utilities
│   └── is-react-component.ts # Component type checking
├── main.tsx             # Application entry point
└── App.tsx              # Root component
```

## File Naming Convention

All files follow **kebab-case** naming:

- Component files: `date-picker.tsx`, `user-profile.tsx`
- TypeScript/JavaScript files: `api-client.ts`, `auth-context.tsx`
- Style files: `globals.css`, `button-styles.css`
- Test files: `button.test.ts`, `modal.spec.tsx`

## Key Component Categories

### Base Components (`components/base/`)

Low-level, reusable UI components with minimal logic:
- Form controls (Input, Select, Checkbox, Radio, Toggle)
- Display elements (Avatar, Badge, Tooltip)
- Interactive elements (Button)

### Application Components (`components/application/`)

Complex UI patterns and features:
- Navigation (Header, Sidebar)
- Data Display (Table, Pagination, Carousel)
- User Interactions (DatePicker, Modal, Tabs)
- Onboarding flows and empty states

### Styling Files

- `src/styles/globals.css` - Reset styles and global typography
- `src/styles/theme.css` - CSS variables for colors, spacing, sizing
- `src/styles/typography.css` - Font families and text scales

## Configuration Files

- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS theme and plugin setup
- `tsconfig.json` - TypeScript compiler options with path aliases
- `.prettierrc` - Code formatting rules
- `index.html` - HTML template with root div

## Figma Design System

Design source: https://www.figma.com/design/21azV7Zha4GR2qbyTrCOBk/Pa--Hoy---App-Design

This is the single source of truth for:
- Component appearance and behavior
- Color palette and variables
- Typography scales
- Spacing and sizing tokens
- Animation and transition guidelines
- Responsive breakpoints

## Development Workflow

1. Check Figma for design specifications
2. Locate or create component in `src/components/`
3. Use React Aria Components as foundation for accessibility
4. Follow existing styling patterns with Tailwind CSS
5. Test visual appearance against Figma design
6. Use Playwright MCP for automated screenshot comparison
