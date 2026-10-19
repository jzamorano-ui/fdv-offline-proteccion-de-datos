# Landing de captación offline — prototipo y assets

Prototipo funcional de la landing a la que llega una persona desde el enlace que le envía un asesor por correo. Es HTML, CSS y JS sin backend: el envío y el captcha están simulados.

- **Prototipo publicado:** https://jzamorano-ui.github.io/fdv-offline-proteccion-de-datos/ _(se activa al publicar)_
- **Diseño (Figma, handoff):** https://www.figma.com/design/23oW4hxMY3pQNdfdCTTtRJ
- **Historia de usuario:** https://alemana.atlassian.net/browse/VDV-5163

## Cómo verlo

Abre `index.html` con un servidor estático (los videos y el calendario no cargan bien desde `file://`):

```
python3 -m http.server 8000
```

Luego entra a http://localhost:8000. No hay que instalar nada.

## Estados de pantalla

Se abren agregando un parámetro a la URL.

| Estado | URL | Frame en Figma |
|---|---|---|
| Formulario vacío | `/` | Formulario · vacío |
| Formulario completo | `/?demo` | Formulario · completo |
| Error en campos (fecha, RUT, correo) | `/?errores` | Formulario · error en campos |
| Envío con error, con reintento | `/?demo&falla` | Envío · error |
| Envío exitoso | `/?exito` | Envío · éxito |
| Enlace caducado | `/?caducado` | Enlace · caducado |

«Enviando» se ve al presionar el botón con el formulario completo. El estado de éxito también se alcanza enviando un formulario válido.

## Reglas que cumple el prototipo

- El botón «Confirmar y enviar» se habilita con los datos obligatorios válidos, el captcha resuelto y el consentimiento de contacto marcado.
- El consentimiento de Grupo Alemana es opcional y no condiciona el envío.
- Un campo vacío no muestra error. Solo RUT, fecha de nacimiento y correo lo muestran, y solo por formato.
- Si el envío falla, «Volver a intentar» regresa al formulario con los datos y el captcha como quedaron.

Los textos legales de los consentimientos son referenciales: los define Legal.

## Assets

| Archivo | Formato | Peso | Uso |
|---|---|---|---|
| `assets/ilustraciones/ilustracion-exito.png` | PNG | 22 KB | Pantalla de éxito |
| `assets/ilustraciones/ilustracion-error.png` | PNG | 20 KB | Pantallas de error de envío y enlace caducado |
| `assets/video/hero-desktop.mp4` | MP4 1920×1080 | 3,8 MB | Video del encabezado en pantallas desde 900 px |
| `assets/video/hero-mobile.mp4` | MP4 1080×1000 | 2,5 MB | Video del encabezado en pantallas menores a 900 px |

Los logos y la imagen del captcha simulado (`assets/svg/`, `assets/img/`) solo sirven al prototipo; dev no los necesita.

Los videos se comprimieron con H.264 (CRF 25), sin audio y con la misma resolución y duración que el original (PSNR sobre 44 dB). Las ilustraciones salen de la sección de assets del handoff (`Plataforma · Asset · Ilustración · estado`).

## Estructura

```
index.html          Pantallas y estados
styles.css          Estilos de la landing
tokens.css          Tokens de color y tipografía (Neo)
app.js              Validación, estados y envío simulado
fecha/              Calendario (MUI X) y listas desplegables, ya compilados
fecha/fuente/       Código fuente del calendario, para recompilar con npm run build
assets/             Logos, ilustraciones, imágenes y videos
```

## Pendientes

- El enlace «ingresando aquí» de los derechos apunta a `#` hasta que exista el destino del Centro de Privacidad.
- Los textos de los consentimientos, su cantidad de casillas y su gestión en Soyio los define Legal.
