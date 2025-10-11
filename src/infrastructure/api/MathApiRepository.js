// Implementação do MathRepository usando axios
import MathRepository from '../../domain/repositories/MathRepository';
import axios from 'axios';

// Use the conventional CRA env var name; fallback to localhost
const apiUrl = process.env.REACT_APP_MATH_API_URL || process.env.REACT_APP_API_MATH_URL || 'http://localhost:8080';

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
    const res = await axios.post(url, params.data, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) {
      throw new Error((res && res.data && res.data.error) || `Erro ao chamar ${url}`);
    }
    // backend returns { tipo, resultado }
    return res.data.resultado ?? res.data;
  }
  async calcularEstatistica(params) {
    const url = `${apiUrl}/estatistica/${params.tipo}`;
    const res = await axios.post(url, params.data, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) {
      throw new Error((res && res.data && res.data.error) || `Erro ao chamar ${url}`);
    }
    return res.data.resultado ?? res.data;
  }

  async calcularAnaliseComb(params) {
    const url = `${apiUrl}/analise/${params.tipo}`;
    const res = await axios.post(url, params.data, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) {
      throw new Error((res && res.data && res.data.error) || `Erro ao chamar ${url}`);
    }
    return res.data.resultado ?? res.data;
  }
}
