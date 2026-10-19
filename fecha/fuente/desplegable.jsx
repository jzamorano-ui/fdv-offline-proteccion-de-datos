// Desplegables de «Región» y «Ciudad»: Menu de MUI con el «Dropdown simple» de AquaDS tal cual
// (Components - AquaDS / master, 4698:410). El campo es un botón con el aspecto del select de Figma;
// el <select> oculto sigue guardando el valor, y app.js lo lee y le cambia opciones y estado como antes.
import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const ALTO_OPCION = 56, ALTO_LISTA = 308; // los de .dd en styles.css: 5 opciones y media, para que se note que hay más

export function Desplegable({ id }) {
  const select = React.useMemo(() => document.getElementById(id), [id]);
  const boton = React.useMemo(() => document.getElementById(`${id}-btn`), [id]);
  const [abierto, setAbierto] = React.useState(false);
  const [opciones, setOpciones] = React.useState([]);

  // El botón refleja el <select>: opción elegida (o placeholder), «filled» y deshabilitado
  React.useEffect(() => {
    const reflejar = () => {
      boton.textContent = select.selectedOptions[0]?.textContent ?? '';
      boton.classList.toggle('filled', !!select.value);
      boton.disabled = select.disabled;
    };
    reflejar();
    const obs = new MutationObserver(reflejar);
    obs.observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });
    select.addEventListener('change', reflejar);
    return () => { obs.disconnect(); select.removeEventListener('change', reflejar); };
  }, [select, boton]);

  // Abre con clic, Enter o Espacio (clic del botón) y con las flechas, como un select
  React.useEffect(() => {
    const abrir = () => {
      if (select.disabled) return;
      boton.focus({ preventScroll: true }); // Safari no enfoca botones al clic: MUI devuelve el foco aquí al cerrar
      const lista = [...select.options].filter(o => o.value).map(o => ({ valor: o.value, texto: o.textContent }));
      // Si la lista no cabe bajo el campo, MUI la sube encima de él: antes de abrir, la página baja lo justo
      // (sin pasar la etiqueta bajo la cabecera fija). Sin animación, porque MUI ubica la lista al abrir.
      const falta = boton.getBoundingClientRect().bottom + 2 + Math.min(lista.length * ALTO_OPCION, ALTO_LISTA) + 16 - window.innerHeight;
      const tope = document.getElementById(`${id}-lbl`).getBoundingClientRect().top - document.querySelector('.topbar').getBoundingClientRect().bottom - 8;
      if (falta > 0 && tope > 0) window.scrollBy({ top: Math.min(falta, tope), behavior: 'instant' });
      setOpciones(lista);
      setAbierto(true);
    };
    const tecla = e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(); } };
    boton.addEventListener('click', abrir);
    boton.addEventListener('keydown', tecla);
    return () => { boton.removeEventListener('click', abrir); boton.removeEventListener('keydown', tecla); };
  }, [select, boton, id]);

  React.useEffect(() => {
    boton.setAttribute('aria-expanded', abierto);
    if (abierto) boton.setAttribute('aria-controls', `${id}-lista`); else boton.removeAttribute('aria-controls');
  }, [abierto, boton, id]);

  // Elegir escribe en el <select> y avisa con los mismos eventos que el nativo; Escape y clic afuera no cambian nada
  const elegir = valor => {
    select.value = valor;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    setAbierto(false);
  };

  return (
    <Menu
      open={abierto}
      anchorEl={boton}
      onClose={() => setAbierto(false)}
      variant="selectedMenu"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      className="dd-capa"
      slotProps={{
        paper: { className: 'dd-paper', style: { width: boton.offsetWidth } },
        list: { className: 'dd', id: `${id}-lista`, role: 'listbox', 'aria-labelledby': `${id}-lbl` },
      }}
    >
      {opciones.map(o => {
        const elegida = o.valor === select.value;
        return (
          <MenuItem key={o.valor} role="option" selected={elegida} aria-selected={elegida} disableRipple onClick={() => elegir(o.valor)}>
            {o.texto}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
