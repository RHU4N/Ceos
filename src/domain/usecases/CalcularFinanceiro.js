export default class CalcularFinanceiro {
  constructor(mathRepository) {
    this.mathRepository = mathRepository;
  }

  async execute(params) {
    return await this.mathRepository.calcularFinanceiro(params);
  }
}
