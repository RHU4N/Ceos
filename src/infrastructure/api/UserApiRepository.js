import UserRepository from '../../domain/repositories/UserRepository';
import apiClient from './apiClient';

const apiUrl = process.env.REACT_APP_API_LOGIN_URL;
// const apiUrl = 'http://localhost:8081';

export default class UserApiRepository extends UserRepository {
	async register(userData) {
		const response = await apiClient.post(`${apiUrl}/users`, {
			nome: userData.nome,
			email: userData.email,
			senha: userData.senha,
			confirmaSenha: userData.confirmarSenha,
			telefone: userData.telefone,
			assinante: false,
			historico: []
		});
		return response.data;
	}

	async login({ email, senha }) {
		const res = await apiClient.post(`${apiUrl}/auth/login`, { email, senha });
		return { user: res.data.data.user };
	}

	async updateProfile(id, { nome, telefone }) {
		const res = await apiClient.patch(`${apiUrl}/users/${id}`, { nome, telefone });
		return res.data.data;
	}

	async changePassword({ senhaAtual, novaSenha, confirmaNovaSenha }) {
		const res = await apiClient.post(`${apiUrl}/auth/change-password`, { senhaAtual, novaSenha, confirmaNovaSenha });
		return res.data;
	}

	async deleteAccount(id) {
		const res = await apiClient.delete(`${apiUrl}/users/${id}`);
		return res.data;
	}

	// Histórico endpoints
	async addHistorico({ tipo, valores, resultado }) {
		const res = await apiClient.post(`${apiUrl}/historicos`, { tipo, valores, resultado });
		return res.data.data || res.data;
	}

	async getHistorico() {
		const res = await apiClient.get(`${apiUrl}/historicos`);
		return res.data.data || [];
	}

	async clearHistorico() {
		const res = await apiClient.delete(`${apiUrl}/historicos?confirmed=true`);
		return res.data.data || res.data;
	}

	async deleteHistoricoItem(id) {
		const res = await apiClient.delete(`${apiUrl}/historicos/${id}`);
		return res.data.data || res.data;
	}
}
