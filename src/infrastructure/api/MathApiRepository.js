// Implementação do MathRepository usando axios
import MathRepository from '../../domain/repositories/MathRepository';
import apiClient from './apiClient';


const apiUrl = process.env.REACT_APP_API_MATH_URL
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
    if (!res || res.status >= 400) {
      throw new Error((res && res.data && res.data.error) || `Erro ao chamar ${url}`);
    }
    // Normalize possible backend response shapes into a simple value or array
    const data = res.data;
    if (data == null) return data;
    // Common normalized fields used across implementations: resultado, result, value, raizes, raiz
    if (typeof data === 'number' || typeof data === 'string' || Array.isArray(data)) return data;
    if (data.resultado !== undefined) {
      const r = data.resultado;
      if (r == null) return r;
      if (typeof r === 'number' || typeof r === 'string' || Array.isArray(r)) return r;
      if (r.value !== undefined) return r.value;
      if (r.result !== undefined) return r.result;
      if (r.raizes !== undefined) return r.raizes;
      if (r.raiz !== undefined) return r.raiz;
      return r; // object fallback
    }
    if (data.result !== undefined) return data.result;
    if (data.value !== undefined) return data.value;
    if (data.raizes !== undefined) return data.raizes;
    if (data.raiz !== undefined) return data.raiz;
    // fallback to returning whole payload
    return data;
  }
  async calcularEstatistica(params) {
    const url = `${apiUrl}/estatistica/${params.tipo}`;
    // backend expects { valores: [...] } whereas front passes { numeros: [...] }
    const payload = params.data && params.data.numeros ? { valores: params.data.numeros } : params.data;
  const res = await apiClient.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) {
      throw new Error((res && res.data && res.data.error) || `Erro ao chamar ${url}`);
    }
    return res.data.resultado ?? res.data;
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
    if (!res || res.status >= 400) {
      throw new Error((res && res.data && res.data.error) || `Erro ao chamar ${url}`);
    }
    return res.data.resultado ?? res.data;
  }
}
