import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirRadiografia } from './situacion.service';

/** Fila típica de la agregación SoQL de SECOP II (los valores llegan como string). */
function fila(ciudad: string, estado: string, total: number, presupuesto: number): Record<string, any> {
  return {
    ciudad_entidad: ciudad,
    estado_del_procedimiento: estado,
    total_procesos: String(total),
    presupuesto: String(presupuesto),
  };
}

test('foco de ejecución: ciudad con proceso activo y presupuesto aparece en focosEjecucion', () => {
  const r = construirRadiografia([fila('Medellín', 'En Ejecución', 4, 1500)]);
  assert.equal(r.focosEjecucion.length, 1);
  assert.deepEqual(r.focosEjecucion[0], { ciudad: 'Medellín', procesosActivos: 4, presupuesto: 1500 });
  assert.equal(r.estancados.length, 0);
  assert.equal(r.riesgo.length, 0);
});

test('estancado: ciudad con borrador y sin ejecución aparece en estancados', () => {
  const r = construirRadiografia([fila('Manizales', 'Borrador', 2, 800)]);
  assert.equal(r.estancados.length, 1);
  assert.deepEqual(r.estancados[0], { ciudad: 'Manizales', procesosPlaneacion: 2, presupuesto: 800 });
  assert.equal(r.focosEjecucion.length, 0);
  assert.equal(r.riesgo.length, 0);
});

test('riesgo: ciudad solo con procesos cancelados aparece en riesgo', () => {
  const r = construirRadiografia([fila('Apartadó', 'Cancelado', 3, 0)]);
  assert.equal(r.riesgo.length, 1);
  assert.deepEqual(r.riesgo[0], { ciudad: 'Apartadó', procesosParados: 3 });
  assert.equal(r.focosEjecucion.length, 0);
  assert.equal(r.estancados.length, 0);
});

test('estado no clasificado cae a planeación (conservador)', () => {
  const r = construirRadiografia([fila('Pereira', 'En Trámite', 5, 100)]);
  assert.equal(r.estancados.length, 1);
  assert.deepEqual(r.estancados[0], { ciudad: 'Pereira', procesosPlaneacion: 5, presupuesto: 100 });
  assert.equal(r.focosEjecucion.length, 0);
});

test('variante con tilde/mayúsculas: "En Ejecución" se clasifica ACTIVO', () => {
  const r = construirRadiografia([fila('Bogotá D.C.', 'En Ejecución', 10, 5000)]);
  assert.equal(r.focosEjecucion.length, 1);
  assert.equal(r.focosEjecucion[0].procesosActivos, 10);
  assert.equal(r.focosEjecucion[0].presupuesto, 5000);
});

test('totales: suman bien con múltiples filas y municipios', () => {
  const r = construirRadiografia([
    fila('Bogotá D.C.', 'En Ejecución', 3, 1000),
    fila('Bogotá D.C.', 'Adjudicado', 2, 500),
    fila('Medellín', 'Borrador', 4, 300),
  ]);
  assert.equal(r.totalProcesos, 9);
  assert.equal(r.presupuestoTotal, 1800);
  assert.equal(r.municipios.length, 2);

  const bogota = r.municipios.find((m) => m.ciudad === 'Bogotá D.C.')!;
  assert.equal(bogota.totalProcesos, 5);
  assert.equal(bogota.presupuesto, 1500);
  assert.equal(bogota.porEstado.length, 2);
});

test('ordenamiento: focosEjecucion ordenados por presupuesto DESC', () => {
  const r = construirRadiografia([
    fila('Ciudad A', 'En Ejecución', 1, 100),
    fila('Ciudad B', 'Adjudicado', 1, 5000),
    fila('Ciudad C', 'Celebrado', 1, 2000),
  ]);
  assert.deepEqual(
    r.focosEjecucion.map((f) => f.ciudad),
    ['Ciudad B', 'Ciudad C', 'Ciudad A'],
  );
});