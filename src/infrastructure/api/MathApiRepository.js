// Implementação do MathRepository usando axios
import MathRepository from '../../domain/repositories/MathRepository';
import axios from 'axios';

export default class MathApiRepository extends MathRepository {
  async calcularFuncao(params) {
    const apiUrl = process.env.REACT_APP_API_MATH_URL;
    let url = `${apiUrl}/funcao/${params.tipo}`;
    const res = await axios.post(url, params.data);
    return res.data.resultado;
  }
  async calcularEstatistica(params) {
    const apiUrl = process.env.REACT_APP_API_MATH_URL;
    let url = `${apiUrl}/estatistica/${params.tipo}`;
    const res = await axios.post(url, params.data);
    return res.data.resultado;
  }
  async calcularAnaliseComb(params) {
    const apiUrl = process.env.REACT_APP_API_MATH_URL;
    let url = `${apiUrl}/analise/${params.tipo}`;
    const res = await axios.post(url, params.data);
    return res.data.resultado;
  }
}
