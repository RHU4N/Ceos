// Caso de uso para análise combinatória
export default class CalcularAnaliseComb {
  constructor(mathRepository) {
    this.mathRepository = mathRepository;
  }
  async execute(params) {
    return await this.mathRepository.calcularAnaliseComb(params);
  }
}
