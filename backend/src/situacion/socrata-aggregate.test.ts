import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAggregateUrl } from '../ingestion/socrata.client';

test('buildAggregateUrl: $select y $group se unen por comas', () => {
  const url = new URL(
    buildAggregateUrl('p6dx-8zbt', {
      select: ['ciudad_entidad', 'estado_del_procedimiento', 'count(*) as total_procesos'],
      group: ['ciudad_entidad', 'estado_del_procedimiento'],
    }),
  );
  assert.equal(url.searchParams.get('$select'), 'ciudad_entidad,estado_del_procedimiento,count(*) as total_procesos');
  assert.equal(url.searchParams.get('$group'), 'ciudad_entidad,estado_del_procedimiento');
});

test('buildAggregateUrl: $where se une con AND y respeta el escapado del llamador', () => {
  const whereEscapado = "upper(ciudad_entidad)='O''Higgins'";
  const url = new URL(
    buildAggregateUrl('p6dx-8zbt', {
      select: ['ciudad_entidad', 'count(*) as total'],
      where: [whereEscapado, "estado_del_procedimiento NOT IN ('Cancelado','Suspendido')"],
    }),
  );
  // URLSearchParams devuelve el valor decodificado: la comilla escapada debe
  // llegar intacta, buildAggregateUrl NO altera literales ya armados.
  assert.equal(url.searchParams.get('$where'), `${whereEscapado} AND estado_del_procedimiento NOT IN ('Cancelado','Suspendido')`);
});

test('buildAggregateUrl: $order y $limit', () => {
  const url = new URL(
    buildAggregateUrl('p6dx-8zbt', {
      select: ['ciudad_entidad', 'sum(precio_base) as presupuesto'],
      order: 'presupuesto DESC',
      limit: 25,
    }),
  );
  assert.equal(url.searchParams.get('$order'), 'presupuesto DESC');
  assert.equal(url.searchParams.get('$limit'), '25');
});

test('buildAggregateUrl: limit default 200 y sin group/order/where', () => {
  const url = new URL(buildAggregateUrl('p6dx-8zbt', { select: ['departamento_entidad', 'count(*) as total'] }));
  assert.equal(url.searchParams.get('$select'), 'departamento_entidad,count(*) as total');
  assert.equal(url.searchParams.get('$limit'), '200');
  assert.equal(url.searchParams.get('$group'), null);
  assert.equal(url.searchParams.get('$where'), null);
  assert.equal(url.searchParams.get('$order'), null);
  assert.equal(url.searchParams.get('$offset'), null);
});