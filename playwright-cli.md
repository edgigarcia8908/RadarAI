# Browser Automation Policy (Playwright CLI)

## 1. Tooling & Discovery
- Para tareas que requieran interacción web, navegación visual o pruebas E2E, usa `playwright-cli`.
- Consulta la documentación de la skill instalada o ejecuta `playwright-cli --help` para ver la sintaxis de los comandos.

## 2. Core Workflow & Rules
1. **Flujo por Snapshot:** Abre la página (`open` / `goto`), obtén el estado con `snapshot` y usa siempre las referencias devueltas (`[ref=e#]`) para hacer clic o escribir.
2. **Re-snapshot obligatorio:** Tras una acción que cambie el DOM o navegue, actualiza el estado antes de continuar.
3. **Ahorro de contexto:**
   - No vuelques capturas visuales pesadas al contexto a menos que sea estrictamente necesario.
   - Usa `--depth` en snapshots si la página es muy compleja.
4. **Persistencia:** Si una prueba requiere login, guarda y restaura el estado con `state-save auth.json` / `state-load auth.json`.