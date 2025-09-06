// Caso de uso LoginUser
export default class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, senha }) {
    return await this.userRepository.login({ email, senha });
  }
}
