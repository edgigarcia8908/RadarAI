import { Module } from '@nestjs/common';
import { CoreDatabaseModule } from './lib/database';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { CivicIntelModule } from './civic-intel/civic-intel.module';
import { ChatModule } from './chat/chat.module';
// TODO(equipo): src/situacion/ se registró acá pero el archivo nunca se pusheó
// (MODULE_NOT_FOUND) y nada en el frontend lo llama todavía — queda comentado
// hasta que @Deibyth suba backend/src/situacion/. ChatModule (Anna María) sí
// se implementó de nuevo — ver chat.service.ts.
// import { SituacionModule } from './situacion/situacion.module';
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
    ChatModule,
    // SituacionModule, // ver TODO arriba
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
