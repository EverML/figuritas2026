# Plan de ejecución para Codex: PWA de figuritas faltantes del Mundial

## Objetivo del producto

Construir una PWA mobile-first para revisar rápidamente desde el celular qué figuritas del Mundial faltan.

La app NO debe enfocarse en mostrar el álbum completo. El foco principal es:

1. Ver solo figuritas faltantes.
2. Buscar rápidamente por código.
3. Marcar una figurita como conseguida.
4. Usar la app offline.
5. Poder importar una lista en texto plano.
6. Poder exportar la lista de faltantes para compartir por WhatsApp.

## Stack recomendado

Usar:

* Vite
* React
* TypeScript
* Tailwind CSS
* vite-plugin-pwa
* LocalStorage para MVP
* Sin backend
* Sin login
* Sin base de datos remota

## Nombre tentativo del proyecto

`world-cup-stickers-missing-pwa`

## Principios de UX

La app debe ser extremadamente rápida para uso en celular.

El flujo principal es:

Abrir app -> buscar código o país -> confirmar si falta -> marcar como conseguida.

No debe requerir múltiples pantallas para una acción simple.

## Dataset inicial

El usuario puede cargar una lista en texto plano con este formato:

```txt
-- Especiales missing
FWC 1
FWC 3
FWC 4

-- PAISES MISSING
PAN 01
PAN 04
PAN 07
```

La app debe parsear este texto y convertirlo a una estructura interna.

## Modelo de datos

Crear un tipo TypeScript:

```ts
export type StickerStatus = "missing" | "owned";

export type StickerGroupType = "special" | "country" | "unknown";

export type Sticker = {
  id: string;
  code: string;
  prefix: string;
  number: string;
  groupLabel: string;
  groupType: StickerGroupType;
  countryCode?: string;
  countryName?: string;
  status: StickerStatus;
  createdAt: string;
  updatedAt: string;
};
```

Reglas:

* `id` puede ser igual al código normalizado, por ejemplo `PAN-07`.
* `code` debe preservar una versión legible, por ejemplo `PAN 07`.
* `prefix` es la parte alfabética, por ejemplo `PAN`.
* `number` es la parte numérica, por ejemplo `07`.
* `groupLabel` sale del header del texto, por ejemplo `Especiales` o `Paises`.
* `groupType` debe ser:

  * `special` para headers que incluyan `especial`
  * `country` para headers que incluyan `pais`, `país`, `paises`, `países`
  * `unknown` para cualquier otro
* `status` inicia como `missing`.

Para el MVP, crear un pequeño diccionario de países:

```ts
export const COUNTRY_NAMES: Record<string, string> = {
  PAN: "Panamá",
  ARG: "Argentina",
  BRA: "Brasil",
  PAR: "Paraguay",
  URU: "Uruguay",
  CHI: "Chile",
  COL: "Colombia",
  ECU: "Ecuador",
  MEX: "México",
  USA: "Estados Unidos",
  CAN: "Canadá"
};
```

Si el prefijo no está en el diccionario, mostrar el prefijo como nombre del grupo.

## Estructura de carpetas

Crear esta estructura:

```txt
src/
  App.tsx
  main.tsx
  index.css

  components/
    AppShell.tsx
    BottomNav.tsx
    SearchBar.tsx
    FilterChips.tsx
    StickerCard.tsx
    StickerGroup.tsx
    EmptyState.tsx
    ImportTextarea.tsx
    StatsCard.tsx
    Toast.tsx

  pages/
    MissingPage.tsx
    QuickSearchPage.tsx
    SummaryPage.tsx
    ImportPage.tsx

  lib/
    parser.ts
    storage.ts
    stickers.ts
    countries.ts
    formatters.ts

  types/
    sticker.ts
```

## Pantallas principales

### 1. MissingPage

Pantalla principal.

Debe mostrar:

* Header:

  * Título: `Mundial 2026`
  * Subtítulo: `Me faltan X figuritas`
* Barra de búsqueda sticky.
* Filtros rápidos:

  * Todas
  * Especiales
  * Países
* Grupos de figuritas faltantes:

  * Especiales
  * Panamá
  * Argentina
  * etc.

Solo mostrar stickers con `status = "missing"`.

Cada grupo debe mostrar contador.

Ejemplo:

```txt
Especiales 3
[FWC 1] [FWC 3] [FWC 4]

Panamá 3
[PAN 01] [PAN 04] [PAN 07]
```

### 2. QuickSearchPage

Pantalla de búsqueda rápida.

Debe tener:

* Input grande.
* Resultado inmediato al escribir.
* Si el código está en faltantes:

  * Mostrar: `Te falta esta figurita`
  * Botón: `Marcar como conseguida`
* Si el código existe pero ya fue marcado:

  * Mostrar: `Ya la tenés`
* Si no existe en la lista:

  * Mostrar: `No está en tu lista de faltantes`

