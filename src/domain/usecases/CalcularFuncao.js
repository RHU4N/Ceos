// Caso de uso para cálculo de função matemática
export default class CalcularFuncao {
  constructor(mathRepository) {
    this.mathRepository = mathRepository;
  }
  async execute(params) {
    return await this.mathRepository.calcularFuncao(params);
  }
}
