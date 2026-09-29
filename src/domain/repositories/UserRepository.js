// Interface UserRepository
export default class UserRepository {
  async register(userData) {
    throw new Error('Not implemented');
  }
  async login(loginData) {
    throw new Error('Not implemented');
  }
  async updateProfile(id, data) {
    throw new Error('Not implemented');
  }
  async changePassword(data) {
    throw new Error('Not implemented');
  }
}
