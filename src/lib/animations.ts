import { Transition, Variants } from 'framer-motion';

/**
 * # atualizado: Transição padrão para suavidade e consistência.
 * Duração de 0.35s com uma curva de easing suave.
 */
export const SMOOTH_TRANSITION: Transition = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1],
};

/**
 * # atualizado: Animação para páginas e seções de conteúdo principais.
 * Efeito de fade com um leve deslize para cima.
 */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};

/**
 * # atualizado: Animação para itens de lista e breadcrumbs.
 * Efeito de fade com um leve deslize para baixo.
 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

/**
 * # atualizado: Animação mais suave, apenas com fade, para a transição principal entre páginas.
 * Usada no Layout principal para evitar a sensação de "sacudir".
 */
export const mainPageFadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * # atualizado: Transição um pouco mais lenta para o fade principal entre páginas.
 */
export const MAIN_PAGE_TRANSITION: Transition = {
  duration: 0.4,
  ease: 'easeInOut',
};