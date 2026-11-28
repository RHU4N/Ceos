import axios from "axios";
import { getApiError } from "./mathApiResponse";

/**
 * O axios rejeita respostas 4xx/5xx antes que as páginas leiam o corpo; sem esta conversão a tela mostrava
 * "Request failed with status code 400" no lugar da mensagem da MathAPI (ex.: "O intervalo de tempo deve ser
 * diferente de zero."). A resposta original continua disponível em `error.response`.
 */
export function toMathApiError(error) {
  if (!error?.response) return error;
  const friendly = new Error(getApiError(error.response, error.message));
  friendly.response = error.response;
  friendly.status = error.response.status;
  return friendly;
}

// A MathAPI é pública e não participa da sessão JWT da LoginAPI.
// Não enviar cookies evita o bloqueio CORS quando ela responde com origem '*'.
const mathApiClient = axios.create({ withCredentials: false });
mathApiClient.interceptors.response.use((response) => response, (error) => Promise.reject(toMathApiError(error)));

export default mathApiClient;
