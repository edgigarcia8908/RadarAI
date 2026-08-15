import { Body, Controller, Post } from '@nestjs/common';
import { IngestionService, FiltroTerritorio } from './ingestion.service';

/**
 * Disparo manual de la ingesta, pensado para la demo (Fase 1: sin cron todavía).
 * En producción esto se vuelve un job programado (BullMQ, mismo patrón que
 * ceo-notifications-service) por territorio "vigilado".
 */
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly service: IngestionService) {}

  @Post('sync')
  sync(@Body() body: FiltroTerritorio) {
    return this.service.sincronizarTodo(body);
  }
}
