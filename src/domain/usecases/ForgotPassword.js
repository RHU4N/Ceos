// Caso de uso para recuperação de senha
export default class ForgotPassword {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  async execute(email) {
    return await this.userRepository.forgotPassword(email);
  }
}