Como el MVP solo tiene faltantes importadas, si no existe en storage se considera que no está en la lista de faltantes.

### 3. SummaryPage

Pantalla de resumen.

Debe mostrar:

* Total faltantes
* Total conseguidas
* Total cargadas
* Porcentaje completado sobre el dataset cargado
* Cantidad faltante por grupo

Ejemplo:

```txt
Faltan 28
Conseguidas 12
Total cargadas 40
Completado 30%

Especiales: faltan 3
Panamá: faltan 3
Brasil: faltan 8
```

### 4. ImportPage

Pantalla para pegar el dataset en texto plano.

Debe tener:

* Textarea grande.
* Botón `Importar lista`.
* Preview de cuántas figuritas detectó.
* Confirmación antes de reemplazar datos existentes.
* Opción simple: `Reemplazar lista actual`.

Para el MVP no hace falta merge inteligente.

## Navegación

Usar bottom navigation mobile-first con 4 tabs:

```txt
Faltantes | Buscar | Resumen | Importar
```

La navegación debe permanecer fija abajo.

## Comportamiento de StickerCard

Cada sticker se debe ver como una card/chip grande.

Diseño:

```txt
┌────────┐
│  PAN   │
│   07   │
└────────┘
```

Al tocar una card:

* Marcar como `owned`.
* Mostrar toast/snackbar:

  * `PAN 07 marcada como conseguida`
  * Acción: `Deshacer`

Si el usuario toca `Deshacer`, volver a `missing`.

No pedir confirmación en el flujo normal para mantener velocidad.

## Búsqueda

La búsqueda debe aceptar:

* `PAN`
* `pan`
* `PAN 07`
* `pan07`
* `07`
* `FWC`

Crear normalizador:

```ts
normalizeStickerCode(input: string): string
```

Debe:

* Convertir a uppercase.
* Remover espacios extra.
* Permitir comparar `PAN07` con `PAN 07`.

## Persistencia

Crear `storage.ts`.

Guardar en LocalStorage:

```ts
const STORAGE_KEY = "world-cup-stickers-state-v1";
```

Funciones:

```ts
loadStickers(): Sticker[];
saveStickers(stickers: Sticker[]): void;
clearStickers(): void;
```

## Parser

Crear `parser.ts`.

Función principal:

```ts
parseMissingStickers(input: string): Sticker[];
```

Reglas:

* Ignorar líneas vacías.
* Si una línea empieza con `--`, usarla como header de grupo actual.
* Si una línea no empieza con `--`, tratarla como código de sticker.
* Extraer prefix y number.
* Crear sticker usando el grupo actual.
* Si no hay grupo, usar `Sin grupo`.
* Evitar duplicados por código normalizado.

Debe soportar:

```txt
FWC 1
FWC 01
PAN 07
PAN07
```

## Exportar para WhatsApp

En SummaryPage o MissingPage agregar botón:

`Compartir faltantes`

Debe generar un texto:

```txt
Me faltan estas figuritas:

Especiales:
FWC 1
FWC 3
FWC 4

Panamá:
PAN 01
PAN 04
PAN 07
```

Usar Web Share API si está disponible:

```ts
navigator.share({ text })
```

Si no está disponible, copiar al clipboard.

## PWA

Configurar `vite-plugin-pwa`.

Requisitos:

* App instalable.
* Manifest con:

  * name: `Figuritas Mundial`
  * short_name: `Figuritas`
  * display: `standalone`
  * theme_color
  * background_color
  * icons básicos
* Service worker para assets.
* App usable offline después de la primera carga.

## Diseño visual

Mobile-first.

Usar Tailwind.

Estilo:

* Fondo gris muy claro.
* Cards blancas.
* Bordes redondeados grandes.
* Sombras suaves.
* Texto grande.
* Inputs grandes.
* Botones fáciles de tocar.
* Sin exceso de colores.
* Buen contraste.

Layout base:

```txt
┌─────────────────────────────┐
│ Mundial 2026                │
│ Me faltan 28 figuritas      │
│                             │
│ [ Buscar código...       ]  │
│                             │
│ Todas  Especiales  Países   │
│                             │
│ Especiales              3   │
│ [FWC 1] [FWC 3] [FWC 4]     │
│                             │
│ Panamá                  3   │
│ [PAN 01] [PAN 04] [PAN 07]  │
│                             │
│ ─────────────────────────── │
│ Faltantes | Buscar | Resumen│
└─────────────────────────────┘
```

## Estados especiales

### Sin datos importados

Mostrar:

```txt
Todavía no cargaste tu lista.
Importá tus figuritas faltantes para empezar.
[Importar lista]
```

### Sin faltantes

Mostrar:

```txt
Álbum completo
No tenés figuritas pendientes.
```

### Sin resultados de búsqueda

Mostrar:

