import { test } from 'node:test';
import assert from 'node:assert/strict';
import { departamentoCanonico, DEPARTAMENTOS_COLOMBIA } from './departamentos';

test('departamentoCanonico: variantes de tildes y mayúsculas matchean el canónico', () => {
  assert.equal(departamentoCanonico('cundinamarca'), 'Cundinamarca');
  assert.equal(departamentoCanonico('CUNDINAMARCA'), 'Cundinamarca');
  assert.equal(departamentoCanonico('Cundinamarca'), 'Cundinamarca');
});

test('departamentoCanonico: departamento válido con tilde', () => {
  assert.equal(departamentoCanonico('Atlántico'), 'Atlántico');
  assert.equal(departamentoCanonico('Atlantico'), 'Atlántico');
  assert.equal(departamentoCanonico('ATLÁNTICO'), 'Atlántico');
});

test('departamentoCanonico: compuestos y especiales', () => {
  assert.equal(departamentoCanonico('Valle del Cauca'), 'Valle del Cauca');
  assert.equal(departamentoCanonico('valle del cauca'), 'Valle del Cauca');
  assert.equal(departamentoCanonico('Norte de Santander'), 'Norte de Santander');
  assert.equal(departamentoCanonico('San Andrés, Providencia y Santa Catalina'), 'San Andrés, Providencia y Santa Catalina');
  assert.equal(departamentoCanonico('Bogotá D.C.'), 'Bogotá D.C.');
  assert.equal(departamentoCanonico('bogota d.c.'), 'Bogotá D.C.');
});

test('departamentoCanonico: inválido devuelve null', () => {
  assert.equal(departamentoCanonico('Mars'), null);
  assert.equal(departamentoCanonico(''), null);
  assert.equal(departamentoCanonico('Narnia'), null);
  assert.equal(departamentoCanonico('Cundinamarca Norte'), null);
});

test('DEPARTAMENTOS_COLOMBIA: 32 departamentos + Bogotá D.C., todos canónicos y sin duplicados', () => {
  assert.equal(DEPARTAMENTOS_COLOMBIA.length, 33);
  assert.equal(new Set(DEPARTAMENTOS_COLOMBIA).size, DEPARTAMENTOS_COLOMBIA.length);
  for (const d of DEPARTAMENTOS_COLOMBIA) {
    assert.equal(departamentoCanonico(d), d, `${d} debe normalizarse a sí mismo`);
  }
});