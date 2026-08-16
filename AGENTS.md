# RadarAI Project Memory

This project has frontend agent instructions in `frontend/agents/`. Use them as project rules for future frontend work.

## Source Agent Files

- `frontend/agents/frontend-agent.md`: primary frontend implementation rules.
- `frontend/agents/clean-code-agent.md`: review and cleanup checklist after frontend changes.
- `frontend/agents/zustand-agent.md`: Zustand store rules and anti-patterns.
- `frontend/agents/rules-agent.md`: duplicate of the frontend implementation rules.

## Frontend Stack

- Next.js 14 App Router.
- TypeScript strict mode.
- Tailwind CSS only.
- Zustand with granular selectors.

## Operating Rules

- Components should contain JSX only. Keep business logic, `useState`, derived values, handlers, and store consumption in `use*.hook.ts` files.
- API calls belong in `.service.ts` files, not components, hooks with embedded fetch logic, or stores.
- Stores must not perform API calls.
- Consume Zustand only from hooks, never directly from JSX components.
- Use granular Zustand selectors: `useStore(state => state.field)`.
- Never destructure the entire Zustand store with `const { x } = useStore()`.
- State updates must be immutable.
- Use Tailwind classes for styling. Do not create CSS files or styled-components.
- Inline styles are allowed only for dynamic calculated values such as progress width.
- Avoid magic strings, numbers, and timeouts. Put constants in `src/constants/` using `UPPER_SNAKE_CASE`.
- Do not use `any`. Define shared interfaces in `src/types/`.
- Type component props with interfaces and type hook returns.
- Use `next/link` or `useRouter` for internal navigation. Do not use `window.location.href` or raw `<a>` for internal links.
- Use `next/image` instead of `<img>`.
- Add `'use client'` only when required by hooks, browser APIs, refs, effects, or event handlers.
- No `console.log`; only `console.error` in catch blocks.
- Props should be destructured in component signatures.
- List keys must be unique and should not use array indexes for dynamic lists.
- Images require `alt`.
- Never use `innerHTML` with user data.
- Keep `useEffect` dependencies complete.

## Preferred Structure

```text
src/
  app/
  components/
    [domain]/
      ComponentName/
        ComponentName.tsx
        useComponentName.hook.ts
  stores/
    useNameStore.store.ts
  services/
    feature.service.ts
  constants/
    ROUTES.ts
    FEATURE_NAME.ts
  types/
    entity.types.ts
```

## Import Order

```ts
// 1. React and external libraries
// 2. Internal components
// 3. Internal hooks
// 4. Services
// 5. Constants and types
```

## Verification Flow

After frontend edits:

1. Apply the frontend rules from `frontend/agents/frontend-agent.md`.
2. Review and clean the touched files with `frontend/agents/clean-code-agent.md`.
3. If Zustand is touched, apply `frontend/agents/zustand-agent.md`.
4. Run `npm run build` when feasible.
5. Report created/modified files and build result.

---

## Browser Automation & Tooling Rules (Strictly No MCP)

> **CRITICAL RULE: STRICTLY NO MCP (Model Context Protocol)**
> - **MCP is strictly PROHIBITED.** Do NOT invoke or configure any MCP servers or MCP-based browser tools.
> - All browser automation, UI testing, page inspection, and form interactions MUST be executed exclusively using `playwright-cli` in the terminal / shell.

### 1. Tooling & Discovery
- Para tareas que requieran interacción web, navegación visual o pruebas E2E, usa `playwright-cli`.
- Consulta la documentación de la skill instalada (`.claude/skills/playwright-cli/SKILL.md`) o ejecuta `playwright-cli --help` para ver la sintaxis de los comandos.

### 2. Core Workflow & Rules
1. **Flujo por Snapshot:** Abre la página (`open` / `goto`), obtén el estado con `snapshot` y usa siempre las referencias devueltas (`[ref=e#]`) para hacer clic o escribir.
2. **Re-snapshot obligatorio:** Tras una acción que cambie el DOM o navegue, actualiza el estado antes de continuar.
3. **Ahorro de contexto:**
   - No vuelques capturas visuales pesadas al contexto a menos que sea estrictamente necesario.
   - Usa `--depth` en snapshots si la página es muy compleja.
4. **Persistencia:** Si una prueba requiere login, guarda y restaura el estado con `state-save auth.json` / `state-load auth.json`.
5. **Escape en Windows:** En PowerShell, si una URL contiene `&`, usa `playwright-cli --% goto "https://url.com?a=1&b=2"` o entrecomillarla.
