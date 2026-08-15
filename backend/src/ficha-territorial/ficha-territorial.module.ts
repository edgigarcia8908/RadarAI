import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { DivipolaModule } from '../divipola/divipola.module';
import { TerritorioModule } from '../territorio/territorio.module';
import { CuipoModule } from '../cuipo/cuipo.module';
import { SiriModule } from '../siri/siri.module';
import { SigepModule } from '../sigep/sigep.module';
import { FichaTerritorialService } from './ficha-territorial.service';
import { FichaTerritorialController } from './ficha-territorial.controller';

@Module({
  imports: [IngestionModule, DivipolaModule, TerritorioModule, CuipoModule, SiriModule, SigepModule],
  controllers: [FichaTerritorialController],
  providers: [FichaTerritorialService],
})
export class FichaTerritorialModule {}
