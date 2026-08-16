import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { DEPARTAMENTOS_COLOMBIA, departamentoCanonico } from '../departamentos';

/**
 * Cuerpo de la consulta de "situación actual" del territorio (fase M2 usará
 * este DTO en el controller). El transform + whitelist protege contra dos
 * problemas reales de SECOP: (1) el ciudadano escribe el departamento con
 * tildes/mayúsculas de forma inconsistente, así que `departamentoCanonico`
 * normaliza cualquier variante al nombre canónico antes de validar; (2) si el
 * valor no matchea ningún departamento del whitelist, `?? value` deja el
 * original para que `@IsIn` falle con mensaje claro — nunca se permite un
 * territorio fuera del whitelist (evita inyección de valores arbitrarios).
 */
export class PreguntaActualidadDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  pregunta: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(({ value }) => departamentoCanonico(value) ?? value)
  @IsIn(DEPARTAMENTOS_COLOMBIA)
  departamento_afectado: string;
}