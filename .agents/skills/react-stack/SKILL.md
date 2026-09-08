---
name: react-stack
description: Guías y mejores prácticas para el frontend con React, Vite, Material UI (MUI), y Dexie.
---

# Guías del Frontend (React + MUI)

Al trabajar en el código frontend (`/frontend`) de este proyecto, sigue estas reglas:
- Usa **React** con componentes funcionales y Hooks.
- El proyecto usa **Vite** como empaquetador. Cualquier configuración o variable de entorno debe seguir las reglas de Vite (`VITE_...`).
- Para la interfaz gráfica, usa **Material UI (MUI)**. Aprovecha la propiedad `sx`, el sistema de temas y los componentes predefinidos.
- El manejo de bases de datos locales (IndexedDB) se hace con **Dexie**. Usa `dexie-react-hooks` (`useLiveQuery`) para reaccionar a cambios locales.
- Las llamadas a la API (backend) se realizan con **Axios**.
- El enrutamiento se maneja con **React Router DOM**.
