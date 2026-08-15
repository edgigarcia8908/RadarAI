// Módulo de solo efecto lateral, importado primero en main.ts a propósito:
// los `import` se hoistean por encima de statements sueltos en la
// compilación CommonJS de TS, así que si `loadDotenv()` fuera una llamada
// suelta en main.ts, se ejecutaría DESPUÉS del `import { AppModule }`
// (que ya lee process.env.MONGO_URI al construir CoreDatabaseModule.forRoot
// en el momento de evaluar el módulo) — rompiendo la conexión a Mongo.
// override: true porque herramientas de preview (Vite/Claude Code) inyectan
// un PORT pensado para el frontend; sin override el backend lo heredaría en
// vez de usar el 4500 real de backend/.env.
import { config } from 'dotenv';
config({ override: true });
