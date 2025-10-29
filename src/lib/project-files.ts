// NOTE: This file is generated automatically to provide the source code viewer.
// Do not edit it manually.

type ProjectFile = {
  path: string;
  content: string;
};

export const projectFiles: ProjectFile[] = [
  {
    path: "Estructura de Archivos",
    content: `
# Estructura de Archivos de un Proyecto React

Esta es una guía de la estructura de archivos típica y recomendada para una aplicación web moderna.

---

## Archivos Raíz

Estos archivos configuran el proyecto y sus herramientas.

- **package.json**: Lista de dependencias y scripts.
- **tailwind.config.js**: Configuración de estilos de Tailwind CSS.
- **postcss.config.js**: Configuración de PostCSS.
- **vite.config.js**: Configuración de Vite (servidor de desarrollo y empaquetador).
- **index.html**: El punto de entrada HTML de la aplicación.

---

## Carpeta src/

El corazón del código de la aplicación.

- **main.jsx** (o index.jsx): Punto de entrada de React.
- **App.jsx**: Componente principal que contiene el enrutador.
- **index.css**: Estilos globales y configuración de Tailwind.

---

### Carpeta src/components/

Componentes de UI reutilizables.

- Header.jsx
- Footer.jsx
- Button.jsx

---

### Carpeta src/pages/

Componentes que representan páginas completas.

- Home.jsx
- About.jsx

---

### Carpeta src/assets/

Imágenes, fuentes y otros recursos estáticos que se importan en el código.

- logo.png
- background.jpg

---

## Carpeta public/

Archivos que se copian directamente a la carpeta de compilación sin ser procesados.

- favicon.ico
- robots.txt
- manifest.json
`,
  },
];