```txt
No encontramos esa figurita en tus faltantes.
```

## Tareas de implementación para Codex

### Tarea 1: Bootstrap

Crear proyecto Vite React TypeScript con Tailwind y vite-plugin-pwa.

Comandos sugeridos:

```bash
npm create vite@latest world-cup-stickers-missing-pwa -- --template react-ts
cd world-cup-stickers-missing-pwa
npm install
npm install -D tailwindcss postcss autoprefixer
npm install vite-plugin-pwa
npx tailwindcss init -p
```

Configurar Tailwind y limpiar boilerplate.

### Tarea 2: Tipos y helpers

Crear:

* `src/types/sticker.ts`
* `src/lib/countries.ts`
* `src/lib/formatters.ts`
* `src/lib/parser.ts`

Implementar parser con tests manuales simples dentro de comentarios o archivo temporal.

### Tarea 3: Storage local

Crear `src/lib/storage.ts`.

Implementar load/save/clear.

En `App.tsx`, cargar stickers desde LocalStorage al iniciar.

### Tarea 4: Layout base

Crear:

* `AppShell`
* `BottomNav`
* Pages principales:

  * `MissingPage`
  * `QuickSearchPage`
  * `SummaryPage`
  * `ImportPage`

No usar react-router para el MVP. Usar estado local:

```ts
type Tab = "missing" | "search" | "summary" | "import";
```

### Tarea 5: ImportPage

Implementar textarea.

Agregar dataset demo como placeholder:

```txt
-- Especiales missing
FWC 1
FWC 3
FWC 4

-- PAISES MISSING
PAN 01
PAN 04
PAN 07
```

Al importar:

* Parsear
* Guardar en estado
* Guardar en LocalStorage
* Navegar a Faltantes

### Tarea 6: MissingPage

Implementar:

* Header con contador
* SearchBar
* FilterChips
* Agrupación por grupo
* StickerCard
* Marcar como conseguida
* Undo con toast

### Tarea 7: QuickSearchPage

Implementar búsqueda rápida.

Resultado instantáneo:

* Falta
* Ya la tenés
* No está en faltantes

Agregar botón para marcar como conseguida si falta.

### Tarea 8: SummaryPage

Implementar estadísticas:

* Total cargadas
* Total faltantes
* Total conseguidas
* Porcentaje completado
* Faltantes por grupo

Agregar botón `Compartir faltantes`.

Implementar Web Share API con fallback a clipboard.

### Tarea 9: PWA

Configurar `vite.config.ts` con `VitePWA`.

Agregar manifest.

Agregar íconos temporales simples en `public/`.

Verificar que el build funcione.

### Tarea 10: Pulido mobile

Revisar:

* Tap targets grandes.
* Bottom nav fija.
* Search sticky.
* No overflow horizontal.
* Buen contraste.
* Funciona bien en 390px de ancho.
* Funciona offline después de instalar/cargar.

## Criterios de aceptación

La app está lista para MVP si:

1. Puedo pegar una lista de faltantes.
2. La app detecta las figuritas.
3. Veo solo las que faltan.
4. Puedo buscar `PAN 07`, `PAN07`, `pan 07` o `07`.
5. Puedo marcar una como conseguida.
6. Puedo deshacer la última acción.
7. La app guarda el estado al cerrar y abrir.
8. Puedo compartir la lista de faltantes.
9. La app se puede instalar como PWA.
10. La app funciona offline después de la primera carga.

## No implementar todavía

No implementar en el MVP:

* Login
* Backend
* Supabase
* OCR
* Cámara
* Imágenes de figuritas
* Álbum completo
* Repetidas
* Comparación con amigos
* Sincronización cloud
* Autenticación social

Estos puntos pueden quedar para versión 2.

## Prompt inicial para Codex

Construí una PWA mobile-first llamada `Figuritas Mundial` usando Vite, React, TypeScript, Tailwind y vite-plugin-pwa.

El objetivo es revisar rápidamente desde el celular qué figuritas del Mundial me faltan. El foco de la app es mostrar solo figuritas faltantes, permitir búsqueda rápida por código, marcar figuritas como conseguidas, persistir localmente y funcionar offline.

Implementá el MVP siguiendo este plan:

1. Crear estructura de carpetas.
2. Crear modelo `Sticker`.
3. Crear parser para importar lista en texto plano.
4. Crear persistencia con LocalStorage.
5. Crear tabs inferiores: Faltantes, Buscar, Resumen, Importar.
6. Crear pantalla de importación.
7. Crear pantalla principal agrupada por tipo/país.
8. Crear búsqueda rápida.
9. Crear resumen con estadísticas.
10. Agregar exportación para WhatsApp usando Web Share API con fallback a clipboard.
11. Configurar PWA con manifest y service worker.

Priorizá mobile-first, performance, legibilidad y pocos taps. No agregues backend, login ni features fuera del MVP.
