// Implementação do MathRepository usando axios
import MathRepository from '../../domain/repositories/MathRepository';
import apiClient from './mathApiClient';
import { unwrapMathResult } from './mathApiResponse';


const apiUrl = process.env.REACT_APP_MATH_API_URL || process.env.REACT_APP_API_MATH_URL;
// const apiUrl = 'http://localhost:8080'

function mapFuncaoTipo(frontTipo) {
  // frontend used 'funcao1' and 'funcao2' — map to router 'linear' and 'quadratica'
  if (!frontTipo) return '';
  const t = String(frontTipo).toLowerCase();
  if (t === 'funcao1') return 'linear';
  if (t === 'funcao2') return 'quadratica';
  return t; // assume backend-compatible
}

export default class MathApiRepository extends MathRepository {
  async calcularFuncao(params) {
    const tipo = mapFuncaoTipo(params.tipo);
    const url = `${apiUrl}/funcao/${tipo}`;
  const res = await apiClient.post(url, params.data, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathResult(res, `Erro ao chamar ${url}`);
  }
  async calcularEstatistica(params) {
    const url = `${apiUrl}/estatistica/${params.tipo}`;
    // backend expects { valores: [...] } whereas front passes { numeros: [...] }
    const payload = params.data && params.data.numeros ? { valores: params.data.numeros } : params.data;
  const res = await apiClient.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathResult(res, `Erro ao chamar ${url}`);
  }

  async calcularAnaliseComb(params) {
    // map frontend types to backend supported types
    const mapAnaliseTipo = (t) => {
      if (!t) return '';
      const lower = String(t).toLowerCase();
        if (lower === 'permutacao') return 'fatorial';
      if (lower === 'combinacao') return 'combinacao';
        if (lower === 'arranjo') return 'arranjo';
        if (lower === 'arranjorep' || lower === 'arranjorep') return 'arranjorep';
      return lower;
    };

    const tipo = mapAnaliseTipo(params.tipo);
    const url = `${apiUrl}/analise/${tipo}`;
  const res = await apiClient.post(url, params.data, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathResult(res, `Erro ao chamar ${url}`);
  }
  async calcularFinanceiro(params) {
    if (!params || !params.tipo) throw new Error('Tipo de operação financeira é obrigatório');
    // map frontend friendly types to backend routes
    const tipo = String(params.tipo).toLowerCase();
    let route;
    if (tipo === 'variacao' || tipo === 'variacao-percentual') {
      route = tipo; // /financeiro/variacao or /financeiro/variacao-percentual
    } else if (tipo === 'juros-simples') {
      route = 'juros/simples';
    } else if (tipo === 'juros-compostos') {
      route = 'juros/compostos';
    } else {
      // accept a direct route string as fallback
      route = tipo;
    }

    const url = `${apiUrl}/financeiro/${route}`;
    const res = await apiClient.post(url, params.data, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathResult(res, `Erro ao chamar ${url}`);
  }
}
