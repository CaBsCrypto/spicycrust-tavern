// TODO: Replace with actual PizzaDAO mascot file

/**
 * PizzaCharacter — Molto Bene mascot overlay for SpicyCrust (HUB)
 * Vanilla JS helper that injects the mascot container into the DOM.
 * Call mountPizzaCharacter() once after the DOM is ready.
 */
export function mountPizzaCharacter(targetElement = document.body) {
  const container = document.createElement('div');
  container.className = 'pizza-character';

  const img = document.createElement('img');
  img.src = '/pizza-character.png';
  img.alt = 'Molto Bene - PizzaDAO mascot';

  container.appendChild(img);
  targetElement.appendChild(container);

  return container;
}
