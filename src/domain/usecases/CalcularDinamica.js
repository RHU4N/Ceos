// Caso de uso para cálculo de dinâmica (Física)
export default class CalcularDinamica {
  constructor(physicsRepository) {
    this.physicsRepository = physicsRepository;
  }
  async execute(params) {
    return await this.physicsRepository.calcularDinamica(params);
  }
}
