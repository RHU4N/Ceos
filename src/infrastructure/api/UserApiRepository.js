import UserRepository from '../../domain/repositories/UserRepository';
import apiClient from './apiClient';

const apiUrl = process.env.REACT_APP_API_LOGIN_URL;
// const apiUrl = 'http://localhost:8081';

export default class UserApiRepository extends UserRepository {
	async forgotPassword(email) {
		await apiClient.post(`${apiUrl}/auth/forgot-password`, { email });
		return true;
	}

	async register(userData) {
		const response = await apiClient.post(`${apiUrl}/users`, {
			nome: userData.nome,
			email: userData.email,
			senha: userData.senha,
			telefone: userData.telefone,
			assinante: false,
			historico: []
		});
		return response.data;
	}

	async login({ email, senha }) {
			const res = await apiClient.post(`${apiUrl}/auth/login`, { email, senha });
			const { token } = res.data;
			// store token temporarily so apiClient will include it for subsequent user fetch
			localStorage.setItem('ceos_token', token);
			const userRes = await apiClient.get(`${apiUrl}/users`);
		const userData = userRes.data.find(u => u.email === email);
		return { user: userData, token };
	}

	// Histórico endpoints
	async addHistorico({ tipo, valores, resultado }) {
		const res = await apiClient.post(`${apiUrl}/users/historico`, { tipo, valores, resultado });
		return res.data;
	}

	async getHistorico() {
		const res = await apiClient.get(`${apiUrl}/users/historico`);
		return res.data;
	}

	async clearHistorico() {
		const res = await apiClient.delete(`${apiUrl}/users/historico`);
		return res.data;
	}

	async deleteHistoricoItem(id) {
		const res = await apiClient.delete(`${apiUrl}/users/historico/${id}`);
		return res.data;
	}
}
