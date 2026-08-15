import { Module } from '@nestjs/common';
import { CoreDatabaseModule } from './lib/database';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { CivicIntelModule } from './civic-intel/civic-intel.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OportunidadesModule } from './oportunidades/oportunidades.module';
import { VeeduriasModule } from './veedurias/veedurias.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    CoreDatabaseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    IngestionModule,
    CivicIntelModule,
    EmpresasModule,
    OportunidadesModule,
    VeeduriasModule,
    StorageModule,
  ],
})
export class AppModule {}
