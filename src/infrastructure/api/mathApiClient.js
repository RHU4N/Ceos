import axios from "axios";

// A MathAPI é pública e não participa da sessão JWT da LoginAPI.
// Não enviar cookies evita o bloqueio CORS quando ela responde com origem '*'.
const mathApiClient = axios.create({ withCredentials: false });

export default mathApiClient;
