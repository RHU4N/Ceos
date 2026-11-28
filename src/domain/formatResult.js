// Converte o resultado da MathAPI em texto legível para pessoas (tela, leitura em voz e histórico).
// Nunca exibe JSON cru. Arquivo idêntico em Ceos (Web) e CeosApp (Mobile).
const LABELS = {
  value: 'Resultado', result: 'Resultado', resultado: 'Resultado', valor: 'Valor',
  raizes: 'Raízes', raiz: 'Raiz', raiz1: 'Raiz 1', raiz2: 'Raiz 2', x1: 'x₁', x2: 'x₂',
  delta: 'Δ', x: 'x', y: 'y', fx: 'f(x)',
  velocidadeX: 'Velocidade horizontal', velocidadeY: 'Velocidade vertical',
  media: 'Média', mediana: 'Mediana', moda: 'Moda', desvioPadrao: 'Desvio padrão', variancia: 'Variância',
};
const SINGLE = ['value', 'result', 'resultado', 'valor'];

const formatNumber = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 }).format(value)
    : value > 0 ? 'infinito' : value < 0 ? '−infinito' : 'indefinido';

function label(key) {
  if (LABELS[key]) return LABELS[key];
  const words = String(key).replace(/_/g, ' ').replace(/([a-zà-ú])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatResult(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    if (!value.length) return 'nenhum valor';
    if (value.every(Array.isArray)) return value.map((row) => `[ ${row.map(formatResult).join('   ')} ]`).join('\n');
    return value.map(formatResult).join('; ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '—';
    if (entries.length === 1 && SINGLE.includes(entries[0][0])) return formatResult(entries[0][1]);
    return entries
      .map(([key, item]) =>
        key === 'raizes' && Array.isArray(item) && !item.length
          ? 'Raízes: nenhuma raiz real'
          : `${label(key)}: ${formatResult(item)}`)
      .join('\n');
  }
  return String(value);
}
