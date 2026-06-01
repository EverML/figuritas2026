# Figuritas Mundial

**Figuritas Mundial** es una PWA mobile-first para llevar un control rápido de las figuritas faltantes del Mundial.

Está pensada para uso personal, en el celular, con un flujo simple:

1. Importar una lista de faltantes.
2. Buscar por código o país.
3. Marcar figuritas como conseguidas.
4. Ver el resumen y compartir faltantes.

## Importante

Este es un proyecto de juguete, hecho para divertirse y experimentar con una PWA liviana.
No está pensado como una aplicación seria de producción, ni como una herramienta oficial del álbum.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- `vite-plugin-pwa`

## Versionado

La versión visible en la pantalla principal sale de `package.json` y se muestra en el header de la vista de faltantes.
Cada cambio relevante debería venir acompañado por un bump de versión para que la app lo refleje.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

La app está preparada para deploy estático en AWS Amplify usando el branch `master`.
