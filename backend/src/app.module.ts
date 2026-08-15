import { Module } from '@nestjs/common';
import { CoreDatabaseModule } from '@ceo-core/database';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { CivicIntelModule } from './civic-intel/civic-intel.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OportunidadesModule } from './oportunidades/oportunidades.module';
import { VeeduriasModule } from './veedurias/veedurias.module';

@Module({
  imports: [
    CoreDatabaseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    IngestionModule,
    IntelligenceModule,
    CivicIntelModule,
    EmpresasModule,
    OportunidadesModule,
    VeeduriasModule,
  ],
})
export class AppModule {}
