# AGENTS.md

## Project Overview

This is a cross-platform desktop application built with **Tauri 2.x** framework, combining a **Vue 3** frontend with a **Rust** backend. The application demonstrates a basic greet functionality where the frontend calls a Rust command.

## Tech Stack

### Frontend
- **Vue 3.5.13** - Progressive JavaScript framework using Composition API with `<script setup>` syntax
- **TypeScript 5.6.2** - Type-safe JavaScript
- **Vite 6.0.3** - Next-generation frontend build tool
- **vue-tsc 2.1.10** - TypeScript compiler for Vue

### Backend
- **Tauri 2.x** - Framework for building tiny, fast binaries for all major desktop platforms
- **Rust (Edition 2021)** - Systems programming language
- **tauri-plugin-opener 2.x** - Plugin for opening URLs in default browser

## Project Structure

```
tauri-app/
├── src/                    # Frontend source code
│   ├── main.ts            # Vue application entry point
│   ├── App.vue            # Root Vue component
│   ├── assets/            # Static assets (SVGs, images)
│   └── vite-env.d.ts      # TypeScript declarations for Vite
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs        # Rust binary entry point
│   │   └── lib.rs         # Tauri app configuration and commands
│   ├── Cargo.toml         # Rust dependencies
│   ├── build.rs           # Build script
│   └── tauri.conf.json    # Tauri configuration
├── public/                 # Public static assets
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # NPM configuration
```

## Key Configuration

### Build Commands
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build
- `npm run tauri` - Tauri CLI commands

### Development Server
- Port: `1420` (strict mode)
- HMR Port: `1421`
- Dev URL: `http://localhost:1420`

### TypeScript Configuration
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Bundler mode resolution

### Tauri Configuration
- Product Name: `tauri-app`
- Version: `0.1.0`
- Identifier: `com.demo-rx.tauri-app`
- Window: 800x600 pixels
- Bundle targets: all platforms

## Architecture

### Frontend-Backend Communication
The application uses Tauri's IPC (Inter-Process Communication) to call Rust commands from the frontend:

1. **Rust Command** (`src-tauri/src/lib.rs:2-5`):
   ```rust
   #[tauri::command]
   fn greet(name: &str) -> String {
       format!("Hello, {}! You've been greeted from Rust!", name)
   }
   ```

2. **Frontend Invocation** (`src/App.vue:8-11`):
   ```typescript
   import { invoke } from "@tauri-apps/api/core";
   
   async function greet() {
     greetMsg.value = await invoke("greet", { name: name.value });
   }
   ```

### Build Pipeline
1. Frontend: Vue SFC → TypeScript → Vite → Static files in `dist/`
2. Backend: Rust → Cargo → Native binary
3. Tauri bundles frontend dist with native binary into installable app

## Development Workflow

### Prerequisites
- Node.js (for frontend)
- Rust (for backend)
- Platform-specific build tools (Visual Studio Build Tools on Windows, Xcode on macOS, etc.)

### Running in Development
```bash
npm run tauri dev
```
This command:
1. Starts Vite dev server on port 1420
2. Builds Rust backend in debug mode
3. Opens application window

### Building for Production
```bash
npm run tauri build
```
This command:
1. Runs `npm run build` (TypeScript check + Vite build)
2. Builds Rust backend in release mode
3. Creates installable bundle in `src-tauri/target/release/bundle/`

## Code Conventions

### Vue Components
- Use `<script setup lang="ts">` for Composition API
- Reactive state with `ref()` or `reactive()`
- Scoped styles for component-specific CSS

### Rust
- Commands use `#[tauri::command]` macro
- Return types must implement `Serialize`
- Error handling with `Result<T, E>` when needed

### TypeScript
- Strict type checking enabled
- Use type inference where possible
- Explicit types for function parameters and return types

## Plugins Used

### @tauri-apps/api
Core Tauri API for frontend:
- `invoke()` - Call Rust commands
- Window management APIs
- Event system

### @tauri-apps/plugin-opener
Opens URLs in default browser with `openUrl()` function.

## Security Notes

- CSP (Content Security Policy) is currently set to `null` in development
- Windows console is hidden in release builds
- Follow Tauri security best practices for production apps

## Known Issues

1. **Windows Library Naming**: The `_lib` suffix in `tauri_app_lib` is necessary to avoid conflicts between binary and library names on Windows (see `src-tauri/Cargo.toml:10-15`)

## Next Steps for Development

1. Add more Tauri commands for complex backend logic
2. Implement state management (Pinia) for larger apps
3. Add routing (Vue Router) for multi-page apps
4. Configure CSP for production security
5. Add Tauri plugins for system features (file system, clipboard, notifications, etc.)
6. Implement error boundaries and loading states
7. Add tests for both frontend (Vitest) and backend (Rust tests)