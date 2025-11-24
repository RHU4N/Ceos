// Caso de uso para cálculo de cinética (Física)
export default class CalcularCinetica {
  constructor(physicsRepository) {
    this.physicsRepository = physicsRepository;
  }
  async execute(params) {
    return await this.physicsRepository.calcularCinetica(params);
  }
}
