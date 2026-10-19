// Calendario de «Fecha de nacimiento»: DatePicker de MUI X con el Date picker de AquaDS tal cual
// (Components - AquaDS / master, «Date picker - Calendar» 5696:4886). MUI pone solo el calendario: el campo
// sigue siendo el input de Figma (máscara, errores y presets de app.js). Se empaqueta con `npm run build`.
// La misma tarjeta con «Cancelar» y «Guardar»: en escritorio (≥ 900 px) como popover bajo el campo,
// en móvil centrada sobre un velo (diálogo de MUI).
// El mismo paquete monta los desplegables de Región y Ciudad (desplegable.jsx), para no cargar React dos veces.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { usePickerLayout } from '@mui/x-date-pickers/PickersLayout';
import { usePickerContext, usePickerActionsContext } from '@mui/x-date-pickers/hooks';
import { esES } from '@mui/x-date-pickers/locales';
import { Desplegable } from './desplegable.jsx';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const ETIQUETA = { day: 'Selecciona el día', month: 'Selecciona el mes', year: 'Selecciona el año' };
dayjs.locale('es');
const MIN = dayjs('1900-01-01');
// Meses con nombre completo, como en AquaDS («Enero», no «ene.»)
const FORMATOS = { monthShort: 'MMMM' };
const mayus = s => s.charAt(0).toUpperCase() + s.slice(1);

// Íconos Remix, como el resto del sprite
const Caret = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.84 3h8.32c.75 0 1.12.9.6 1.43L6.59 8.59a.83.83 0 0 1-1.18 0L1.25 4.43C.72 3.9 1.09 3 1.84 3Z" /></svg>;

// «Guardar» y «Confirmar» se habilitan recién cuando hay un día elegido, y son lo único que escribe en el campo
// MUI arrastra mes y día de la fecha de referencia: no se muestran elegidos hasta que la persona los elige
const Eleccion = React.createContext({ lista: false, mes: false, marcar: () => {}, confirmar: () => {} });

const input = () => document.getElementById('nacimiento');

// dd/mm/aaaa del campo → fecha, solo si es válida (desde 1900 y no futura)
function leerCampo() {
  const m = input().value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = dayjs(`${m[3]}-${m[2]}-${m[1]}`, 'YYYY-MM-DD');
  if (!d.isValid() || d.date() !== +m[1] || d.month() !== +m[2] - 1) return null;
  return d.isBefore(MIN) || d.isAfter(dayjs(), 'day') ? null : d;
}

// El campo de Figma hace de ancla: MUI no dibuja input propio
function CampoExterno() {
  const { triggerRef } = usePickerContext();
  React.useLayoutEffect(() => { triggerRef(input().closest('.input-icon')); }, [triggerRef]);
  return null;
}

// Cabecera: «Mes ▾» a la izquierda y «Año ▾» a la derecha; en mes y año, un solo botón que vuelve a los días
function Cabecera({ currentMonth, view, onViewChange }) {
  const { mes: mesElegido } = React.useContext(Eleccion);
  const mes = mayus(currentMonth.format('MMMM')), anio = currentMonth.format('YYYY');
  const mesAnio = view === 'year' || (view === 'month' && !mesElegido) ? anio : `${mes} ${anio}`;
  const boton = (texto, destino, abierto) => (
    <button type="button" className="fp-toggle" aria-expanded={abierto} onClick={() => onViewChange(destino)}>
      {texto}<Caret />
    </button>
  );
  return (
    <div className="fp-head">
      <div className="fp-toggles">
        {view === 'day' && <>{boton(mes, 'month', false)}{boton(anio, 'year', false)}</>}
        {view === 'month' && boton(mesAnio, 'day', true)}
        {view === 'year' && boton(anio, 'day', true)}
      </div>
      <p className="fp-label">{ETIQUETA[view]}</p>
    </div>
  );
}

// Día: registra que se eligió un día para habilitar la acción principal
const Dia = React.forwardRef(function Dia(props, ref) {
  const { lista, marcar } = React.useContext(Eleccion);
  const elegido = lista && props.selected;
  return <PickersDay {...props} ref={ref} selected={elegido} aria-selected={elegido} onDaySelect={d => { marcar(); props.onDaySelect(d); }} />;
});

