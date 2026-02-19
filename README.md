# 🏥 Ingreso de Solicitudes - Gestión de Reembolsos

Sistema moderno y dinámico para el ingreso de solicitudes médicas, diseñado para ofrecer una experiencia de usuario fluida y eficiente mediante un formulario multi-paso.

## ✨ Características Principales

- **Formulario Inteligente Multi-paso:** Flujo guiado de 7 pasos para recolectar datos personales, detalles de la atención y datos bancarios.
- **Validación Avanzada:** Validación de RUT chileno, formatos de correo y teléfono en tiempo real.
- **Gestión de Archivos:** Carga de boletas (JPG, PNG, PDF) con vista previa instantánea y validación de tamaño/formato.
- **Persistencia de Datos:** Los datos se guardan automáticamente en `localStorage` para evitar pérdida de información en recargas accidentales.
- **Diseño Premium:** Interfaz responsiva y animada con `Framer Motion` y estilizada con `Tailwind CSS v4`.
- **Feedback Inmediato:** Modales dinámicos de éxito y error para una mejor comunicación con el usuario.

## 🚀 Tecnologías Utilizadas

- **Core:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Formularios:** [React Hook Form](https://react-hook-form.com/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)

## 📦 Instalación y Configuración

1. **Clona el repositorio:**

   ```bash
   git clone [url-del-repositorio]
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Ejecuta el entorno de desarrollo:**
   ```bash
   npm run dev
   ```

## 🛠️ Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Genera el bundle optimizado para producción en la carpeta `/dist`.
- `npm run preview`: Previsualiza localmente la versión de producción.

## 📁 Estructura del Proyecto

- `/src/components`: Componentes reutilizables como `MultiStepForm` y `FormInput`.
- `/src/index.css`: Definición del sistema de diseño (tokens de color, fuentes y capas base).
- `/src/main.tsx`: Punto de entrada de la aplicación.

---

© 2026 Plataforma de Gestión de Reembolsos
