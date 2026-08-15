import { Module } from '@nestjs/common';
import { CoreDatabaseModule } from './lib/database';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { CivicIntelModule } from './civic-intel/civic-intel.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OportunidadesModule } from './oportunidades/oportunidades.module';
import { VeeduriasModule } from './veedurias/veedurias.module';
import { StorageModule } from './storage/storage.module';
import { EstudiosMercadoModule } from './estudios-mercado/estudios-mercado.module';
import { CuipoModule } from './cuipo/cuipo.module';
import { SiriModule } from './siri/siri.module';
import { SigepModule } from './sigep/sigep.module';
import { TerritorioModule } from './territorio/territorio.module';
import { DivipolaModule } from './divipola/divipola.module';
import { FichaTerritorialModule } from './ficha-territorial/ficha-territorial.module';

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
    EstudiosMercadoModule,
    CuipoModule,
    SiriModule,
    SigepModule,
    TerritorioModule,
    DivipolaModule,
    FichaTerritorialModule,
  ],
})
export class AppModule {}
