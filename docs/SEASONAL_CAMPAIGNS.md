# Campañas de Monova

La campaña activa se define en `config/campaign.ts`.

- `"black"`: Black Mode, hasta 30% de descuento. Incluye las cinco piezas aportadas, optimizadas a WebP, y los tres videos con controles y carga bajo demanda.
- `"christmas"`: restaura la portada, banner, imágenes de servicios, portafolio y equipo de Navidad. Oculta la sección Black Mode.

Para recuperar Navidad en diciembre, cambiar `activeCampaign` de `"black"` a `"christmas"`. No hay cambio automático por fecha. No se eliminaron los archivos navideños ni se modificó el juego de Navidad.

Los originales aportados siguen intactos en Descargas. Los recursos Black Mode están en `public/assets/black-mode/`. El descuento se comunica como “hasta 30%”; su importe concreto se confirma al cotizar.

## Banners generados

Generados con la herramienta integrada de imágenes, a partir de los referentes aportados:

- `public/assets/black-mode/hero-wide-v1.webp`: banner 16:9, gato Monova con gafas a la derecha, papel grafito rasgado y luz naranja, espacio oscuro a la izquierda para texto HTML; sin textos ni botones incrustados.
- `public/assets/black-mode/creative-wide-v1.webp`: banner 3:1, gato Monova con cámara a la izquierda, estudio negro y luces naranjas, espacio libre a la derecha para texto HTML; sin textos ni botones incrustados.

El tema negro de la página de agencia está condicionado a la campaña Black. Las composiciones se adaptan a móvil con el texto fuera de la imagen. Los videos conservan controles nativos y precargan solo metadatos.

- `public/assets/black-mode/mascot-v1.webp`: mascota Black Mode de cuerpo entero con transparencia, gafas, casco blanco y naranja y buzo negro; pose de saludo con pulgar arriba, identidad basada en la referencia.

- `public/assets/black-mode/team-v1.webp`: edición con herramienta integrada. Prompt: conservar persona y escena de trabajo, cambiar traje de dinosaurio por casco, gafas y buzo Black Mode, estudio grafito con luces naranjas, sin textos.
