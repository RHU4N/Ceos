// Caso de uso RegisterUser
export default class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userData) {
    if (userData.senha !== userData.confirmarSenha) {
      throw new Error('As senhas não coincidem.');
    }
    if (!userData.telefone) {
      throw new Error('O telefone é obrigatório.');
    }
    return await this.userRepository.register(userData);
  }
}