// Estructura de la tarjeta: la vista de MUI dentro y nuestras acciones alrededor
function Estructura(props) {
  const { content } = usePickerLayout(props);
  const { view, value } = usePickerContext();
  const { acceptValueChanges, cancelValueChanges } = usePickerActionsContext();
  const { lista, mes, confirmar } = React.useContext(Eleccion);
  const listo = lista && value != null;
  const guardar = () => { confirmar(); acceptValueChanges(); };

  // Escritorio: el popover cuelga bajo el campo y los días (437 px) no caben en una ventana baja.
  // Al abrir y al cambiar de vista, la página baja lo justo para mostrar «Guardar», sin meter la tarjeta bajo la cabecera fija.
  const caja = React.useRef(null);
  React.useEffect(() => {
    const capa = caja.current.closest('.MuiPopper-root');
    if (!capa) return;
    // Entre vistas MUI funde la saliente con la entrante (225 ms) y la tarjeta crece un momento: se mide al asentarse
    let espera = 0;
    const ajustar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        // Destino absoluto en la página: si llegan dos avisos durante el desplazamiento suave, no se suman
        const arriba = capa.getBoundingClientRect().top + window.scrollY; // la capa no escala con la animación de entrada; el papel sí
        const techo = document.querySelector('.topbar').getBoundingClientRect().bottom + 8;
        const destino = Math.min(arriba + capa.offsetHeight + 16 - window.innerHeight, arriba - techo);
        if (destino > window.scrollY + 1) window.scrollTo({ top: destino, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }, 250);
    };
    const obs = new ResizeObserver(ajustar);
    obs.observe(caja.current);
    return () => { obs.disconnect(); clearTimeout(espera); };
  }, []);

  return (
    <div ref={caja} className={`fp fp-v-${view}${mes ? '' : ' fp-sin-mes'}`}>
      <div className="fp-card">{content}</div>
      <div className="fp-actions">
        <button type="button" className="fp-act" onClick={cancelValueChanges}>Cancelar</button>
        <button type="button" className="fp-act" disabled={!listo} onClick={guardar}>Guardar</button>
      </div>
    </div>
  );
}

function Calendario() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(null);
  const [view, setView] = React.useState('day');
  const [lista, setLista] = React.useState(false);
  const [mes, setMes] = React.useState(false);
  // MUI acepta el valor también al cerrar con Escape o clic afuera; solo cuenta si se confirmó con el botón
  const confirmado = React.useRef(false);
  // Elegir un día también elige su mes
  const eleccion = React.useMemo(() => ({ lista, mes, marcar: () => { setLista(true); setMes(true); }, confirmar: () => { confirmado.current = true; } }), [lista, mes]);

  // Abre siempre en los días, la variante por defecto del Datepicker de AquaDS (pedido del usuario):
  // en el mes de la fecha escrita si es válida y, si no, en el de la fecha de referencia.
  const abrir = React.useCallback(() => {
    const d = leerCampo();
    confirmado.current = false;
    setValue(d); setView('day'); setLista(!!d); setMes(!!d); setOpen(true);
  }, []);

  React.useEffect(() => {
    const btn = document.getElementById('cal-btn');
    const alternar = () => (open ? setOpen(false) : abrir());
    btn.addEventListener('click', alternar);
    return () => btn.removeEventListener('click', alternar);
  }, [open, abrir]);

  const escribir = d => {
    if (!d || !confirmado.current) return;
    confirmado.current = false;
    const el = input();
    el.value = d.format('DD/MM/YYYY');
    el.closest('.field').dataset.touched = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (
    <Eleccion.Provider value={eleccion}>
      <DatePicker
        value={value}
        onChange={setValue}
        onAccept={escribir}
        open={open}
        onOpen={abrir}
        onClose={() => setOpen(false)}
        views={['year', 'month', 'day']}
        view={view}
        onViewChange={v => { if (v === 'day') setMes(true); setView(v); }}
        openTo="day"
        referenceDate={dayjs().subtract(30, 'year')}
        minDate={MIN}
        maxDate={dayjs()}
        closeOnSelect={false}
        monthsPerRow={3}
        yearsPerRow={3}
        format="DD/MM/YYYY"
        dayOfWeekFormatter={d => DIAS[d.day()]}
        desktopModeMediaQuery="@media (min-width: 900px)"
        slots={{ field: CampoExterno, calendarHeader: Cabecera, layout: Estructura, day: Dia }}
        slotProps={{
          popper: { className: 'fp-capa', placement: 'bottom-start', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] },
          desktopPaper: { className: 'fp-paper', 'aria-label': 'Calendario' },
          dialog: { className: 'fp-capa' },
          mobilePaper: { className: 'fp-paper', 'aria-label': 'Calendario' },
        }}
      />
    </Eleccion.Provider>
  );
}

// Los estilos de MUI van primero en <head> para que styles.css los pise con la misma especificidad
const cache = createCache({ key: 'mui', prepend: true });
const tema = createTheme({ palette: { primary: { main: '#cf464e' } }, typography: { fontFamily: "'Noto Sans', system-ui, sans-serif" } });

createRoot(document.getElementById('fecha-picker')).render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={tema}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" dateFormats={FORMATOS} localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}>
        <Calendario />
      </LocalizationProvider>
      <Desplegable id="region" />
      <Desplegable id="ciudad" />
    </ThemeProvider>
  </CacheProvider>
);
