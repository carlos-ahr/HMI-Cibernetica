export function agregarBotonEliminar(bloque) {
  const boton = bloque.querySelector('.btn-eliminar-bloque');
  if (boton) {
    boton.addEventListener('click', () => {
      bloque.remove();
    });
  }
}
