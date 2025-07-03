# Gas Management App

Esta es una aplicación para la gestión de combustible.

## Requisitos Previos

- Node.js (v16 o superior recomendado)
- npm o yarn

## Instalación

1. Clona este repositorio.
2. Navega al directorio del proyecto:
   ```bash
   cd gas-management-app
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
   o si usas yarn:
   ```bash
   yarn install
   ```

## Ejecutar la Aplicación (Modo Desarrollo)

Para iniciar el servidor de desarrollo, ejecuta:
```bash
npm run serve
```
o si usas yarn:
```bash
yarn serve
```
La aplicación estará disponible en `http://localhost:8080` (o el puerto que indique la consola).

## Compilar para Producción

Para compilar la aplicación para producción, ejecuta:
```bash
npm run build
```
o si usas yarn:
```bash
yarn build
```
Los archivos compilados se encontrarán en el directorio `dist/`.

## Linting

Para ejecutar el linter y verificar el estilo del código:
```bash
npm run lint
```
o si usas yarn:
```bash
yarn lint
```

## Estructura del Proyecto (Breve Descripción)

- `public/`: Archivos estáticos.
- `src/`: Código fuente de la aplicación.
  - `assets/`: Recursos como CSS, imágenes.
  - `components/`: Componentes de Vue reutilizables.
  - `router/`: Configuración de Vue Router.
  - `store/`: Configuración de Vuex (manejo de estado).
  - `views/`: Componentes de Vue que representan las "páginas" de la aplicación.
  - `App.vue`: Componente raíz de la aplicación.
  - `main.js`: Punto de entrada principal de la aplicación.
- `package.json`: Define las dependencias y scripts del proyecto.
- `vue.config.js`: Configuración de Vue CLI.
- `.env.local`: Variables de entorno locales (no subir a git si contiene secretos).

## Contribuir

Si deseas contribuir, por favor sigue las guías de estilo y envía un Pull Request.
