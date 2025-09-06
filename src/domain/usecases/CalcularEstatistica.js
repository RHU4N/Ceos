// Caso de uso para cálculo estatístico
export default class CalcularEstatistica {
  constructor(mathRepository) {
    this.mathRepository = mathRepository;
  }
  async execute(params) {
    return await this.mathRepository.calcularEstatistica(params);
  }
}
