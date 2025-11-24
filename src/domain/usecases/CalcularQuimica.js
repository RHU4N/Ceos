// Caso de uso para cálculos de Química
export default class CalcularQuimica {
  constructor(chemistryRepository) {
    this.chemistryRepository = chemistryRepository;
  }
  async execute(params) {
    return await this.chemistryRepository.calcular(params);
  }
}
