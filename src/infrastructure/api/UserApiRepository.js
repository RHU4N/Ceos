import UserRepository from '../../domain/repositories/UserRepository';
import axios from 'axios';

export default class UserApiRepository extends UserRepository {
	async forgotPassword(email) {
		const apiUrl = process.env.REACT_APP_API_LOGIN_URL;
		await axios.post(`${apiUrl}/user/forgot-password`, { email });
		return true;
	}
	async register(userData) {
		const apiUrl = process.env.REACT_APP_API_LOGIN_URL;
		const response = await axios.post(`${apiUrl}/user`, {
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
		const apiUrl = process.env.REACT_APP_API_LOGIN_URL;
		const res = await axios.post(`${apiUrl}/user/login`, { email, senha });
		const { token } = res.data;
		const userRes = await axios.get(`${apiUrl}/user`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const userData = userRes.data.find(u => u.email === email);
		return { user: userData, token};
	}
}
