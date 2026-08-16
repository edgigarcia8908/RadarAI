import { Body, Controller, Inject, Post } from '@nestjs/common';
import { IngestionService, FiltroTerritorio } from './ingestion.service';
import { RefreshCronService } from './refresh-cron.service';

/**
 * Disparo manual de la ingesta, pensado para la demo. El refresco
 * periódico real corre solo en `RefreshCronService` (cada 48h, ver ese
 * archivo) — `refresh-manual` acá abajo es SOLO para poder probarlo sin
 * esperar 48h, no reemplaza el job automático.
 */
@Controller('ingestion')
export class IngestionController {
  // @Inject() explícito a propósito: tsx/esbuild no siempre emite
  // design:paramtypes confiable para inyección implícita por tipo — mismo
  // patrón que ceo-ecosistema (ver organizaciones.controller.ts).
  constructor(
    @Inject(IngestionService) private readonly service: IngestionService,
    @Inject(RefreshCronService) private readonly refreshCron: RefreshCronService,
  ) {}

  @Post('sync')
  sync(@Body() body: FiltroTerritorio) {
    return this.service.sincronizarTodo(body);
  }

  /** Dispara el mismo refresco por lotes que corre solo cada 48h — para probarlo sin esperar. No bloquea la respuesta: corre en segundo plano y se ve el resultado en los logs. */
  @Post('refresh-manual')
  refrescarManual() {
    void this.refreshCron.refrescarTodo();
    return { mensaje: 'Refresco por lotes disparado en segundo plano — revisa los logs del backend.' };
  }
}
