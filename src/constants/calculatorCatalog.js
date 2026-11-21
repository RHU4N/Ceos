export const AREAS = Object.freeze([
  { key: 'matematica', title: 'Matemática', route: '/matematica' },
  { key: 'fisica', title: 'Física', route: '/fisica' },
  { key: 'quimica', title: 'Química', route: '/quimica' },
]);

export const CALCULATORS = Object.freeze([
  {
    key: 'funcao',
    resourceId: 'calc:matematica:funcao',
    resourceType: 'calculation',
    area: 'matematica',
    areaTitle: 'Matemática',
    title: 'Função',
    detail: 'Cálculos e fórmulas de funções matemáticas (1º e 2º grau).',
    route: '/matematica/funcao',
    image: '/image.png',
  },
  {
    key: 'matrizes',
    resourceId: 'calc:matematica:matrizes',
    resourceType: 'calculation',
    area: 'matematica',
    areaTitle: 'Matemática',
    title: 'Matrizes',
    detail: 'Adição, subtração e multiplicação de matrizes.',
    route: '/matematica/matrizes',
    image: '/image.png',
  },
  {
    key: 'analise',
    resourceId: 'calc:matematica:analise',
    resourceType: 'calculation',
    area: 'matematica',
    areaTitle: 'Matemática',
    title: 'Análise Combinatória',
    detail: 'Permutação, combinação e arranjo.',
    route: '/matematica/analise-combinatoria',
    image: '/analisecombinatoria.png',
  },
  {
    key: 'estatistica',
    resourceId: 'calc:matematica:estatistica',
    resourceType: 'calculation',
    area: 'matematica',
    areaTitle: 'Matemática',
    title: 'Estatística',
    detail: 'Média, mediana e moda.',
    route: '/matematica/estatistica',
    image: '/estatistica.png',
  },
  {
    key: 'financeiro',
    resourceId: 'calc:matematica:financeiro',
    resourceType: 'calculation',
    area: 'matematica',
    areaTitle: 'Matemática',
    title: 'Matemática Financeira',
    detail: 'Variação, juros simples e compostos.',
    route: '/matematica/financeira',
    image: '/financeiro.png',
  },
  {
    key: 'cinetica',
    resourceId: 'calc:fisica:cinetica',
    resourceType: 'calculation',
    area: 'fisica',
    areaTitle: 'Física',
    subarea: 'Cinemática',
    title: 'Cinemática',
    detail: 'Velocidade, aceleração e movimento.',
    route: '/fisica/cinetica',
    image: '/cinetica.jpg',
  },
  {
    key: 'dinamica',
    resourceId: 'calc:fisica:dinamica',
    resourceType: 'calculation',
    area: 'fisica',
    areaTitle: 'Física',
    subarea: 'Dinâmica',
    title: 'Dinâmica',
    detail: 'Forças, leis de Newton e aplicações.',
    route: '/fisica/dinamica',
    image: '/dinamica.png',
  },
  {
    key: 'energia',
    resourceId: 'calc:fisica:energia',
    resourceType: 'calculation',
    area: 'fisica',
    areaTitle: 'Física',
    subarea: 'Energia',
    title: 'Energia',
    detail: 'Trabalho, energia cinética e potencial.',
    route: '/fisica/energia',
    image: '/energia.png',
  },
  {
    key: 'ponto-de-orvalho',
    resourceId: 'calc:fisica:termologia:ponto-de-orvalho',
    resourceType: 'calculation',
    area: 'fisica',
    areaTitle: 'Física',
    subarea: 'Termologia',
    title: 'Ponto de Orvalho',
    detail: 'Fórmula de Magnus com temperatura e umidade (Manual e IoT).',
    route: '/fisica/termologia/ponto-de-orvalho',
    image: '/energia.png',
  },
  {
    key: 'solucoes',
    resourceId: 'calc:quimica:solucoes',
    resourceType: 'calculation',
    area: 'quimica',
    areaTitle: 'Química',
    title: 'Soluções',
    detail: 'Molaridade, molalidade, densidade, fração molar e concentração comum.',
    route: '/solucoes',
    image: '/concentracao.png',
  },
  {
    key: 'estequiometria',
    resourceId: 'calc:quimica:estequiometria',
    resourceType: 'calculation',
    area: 'quimica',
    areaTitle: 'Química',
    title: 'Estequiometria',
    detail: 'Balanceamento racional, massa molar, conversões e reagente limitante.',
    route: '/quimica/estequiometria',
    image: '/estequiometria.png',
  },
  {
    key: 'termoquimica',
    resourceId: 'calc:quimica:termoquimica',
    resourceType: 'calculation',
    area: 'quimica',
    areaTitle: 'Química',
    title: 'Termoquímica',
    detail: 'Calor sensível, variação de temperatura, entalpia e processos.',
    route: '/quimica/termoquimica',
    image: '/termoquimica.png',
  },
]);

/**
 * Finds a canonical calculator descriptor by its `resourceId`.
 */
export function getCalculatorByResourceId(resourceId) {
  if (!resourceId) return null;
  return CALCULATORS.find((item) => item.resourceId === resourceId) || null;
}

/**
 * Resolves the web route for a calculator `resourceId`.
 */
export function getCalculatorRoute(resourceId) {
  return getCalculatorByResourceId(resourceId)?.route || null;
}

/**
 * Finds a canonical calculator descriptor by its `key`.
 */
export function getCalculatorByKey(key) {
  if (!key) return null;
  return CALCULATORS.find((item) => item.key === key) || null;
}
