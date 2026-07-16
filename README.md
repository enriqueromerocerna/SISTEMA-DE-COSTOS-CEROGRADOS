# Cero Grados — Dashboard de costos y precios

Herramienta para calcular el costo real de cada producto (insumos + costos fijos) y el precio de venta sugerido según el margen de ganancia que definas.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior

## Uso local

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente `http://localhost:5173`).

## Build de producción

```bash
npm run build
npm run preview
```

Esto genera la carpeta `dist/` lista para subir a cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc.).

## Datos

Los insumos, productos y costos fijos se guardan en el `localStorage` del navegador — es decir, quedan solo en tu dispositivo/navegador, no en un servidor. Si limpias los datos del sitio o cambias de navegador, no se transfieren automáticamente.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Dashboard de costos Cero Grados"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

(Antes crea el repositorio vacío en GitHub y reemplaza la URL de `origin` por la tuya.)

## Estructura

```
src/
  App.jsx        componente principal del dashboard
  main.jsx       punto de entrada de React
  index.css      directivas de Tailwind
  assets/
    cero-grados-logo.png
```
