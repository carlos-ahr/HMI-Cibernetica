import interact from 'https://cdn.jsdelivr.net/npm/@interactjs/interactjs/index.js';

export function hacerBloqueMovible(bloque) {
  interact(bloque).draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: '#editor',
        endOnly: true
      })
    ],
    listeners: {
      move (event) {
        const target = event.target;
        const x = (parseFloat(target.dataset.x) || 0) + event.dx;
        const y = (parseFloat(target.dataset.y) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.dataset.x = x;
        target.dataset.y = y;
      }
    }
  });
}
