import React from 'react';
import { motion } from "framer-motion"
import './Style.css';
import { speak } from '../../hooks/useTTS';

const Sobre = () => (
  <motion.section
    id="sobre-nos"
    className='about'
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    viewport={{ once: true, amount: 0.2 }}
    tabIndex={0}
    onMouseEnter={() => speak('Sobre nós. Conheça a equipe e a missão do Céos')}
    onFocus={() => speak('Sobre nós. Conheça a equipe e a missão do Céos')}
  >
    <h1 onMouseEnter={() => speak('Sobre Nós')} onFocus={() => speak('Sobre Nós')}>Sobre Nós</h1>
    <p onMouseEnter={() => speak('Somos um grupo de estudantes apaixonados por ciência e educação')} onFocus={() => speak('Somos um grupo de estudantes apaixonados por ciência e educação')}>
      Somos um grupo de estudantes apaixonados por ciência, tecnologia e educação, unidos pelo objetivo de facilitar o acesso ao conhecimento. No Céos, acreditamos que aprender deve ser uma experiência acessível, clara e prática para todos. Nossa missão é ajudar estudantes, professores e entusiastas das áreas de Física, Química e Matemática a encontrar e aplicar fórmulas e cálculos de maneira rápida, eficiente e descomplicada.
    </p>
    <p onMouseEnter={() => speak('Plataforma com ferramentas interativas para tornar o aprendizado mais dinâmico')} onFocus={() => speak('Plataforma com ferramentas interativas para tornar o aprendizado mais dinâmico')}>
      Desenvolvemos esta plataforma intuitiva, repleta de ferramentas interativas e conteúdos organizados, para tornar o aprendizado mais dinâmico e envolvente. Aqui, você pode resolver exercícios, revisar conceitos, aprofundar seus estudos e compartilhar experiências com outros usuários. Nosso compromisso é oferecer um ambiente confiável, atualizado e colaborativo, onde todos possam crescer juntos e alcançar seus objetivos acadêmicos.
    </p>
    <p onMouseEnter={() => speak('Explore, aprenda e simplifique seus cálculos conosco')} onFocus={() => speak('Explore, aprenda e simplifique seus cálculos conosco')}>
      Explore, aprenda e simplifique seus cálculos conosco! Estamos sempre em busca de melhorias e novas funcionalidades, porque acreditamos que juntos podemos transformar a educação em algo ainda mais acessível e inspirador.
    </p>
  </motion.section>
);

export default Sobre;
