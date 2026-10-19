// Landing offline. Sin backend: el envío se simula.
// Parámetros de revisión de diseño:
//   ?demo      precarga los datos de ejemplo del estado «completa» de Figma
//   ?errores   lo mismo, con la fecha, el RUT y el correo con error de formato
//   ?menor18   igual que ?errores, pero con una fecha real de alguien menor de 18
//   ?falla     el primer envío falla y muestra el error de envío
//   ?exito     abre directo el éxito · ?caducado abre directo el enlace caducado
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ── Video del hero según ancho ───────────────────
  const video = $('#hero');
  const mq = matchMedia('(min-width: 900px)');
  const setVideo = () => {
    const src = mq.matches ? 'assets/video/hero-desktop.mp4' : 'assets/video/hero-mobile.mp4';
    if (!video.src.endsWith(src)) { video.src = src; video.play().catch(() => {}); }
  };
  setVideo();
  mq.addEventListener('change', setVideo);

  // ── Regiones y ciudades ──────────────────────────
  const REGIONES = {
    'Arica y Parinacota': ['Arica', 'Putre'],
    'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
    'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones'],
    'Atacama': ['Copiapó', 'Vallenar', 'Caldera', 'Chañaral'],
    'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
    'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Los Andes', 'Quillota'],
    'Metropolitana': ['Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'Providencia', 'Ñuñoa', 'Vitacura', 'Lo Barnechea', 'San Bernardo'],
    "O'Higgins": ['Rancagua', 'San Fernando', 'Rengo', 'Pichilemu'],
    'Maule': ['Talca', 'Curicó', 'Linares', 'Constitución'],
    'Ñuble': ['Chillán', 'Chillán Viejo', 'San Carlos'],
    'Biobío': ['Concepción', 'Talcahuano', 'Los Ángeles', 'Coronel', 'San Pedro de la Paz'],
    'La Araucanía': ['Temuco', 'Padre Las Casas', 'Villarrica', 'Angol', 'Pucón'],
    'Los Ríos': ['Valdivia', 'La Unión', 'Panguipulli'],
    'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas', 'Ancud'],
    'Aysén': ['Coyhaique', 'Puerto Aysén'],
    'Magallanes': ['Punta Arenas', 'Puerto Natales', 'Porvenir'],
  };
  const region = $('#region');
  const ciudad = $('#ciudad');
  const opt = (v, t = v) => Object.assign(document.createElement('option'), { value: v, textContent: t });
  Object.keys(REGIONES).forEach(r => region.append(opt(r)));

  region.addEventListener('change', () => {
    ciudad.replaceChildren(opt('', region.value ? 'Selecciona tu ciudad' : ''), ...(REGIONES[region.value] || []).map(c => opt(c)));
    ciudad.disabled = !region.value;
    ciudad.closest('.field').classList.toggle('is-disabled', !region.value);
    ciudad.classList.remove('filled');
  });
  [region, ciudad].forEach(s => s.addEventListener('change', () => s.classList.toggle('filled', !!s.value)));

  // ── Formatos ─────────────────────────────────────
  const miles = n => n.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const rut = $('#rut');
  rut.addEventListener('input', () => {
    const raw = rut.value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
    rut.value = raw.length < 2 ? raw : `${miles(raw.slice(0, -1))}-${raw.slice(-1)}`;
  });
  const rutValido = v => {
    const raw = v.replace(/[^0-9kK]/g, '').toUpperCase();
    if (raw.length < 8) return false;
    const cuerpo = raw.slice(0, -1), dv = raw.slice(-1);
    let suma = 0, m = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) { suma += +cuerpo[i] * m; m = m === 7 ? 2 : m + 1; }
    const r = 11 - (suma % 11);
    return dv === (r === 11 ? '0' : r === 10 ? 'K' : String(r));
  };

  const fecha = $('#nacimiento');
  fecha.addEventListener('input', () => {
    const d = fecha.value.replace(/\D/g, '').slice(0, 8);
    fecha.value = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/');
  });
  // El calendario (fecha/datepicker.bundle.js) lee este campo al abrir y escribe dd/mm/aaaa al guardar
  // dd/mm/aaaa con año completo: desde 1900, no futura y con 18 años cumplidos o más
  function fechaValida(v) {
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const [dd, mm, aaaa] = [+m[1], +m[2], +m[3]];
    const f = new Date(aaaa, mm - 1, dd);
    const limite = new Date(); limite.setFullYear(limite.getFullYear() - 18);
    return aaaa >= 1900 && f.getMonth() === mm - 1 && f.getDate() === dd && f <= limite;
  }
  // Fecha real y no futura, pero de alguien menor de 18: tiene su propio mensaje
  function fechaMenor(v) {
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const f = new Date(+m[3], +m[2] - 1, +m[1]);
    return +m[3] >= 1900 && f.getMonth() === +m[2] - 1 && f.getDate() === +m[1] && f <= new Date() && !fechaValida(v);
  }

  const ingreso = $('#ingreso');
  ingreso.addEventListener('input', () => {
    const d = ingreso.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
    ingreso.value = d ? `$${miles(d)}` : '';
  });

  // ── Validación ───────────────────────────────────
  const reglas = {
    rut: f => rutValido($('input', f).value),
    fecha: f => fechaValida($('input', f).value),
    correo: f => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('input', f).value.trim()),
    ingreso: f => +$('input', f).value.replace(/\D/g, '') > 0,
    genero: f => !!$('input:checked', f),
  };
  const valido = f => (reglas[f.dataset.kind] || (x => !!$('input, select', x).value.trim()))(f);
  const requeridos = $$('[data-req]');
  // Solo RUT, fecha y correo muestran error, y solo por formato: vacío no es error (el botón sigue deshabilitado)
  const conFormato = ['rut', 'fecha', 'correo'];
  const marcar = f => {
    if (!conFormato.includes(f.dataset.kind)) return;
    const inp = $('input', f), malo = !!inp.value.trim() && !valido(f);
    if (f.dataset.kind === 'fecha') $('.err', f).lastChild.textContent = fechaMenor(inp.value) ? 'Ingresa una fecha mayor o igual a 18 años' : 'Ingresa una fecha válida';
    f.classList.toggle('is-invalid', malo);
    if (malo) { inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', $('.err', f).id); }
    else { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
  };

  requeridos.forEach(f => {
    f.addEventListener('focusout', e => {
      // Sigue dentro del campo (radios, botón del calendario) o pasó al calendario o a la lista abiertos
      if (f.contains(e.relatedTarget) || e.relatedTarget?.closest('.fp-capa, .dd-capa')) return;
      f.dataset.touched = '1'; marcar(f);
    });
    f.addEventListener('input', () => { if (f.dataset.touched) marcar(f); actualizar(); });
    f.addEventListener('change', () => { if (f.dataset.touched) marcar(f); actualizar(); });
  });

  // ── Captcha simulado ─────────────────────────────
  const captcha = $('#captcha');
  let captchaOk = false;
  captcha.addEventListener('click', () => {
    if (captchaOk || captcha.classList.contains('loading')) return;
    captcha.classList.add('loading');
    setTimeout(() => {
      captcha.classList.replace('loading', 'ok');
      captcha.setAttribute('aria-checked', 'true');
      captchaOk = true; actualizar();
    }, 800);
  });

  // ── Acordeón «Más información» ───────────────────
  // El contenido es el mismo en las dos tarjetas (variante MoreInfo=True de Figma), sale del <template>
  const tpl = $('#tpl-more');
  $$('.more-panel').forEach(p => p.append(tpl.content.cloneNode(true)));
  $$('.more').forEach(b => b.addEventListener('click', () => {
    const abierto = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!abierto));
    $('span', b).textContent = abierto ? 'Más información' : 'Menos información';
    $('#' + b.getAttribute('aria-controls')).hidden = abierto;
  }));

  // ── Botón y envío ────────────────────────────────
  // El botón se habilita solo con los obligatorios completos y válidos, el captcha y el
  // consentimiento C1 marcado («Requerido» en Figma). C2 es opcional y no condiciona el envío.
  const params = new URLSearchParams(location.search);
  let fallar = params.has('falla');
  const enviar = $('#enviar');
  const form = $('#form');
  const c1 = $('#c1');
  c1.addEventListener('change', () => actualizar());
  function actualizar() { enviar.disabled = !(captchaOk && c1.checked && requeridos.every(valido)); }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (enviar.disabled || enviar.classList.contains('sending')) return;
    enviar.classList.add('sending');
    enviar.setAttribute('aria-busy', 'true');
    $('#enviando').hidden = false;
    $$('input, select, button', form).forEach(el => { if (el !== enviar) el.disabled = true; });
    setTimeout(() => {
      if (fallar) { fallar = false; mostrarEstado('vista-error'); } else mostrarEstado('vista-exito');
    }, 1600);
  });

  function mostrarEstado(id) {
    $('#vista-form').hidden = true;
    $$('.state').forEach(v => (v.hidden = v.id !== id));
    document.body.classList.add('is-state');
    video.pause();
    scrollTo(0, 0);
    $('#' + id).focus({ preventScroll: true });
  }

  // «Volver a intentar»: regresa al formulario con los datos y el captcha tal como quedaron
  $('#reintentar').addEventListener('click', () => {
    $('#vista-error').hidden = true;
    $('#vista-form').hidden = false;
    document.body.classList.remove('is-state');
    $$('input, select, button', form).forEach(el => (el.disabled = false));
    ciudad.disabled = !region.value;
    enviar.classList.remove('sending');
    enviar.removeAttribute('aria-busy');
    $('#enviando').hidden = true;
    actualizar();
    video.play().catch(() => {});
    enviar.scrollIntoView({ block: 'center' });
    enviar.focus({ preventScroll: true });
  });

  // ── Datos de ejemplo (?demo, ?errores) ───────────
  const set = (id, v) => { const el = $('#' + id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  if (params.has('demo') || params.has('errores') || params.has('menor18')) {
    set('nombres', 'Camila Andrea'); set('apellido1', 'Soto'); set('apellido2', 'Ramírez');
    $('input[name="genero"][value="femenino"]').checked = true;
    set('nacimiento', '12031988'); set('rut', '123456785'); set('correo', 'camila.soto@correo.cl');
    set('ingreso', '2000000'); set('direccion', 'Av. Vitacura 1520');
    region.value = 'Metropolitana'; region.dispatchEvent(new Event('change', { bubbles: true }));
    ciudad.value = 'Santiago'; ciudad.dispatchEvent(new Event('change', { bubbles: true }));
    c1.checked = true; $('#c2').checked = true;
  }
  // Valores con error de formato del estado «error» de Figma
  if (params.has('errores')) {
    set('nacimiento', '31201988'); set('rut', '123456780'); set('correo', 'camila.soto@correo');
    ['#nacimiento', '#rut', '#correo'].forEach(s => { const f = $(s).closest('.field'); f.dataset.touched = '1'; marcar(f); });
  }
  // Fecha real de alguien menor de 18: mensaje propio de la regla de edad
  if (params.has('menor18')) {
    set('nacimiento', '01012020'); set('rut', '123456780'); set('correo', 'camila.soto@correo');
    ['#nacimiento', '#rut', '#correo'].forEach(s => { const f = $(s).closest('.field'); f.dataset.touched = '1'; marcar(f); });
  }
  actualizar();
  if (params.has('exito')) mostrarEstado('vista-exito');
  if (params.has('caducado')) mostrarEstado('vista-caducado');
})();
