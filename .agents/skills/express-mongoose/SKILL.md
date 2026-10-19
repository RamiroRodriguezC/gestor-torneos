---
name: express-mongoose
description: Guías y mejores prácticas para el backend con Node.js, Express, Mongoose, JWT y Bcrypt.
---

# Guías del Backend (Express + Mongoose)

Al trabajar en el código backend (`/backend`) de este proyecto, sigue estas reglas:
- El proyecto utiliza **ES Modules** (`import` / `export`).
- Usa **Express.js** para la creación de rutas y middlewares.
- Para el modelado de la base de datos MongoDB, utiliza **Mongoose**. Sigue el patrón de Schemas y Models.
- La autenticación se maneja con **JWT** (`jsonwebtoken`) y el hasheo de contraseñas con **bcrypt**. Asegúrate de validar tokens en middlewares protegidos.
- Utiliza **http-errors** para generar y manejar errores HTTP de forma estándar.
- Las variables de entorno se cargan con **dotenv**.
