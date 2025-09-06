// Entidade User para Clean Architecture
export default class User {
  constructor({ nome, email, telefone, senha, assinante = false, historico = [] }) {
    this.nome = nome;
    this.email = email;
    this.telefone = telefone;
    this.senha = senha;
    this.assinante = assinante;
    this.historico = historico;
  }
}
