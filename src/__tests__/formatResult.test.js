import { formatResult } from '../domain/formatResult';

test('resultados da API aparecem como texto legível, nunca JSON cru', () => {
  expect(formatResult({ raizes: [-167] })).toBe('Raízes: -167');
  expect(formatResult({ raizes: [] })).toBe('Raízes: nenhuma raiz real');
  expect(formatResult({ resultado: 2.5 })).toBe('2,5');
  expect(formatResult([[1, 2], [3, 4]])).toBe('[ 1   2 ]\n[ 3   4 ]');
  for (const sample of [{ raizes: [1, 2] }, { a: { b: [1] } }, { x: true }])
    expect(formatResult(sample)).not.toMatch(/[{}"]/);
});
