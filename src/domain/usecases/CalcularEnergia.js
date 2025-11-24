// Caso de uso para cálculo de energia (Física)
export default class CalcularEnergia {
  constructor(physicsRepository) {
    this.physicsRepository = physicsRepository;
  }
  async execute(params) {
    return await this.physicsRepository.calcularEnergia(params);
  }
}
