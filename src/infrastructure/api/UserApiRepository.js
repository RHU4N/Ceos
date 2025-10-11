import UserRepository from '../../domain/repositories/UserRepository';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_LOGIN_URL;
// const apiURL = 'http://localhost:8081';

export default class UserApiRepository extends UserRepository {
	async forgotPassword(email) {
		await axios.post(`${apiUrl}/auth/forgot-password`, { email });
		return true;
	}

	async register(userData) {
		const response = await axios.post(`${apiUrl}/users`, {
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
		const res = await axios.post(`${apiUrl}/auth/login`, { email, senha });
		const { token } = res.data;
		const userRes = await axios.get(`${apiUrl}/users`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const userData = userRes.data.find(u => u.email === email);
		return { user: userData, token };
	}
}
