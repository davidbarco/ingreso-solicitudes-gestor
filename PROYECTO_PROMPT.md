> **Instrucción para IA**: Actúa como un desarrollador senior de React. Sigue estrictamente esta especificación técnica para continuar con el proyecto, respetando la paleta de colores Light Mode, la estructura de archivos y la lógica de envío de la API descrita aquí.

# 🏥 Sistema de Reembolsos Médicos Multi-Paso Premium
## Especificación Técnica Completa

---

## 📋 Objetivo General

Crear una **aplicación web de gestión de solicitudes de reembolsos médicos** con un formulario multi-paso (7 pasos) en React/TypeScript, enfocada en:

- ✅ Experiencia de usuario (UX) fluida y moderna
- ✅ Diseño ultra-premium con estética limpia (Light Mode)
- ✅ Validaciones avanzadas en tiempo real
- ✅ Persistencia robusta de datos
- ✅ Seguridad de datos sensibles
- ✅ Carga de archivos validada
- ✅ Integración con API backend
- ✅ Testing completo (unitario e integración)
- ✅ Accesibilidad (A11y)
- ✅ CI/CD automatizado

---

## 🚀 Stack Tecnológico

### Core
- **React 19.2+** con TypeScript 5.9+
- **Vite 7.3+** como build tool
- **Node 18+** (LTS recomendado)

### Gestión de Formularios
- **react-hook-form 7.71+** - Validaciones y manejo de estado de formulario
- **Validación personalizada** de RUT chileno y formatos locales

### Estilos y Animaciones
- **Tailwind CSS v4.2+** - Framework CSS de utilidad
- **Framer Motion 12.34+** - Animaciones y transiciones
- **lucide-react 0.574+** - Iconografía moderna

### Testing
- **Vitest 4.0+** - Testing framework basado en Vite
- **React Testing Library 16.3+** - Testing de componentes
- **@testing-library/jest-dom 6.9+** - Matchers DOM

### Linting y Formato
- **ESLint 9.39+** - Linting de código
- **@typescript-eslint/eslint-plugin** - Reglas TypeScript
- **Husky 9.1+** - Git hooks
- **lint-staged 16.2+** - Lint en stage

### Configuración
- **.env.local** - Variables de entorno (desarrollo)
- **.env.production** - Variables de entorno (producción)

---

## 📁 Estructura de Carpetas

```
ingreso-solicitudes/
├── public/                      # Archivos estáticos
│   └── favicon.ico
├── src/
│   ├── assets/                  # Recursos estáticos
│   │   └── ...
│   ├── components/              # Componentes React
│   │   ├── FormInput.tsx        # Input reutilizable con validación
│   │   └── MultiStepForm.tsx    # Componente principal del formulario
│   ├── constants/               # Constantes globales
│   │   └── api.constants.ts     # URLs, IDs, límites de archivo
│   ├── enums/                   # Enumeraciones
│   │   └── form.enums.ts        # ServiceType, ReceiptType, FormStep, FileKey
│   ├── services/                # Servicios y lógica de API
│   │   └── request.service.ts   # Envío de solicitudes a backend
│   ├── test/                    # Configuración de tests
│   │   └── setup.ts             # Setup de Vitest
│   ├── types/                   # Tipos TypeScript
│   │   └── form.types.ts        # FormFields, FilesState, RequestBody
│   ├── utils/                   # Funciones utilitarias
│   │   ├── validators.ts        # Validación de RUT, email, teléfono
│   │   ├── formatters.ts        # Formateo de RUT, teléfono
│   │   ├── storage.ts           # Manejo de localStorage
│   │   └── ...
│   ├── App.tsx                  # Componente raíz
│   ├── index.css                # Estilos base + variables CSS
│   └── main.tsx                 # Punto de entrada
├── .env.example                 # Template de variables de entorno
├── .env.local                   # Variables de entorno (desarrollo) - NO COMMITEAR
├── .env.production              # Variables de entorno (producción) - NO COMMITEAR
├── .eslintrc.json               # Configuración ESLint
├── .gitignore                   # Archivos a ignorar en git
├── husky/                       # Hooks de git
│   └── pre-commit               # Lint-staged antes de commit
├── tsconfig.json                # Configuración TypeScript
├── vite.config.ts               # Configuración Vite
├── vitest.config.ts             # Configuración Vitest (en vite.config.ts)
├── package.json                 # Dependencias y scripts
├── package-lock.json            # Lock file
├── .gitignore
├── README.md                    # Documentación principal
└── PROYECTO_PROMPT.md           # Este archivo
```

---

## 🔐 Seguridad y Variables de Entorno

### Variables de Entorno Requeridas

Crear archivo `.env.local` (NO COMMITEAR):

```env
# API Configuration
VITE_API_BASE_URL=https://api.ejemplo.com/endpoint
VITE_CLIENT_ID=tu-client-id-aqui

# App Constants (Opcionales)
VITE_STORAGE_KEY=reimbursement_form
VITE_TIPOLOGY_CODE=REEMBOLSO-CONSULTAMEDICA
```

### Medidas de Seguridad Implementadas

1. **Validación de Entrada**
   - Validación de RUT chileno (formato y dígito verificador)
   - Validación de email con regex seguro
   - Máscara automática de teléfono
   - Whitelist de MIME types para archivos

2. **Manejo de Datos Sensibles**
   - RUT y datos personales NO se loguean en consola (en producción)
   - Los datos sensibles se envían SOLO mediante HTTPS
   - No almacenar tokens en localStorage (si aplica)
   - Limpiar localStorage después de envío exitoso

3. **Validación de Archivos**
   - MIME types permitidos: `image/jpeg`, `image/png`, `application/pdf`
   - Tamaño máximo: 5 MB por archivo
   - Validación en cliente Y server

4. **CORS y Headers**
   - API call incluye `Content-Type: multipart/form-data` automáticamente
   - Client ID se envía como query parameter (`?client-id=...`)

5. **Validación de Respuestas**
   - Verificar `response.ok` antes de procesar
   - Manejo seguro de respuestas JSON/texto vacías
   - Try-catch para parsing JSON

---

## 📦 Tipos TypeScript (src/types/form.types.ts)

```typescript
// Campos del formulario
interface FormFields {
  firstName: string;              // Nombre
  lastName: string;               // Apellido
  rut: string;                    // RUT (12.345.678-K)
  email: string;                  // Email
  phone: string;                  // Teléfono (+56 9 XXXX XXXX)
  docRut: string;                 // RUT Médico
  centerRut: string;              // RUT Centro Médico
  amount: string;                 // Monto en CLP
  date: string;                   // Fecha (YYYY-MM-DD)
  receiptNumber: string;          // Número de boleta
  serviceType?: string;           // Enum: consultas, examenes, dental, optica
  serviceLabel?: string;          // Label legible del servicio
  receiptType?: string;           // Enum: boletas, fonasa, isapre, ordenes
  receiptLabel?: string;          // Label legible del comprobante
}

// Información de archivo subido
interface FileEntry {
  file?: File;                    // El archivo File del DOM
  name: string;                   // Nombre del archivo
  preview: string;                // URL data:// para preview
  size: string;                   // Tamaño formateado (ej: "2.5 MB")
}

// Estado de archivos
interface FilesState {
  receipt: FileEntry | null;      // Archivo obligatorio (boleta)
  additional: FileEntry | null;   // Archivo opcional
}

// Estado persistido en localStorage
interface SavedState {
  formData?: Partial<FormFields>;
  step?: number;
  bankSelected?: boolean;
  personSelected?: boolean;
  filesMetadata?: FilesState;
}

// Datos para enviar a API
interface RequestBodyData {
  nationalId: string;             // RUT del solicitante en base de datos
  prestador: string;              // Nombre del prestador
  tipoSolicitud: string;          // Tipo de servicio
  montoSolicitado: string;        // Monto ($)
  diagnosticoIngresado: string;   // Diagnóstico/descripción
  descripcion: string;            // Descripción adicional
  fechaPrestacion: string;        // Fecha del servicio
  folioColilla: string;           // Folio de colilla
  folioPam: string;               // Folio PAM
  rutMedico: string;              // RUT del médico
  rutCentro: string;              // RUT del centro
  numeroBoleta: string;           // Número de boleta
}

// Body enviado a API (FormData + JSON)
interface RequestBody {
  tipologyCode: string;           // "REEMBOLSO-CONSULTAMEDICA"
  comment: string;                // Comentario
  rutRequester: string;           // RUT del solicitante
  contactEmail: string;           // Email de contacto
  createdBy: string;              // Nombre del solicitante
  data: RequestBodyData;
}
```

---

## 📊 Enums (src/enums/form.enums.ts)

```typescript
enum ServiceType {
  CONSULTAS = 'consultas',        // Consultas Médicas
  EXAMENES = 'examenes',          // Exámenes
  DENTAL = 'dental',              // Servicios Dentales
  OPTICA = 'optica'               // Servicios Ópticos
}

enum ReceiptType {
  BOLETAS = 'boletas',            // Boletas
  FONASA = 'fonasa',              // FONASA
  ISAPRE = 'isapre',              // ISAPRE
  ORDENES = 'ordenes'             // Órdenes
}

enum FormStep {
  DATOS = 1,                      // Paso 1: Datos
  VALIDACION = 2,                 // Paso 2: Validación
  SERVICIO = 3,                   // Paso 3: Servicio
  COMPROBANTE = 4,                // Paso 4: Comprobante
  DETALLES = 5,                   // Paso 5: Detalles
  PAGO = 6,                       // Paso 6: Pago
  RESUMEN = 7                     // Paso 7: Resumen
}

enum FileKey {
  RECEIPT = 'receipt',            // Archivo boleta (obligatorio)
  ADDITIONAL = 'additional'       // Archivo adicional (opcional)
}
```

---

## 🔑 Constantes (src/constants/api.constants.ts)

```typescript
// Variables de entorno
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
export const STORAGE_KEY =
  import.meta.env.VITE_STORAGE_KEY || "reimbursement_form";
export const TIPOLOGY_CODE =
  import.meta.env.VITE_TIPOLOGY_CODE || "REEMBOLSO-CONSULTAMEDICA";

// Validación de archivos
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",       // JPG
  "image/png",        // PNG
  "application/pdf"   // PDF
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Máscaras y validación
export const RUT_REGEX = /^(\d{1,2})\.?(\d{3})\.?(\d{3})-?([kK0-9])$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/;
```

---

## 🛠️ Servicios (src/services/request.service.ts)

### submitReimbursementRequest

**Responsabilidad**: Enviar solicitud de reembolso a la API

**Firma**:
```typescript
async function submitReimbursementRequest(
  formData: Partial<FormFields>,
  files: FilesState
): Promise<void>
```

**Flujo**:
1. Construir objeto `RequestBody` con datos del formulario
2. Crear `FormData` y agregar:
   - Campo `request`: JSON stringificado con `RequestBody`
   - Campo `document`: archivos (boleta + opcional)
3. Hacer POST a `{API_BASE_URL}?client-id={CLIENT_ID}`
4. Validar respuesta (status 200-299)
5. Parsear respuesta JSON (con manejo de vacío)
6. Retornar error si falla

**Error Handling**:
- Throw error si `response.ok === false`
- Manejar respuestas vacías sin crash

---

## 🎨 Utilitarios (src/utils/)

### validators.ts
- `validateRUT(rut: string): boolean` - Valida RUT chileno con dígito verificador
- `validateEmail(email: string): boolean` - Valida formato email
- `validatePhone(phone: string): boolean` - Valida teléfono chileno
- `validateFileType(file: File): boolean` - Valida MIME type
- `validateFileSize(file: File): boolean` - Valida tamaño máximo

### formatters.ts
- `formatRUT(rut: string): string` - Formatea a 12.345.678-K
- `formatPhone(phone: string): string` - Formatea a +56 9 XXXX XXXX
- `formatFileSize(bytes: number): string` - Convierte bytes a MB/KB

### storage.ts
- `saveFormState(state: SavedState): void` - Persiste en localStorage
- `loadFormState(): SavedState | null` - Lee de localStorage
- `clearFormState(): void` - Limpia localStorage

### file-handler.ts
- `generateFilePreview(file: File): Promise<string>` - Crea data URL preview
- `createFileEntry(file: File): Promise<FileEntry>` - Crea objeto FileEntry

---

## 🔄 Flujo de los 7 Pasos

### Paso 1: Datos
**Propósito**: Recopilar información personal del solicitante

**Campos**:
- Nombre (input text, requerido)
- Apellido (input text, requerido)
- RUT (input con máscara, validación real, requerido)
- Email (input email, validación regex, requerido)
- Teléfono (input con máscara +56 9 XXXX XXXX, requerido)

**Validaciones**:
- Todos los campos requeridos
- RUT: formato y dígito verificador válido
- Email: formato válido
- Teléfono: formato +56 9 XXXX XXXX

**Persistencia**: Guardar en localStorage inmediatamente

---

### Paso 2: Validación
**Propósito**: Confirmar que el solicitante es el beneficiario correcto

**UI**:
- Tarjeta **totalmente interactiva y seleccionable**.
- Al hacer clic, debe marcarse con un borde rojo acentuado y un icono de check (`✓`) visible.
- Información dinámica: Muestra el Nombre y RUT ingresados en el Paso 1.
- Micro-animación de confirmación al ser seleccionada.

**Lógica**:
- Mostrar datos del paso 1
- Permitir editar si no es correcto (volver a paso 1)
- Confirmar y continuar

**Persistencia**: Guardar `personSelected: true`

---

### Paso 3: Servicio
**Propósito**: Seleccionar el tipo de servicio médico

**Grid de Tarjetas** (selección única):
- 🏥 Consultas Médicas (**Único activo**)
- 🦷 Dental (Próximamente - bloqueado)
- 👁️ Óptica (Próximamente - bloqueado)
- 🔬 Exámenes (Próximamente - bloqueado)

**Estados**:
- `selected`: Borde rojo + fondo con tinte rojo muy suave + check
- `hover`: Glow rojo sutil
- `disabled`: Opacidad reducida + escala de grises

**Persistencia**: Guardar `serviceType` y `serviceLabel`

---

### Paso 4: Comprobante
**Propósito**: Seleccionar tipo de documento a reembolsar

**Opciones** (selección única):
- 📄 Boletas
- 🏥 FONASA
- 🏦 ISAPRE
- 📋 Órdenes

**UI**: Similares a paso 3 (grid de tarjetas)

**Persistencia**: Guardar `receiptType` y `receiptLabel`

---

### Paso 5: Detalles
**Propósito**: Capturar datos y documentos del servicio

**Formulario**:
- Monto (input number con $, requerido)
- N° Boleta (input text, requerido)
- Fecha (input date, requerido)
- RUT Médico (input con máscara, requerido)
- RUT Centro Médico (input con máscara, requerido)

**Carga de Archivos**:
- Slot 1: Boleta (obligatoria)
  - Drag & drop o click
  - Validación MIME + tamaño
  - Preview imagen/PDF
  - Mostrar: nombre, tamaño
  - Skeleton durante carga

- Slot 2: Archivo Adicional (opcional)
  - Mismo flujo que boleta
  - Permite borrar y resubir

**Validaciones**:
- Todos los campos requeridos
- RUT: dígito verificador válido
- Monto: número positivo
- Archivos: MIME type + tamaño < 5 MB

**Persistencia**: Guardar todos los campos + metadatos de archivos (NO el File)

---

### Paso 6: Pago
**Propósito**: Información bancaria para el reembolso

**Tarjeta "Bancaria"**:
- Banco: "Santander"
- Tipo: "Cuenta Corriente"
- Número: enmascarado (XXXX XXXX XXXX XXXX)
- Iconos de edición (lápiz)

**Campos Editables**:
- Email de contacto (prefilled del paso 1)
- Teléfono de contacto (prefilled del paso 1)

**Validaciones**:
- Email: formato válido
- Teléfono: formato válido

**Persistencia**: Guardar email y teléfono de contacto

---

### Paso 7: Resumen
**Propósito**: Revisar todos los datos antes de enviar

**Secciones Resumidas** (cada una editable):
1. **Datos Personales**
   - Nombre, Apellido, RUT, Email, Teléfono
   - Ícono lápiz → saltar a paso 1

2. **Validación de Persona**
   - Nombre confirmado
   - Ícono lápiz → saltar a paso 2

3. **Tipo de Servicio**
   - Servicio seleccionado
   - Ícono lápiz → saltar a paso 3

4. **Tipo de Comprobante**
   - Comprobante seleccionado
   - Ícono lápiz → saltar a paso 4

5. **Detalle de Boleta**
   - Monto, N° Boleta, Fecha, RUT Médico, RUT Centro
   - Miniaturas de archivos (preview)
   - Ícono lápiz → saltar a paso 5

6. **Datos de Depósito**
   - Email y teléfono de contacto
   - Ícono lápiz → saltar a paso 6

**Botón de Envío**:
- Estado: `loading` durante envío
- Spinner + "Enviando..."
- Deshabilitado mientras se procesa

**Flujo de Envío**:
1. Validar que no haya errores en datos
2. Mostrar modal de carga
3. Llamar `submitReimbursementRequest(formData, files)`
4. Si éxito:
   - Modal de éxito con check animado
   - Limpiar localStorage
   - Reset a paso 1
   - Mensaje de confirmación
5. Si error:
   - Modal de error con ícono crítico
   - Mensaje de error legible
   - Opción para reintentar

---

## 🔘 Componentes de Navegación y Footer

### Indicador de Progreso Dinámico
Aparecerá en el pie de cada paso del formulario indicando el avance: **"Paso X de 7 — [Nombre]"**.

---

## 🎬 Persistencia y Estado Global

### localStorage Key
Clave: `reimbursement_form` (configurable via `VITE_STORAGE_KEY`)

### Estructura Guardada
```javascript
{
  "reimbursement_form": {
    "step": 3,
    "formData": {
      "firstName": "Juan",
      "lastName": "Pérez",
      "rut": "12.345.678-K",
      "email": "juan@email.com",
      "phone": "+56 9 1234 5678",
      "serviceType": "consultas",
      "serviceLabel": "Consultas Médicas",
      // ... otros campos
    },
    "personSelected": true,
    "bankSelected": false,
    "filesMetadata": {
      "receipt": {
        "name": "boleta.pdf",
        "preview": "data:image/png;base64,...",
        "size": "2.5 MB"
      },
      "additional": null
    }
  }
}
```

### Sincronización
- **Guardar**: Cada cambio de campo o selección
- **Restaurar**: Al cargar la app, restaurar paso y datos
- **Limpiar**: Después de envío exitoso

---

## 🎨 Diseño y Estética

### Paleta de Colores (Light Mode Premium)
```css
--color-bg-primary: #f8fafc;        /* Fondo principal (muy claro / gris azulado) */
--color-bg-secondary: #ffffff;      /* Tarjetas y fondos de inputs (Blanco puro) */
--color-primary: #dc2626;           /* Rojo Isapre - acento principal */
--color-text-primary: #0f172a;      /* Texto principal (azul muy oscuro) */
--color-text-secondary: #64748b;    /* Texto secundario - gris azulado */
--color-border: #e2e8f0;            /* Bordes suaves */
--color-error: #ef4444;             /* Error - rojo vibrante */
--color-success: #10b981;           /* Éxito - verde */
```

### Tipografía y Espaciado
```css
--font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--gap-base: 1rem;                   /* 16px */
--border-radius-lg: 24px;           /* Bordes muy redondeados */
--border-radius-xl: 28px;           /* Bordes extra redondeados */
```

### Efectos Visuales
- **Stepper (Barra de Progreso)**:
    - 7 círculos conectados por una **línea horizontal continua**.
    - **Requisito Crítico (Línea Conectora)**: La línea debe pasar por detrás de los círculos y unir el primero con el último. Se debe implementar usando un pseudo-elemento `::before` en el contenedor de los pasos, con `z-index: 0` y posición absoluta a la altura media de los círculos.
    - **Paso Activo**: Círculo rojo vibrante con número blanco y un resplandor (glow) suave alrededor.
    - **Pasos Completados**: Círculo rojo con un check (`✓`) blanco.
    - **Pasos Futuros**: Círculos en azul/gris muy claro con números en gris y bordes sutiles.
    - **Etiquetas**: Texto centrado debajo de cada círculo (Datos, Validación, Servicio, Comprobante, Detalles, Pago, Resumen).
- **Transiciones**: Todos los cambios `transition: all 0.3s ease`

### Componentes UI Comunes

**Tarjeta Seleccionable**:
```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

.card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 24px rgba(220, 38, 38, 0.15);
}

.card.selected {
  border-color: var(--color-primary);
  background: rgba(220, 38, 38, 0.03); /* Tinte rojo muy leve */
}
```

**Input**:
```css
.input {
  background: #f1f5f9;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.input:invalid {
  border-color: var(--color-error);
}
```

**Botón Primario**:
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #b91c1c;
  box-shadow: 0 0 24px rgba(220, 38, 38, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 🧪 Testing (Vitest + React Testing Library)

### Configuración
- **Framework**: Vitest
- **Setup**: `src/test/setup.ts` - Inicializa jsdom + testing-library
- **Incluir**: Archivos `**/*.test.{ts,tsx}`

### Tipos de Tests

**1. Unitarios**:
- Validadores: `validateRUT()`, `validateEmail()`, etc.
- Formateadores: `formatRUT()`, `formatPhone()`, etc.

**2. De Componentes**:
- Rendering correcto
- Validación de inputs
- Selección de tarjetas
- Carga de archivos

**3. De Integración**:
- Flujo completo del formulario (7 pasos)
- Persistencia en localStorage
- Envío a API

### Ejecución
```bash
npm run test        # Ejecutar tests una vez
npm run test:watch  # Modo watch
npm run test:ui     # UI de Vitest
```

---

## 🚀 Scripts NPM

```json
{
  "dev": "vite",                     // Servidor de desarrollo
  "build": "tsc --noEmit && vite build",  // Build para producción
  "lint": "eslint .",                // Lint de todo el código
  "preview": "vite preview",         // Preview de build local
  "test": "vitest run",              // Ejecutar tests
  "test:watch": "vitest",            // Tests en watch mode
  "test:ui": "vitest --ui",          // UI de Vitest
  "prepare": "husky"                 // Configurar Husky
}
```

---

## 🔄 CI/CD (GitHub Actions)

### Flujos Configurados

**1. Testing on PR**:
- Ejecutar linting
- Ejecutar tests
- Build check

**2. Deployment a Firebase**:
- Build
- Deploy a Firebase Hosting (staging/production)
- Notificación de éxito

### Archivos
- `.github/workflows/test.yml` - Testing
- `.github/workflows/deploy.yml` - Deploy
- `firebase.json` - Configuración Firebase

---

## ♿ Accesibilidad (A11y)

### Keyboard Navigation
- ✅ Tab entre inputs y botones
- ✅ Enter para activar/confirmar
- ✅ Espacio para checkboxes/radio
- ✅ Escape para cerrar modales

### ARIA Attributes
```html
<!-- Botones -->
<button role="button" aria-pressed="false" aria-label="Seleccionar consultas médicas">
  Consultas Médicas
</button>

<!-- Inputs -->
<input aria-label="RUT" aria-invalid="false" aria-describedby="rut-error" />
<span id="rut-error" role="alert" class="error">RUT inválido</span>

<!-- Regiones vivas -->
<div role="status" aria-live="polite" aria-atomic="true">
  Paso 3 de 7 - Servicio
</div>
```

### Validación Accessible
- ✅ Mensajes de error en `<span role="alert">`
- ✅ `aria-invalid` en inputs inválidos
- ✅ `aria-describedby` enlazando campos con errores
- ✅ Focus visible en todos los elementos interactivos

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile First
- Diseño móvil como base
- Mejorar progresivamente para pantallas grandes
- Testear en dispositivos reales

---

## 🔄 Flujo de Desarrollo

### 1. Feature Local
```bash
git checkout master
git pull origin master
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios
npm run lint      # Verificar linting
npm run test      # Ejecutar tests
```

### 2. Commit
```bash
git add src/...
git commit -m "feat: descripción clara"  # Husky ejecuta linting
```

### 3. PR a master
```bash
git push origin feature/nueva-funcionalidad
# Abrir PR en GitHub
# CI/CD ejecuta tests automáticamente
```

### 4. Merge
```bash
# Después de review y tests verdes
git merge feature/nueva-funcionalidad
```

### 5. Deploy
```bash
# Automático a Firebase Hosting (staging/production)
```

---

## 🛡️ Mejores Prácticas

### Código
- ✅ TypeScript stricto (tsconfig.json)
- ✅ ESLint en todo el código
- ✅ Componentes funcionales + hooks
- ✅ Validación en cliente Y servidor
- ✅ Manejo de errores explícito

### Seguridad
- ✅ Variables de entorno para URLs/IDs
- ✅ Validación de entrada (RUT, email, teléfono)
- ✅ Validación de archivos (MIME type + tamaño)
- ✅ HTTPS para API calls
- ✅ No almacenar datos sensibles sin encriptar
- ✅ Limpiar datos después de envío exitoso

### Performance
- ✅ Lazy loading de componentes
- ✅ Memoización de componentes pesados
- ✅ Optimizar imágenes/archivos
- ✅ Minificación en build
- ✅ Code splitting automático con Vite

### UX
- ✅ Feedback visual (spinners, toasts)
- ✅ Mensajes de error claros
- ✅ Confirmaciones antes de acciones destructivas
- ✅ Persistencia de progreso
- ✅ Accesibilidad keyboard + screen readers

---

## 📚 Documentación Referencia

- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/)
- [React Testing Library](https://testing-library.com/react)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 📋 Checklist de Nuevas Features

Antes de implementar una nueva funcionalidad:

- [ ] ¿Está documentada en este archivo?
- [ ] ¿Tiene tipos TypeScript adecuados?
- [ ] ¿Incluye validaciones?
- [ ] ¿Es responsive?
- [ ] ¿Es accesible (keyboard + ARIA)?
- [ ] ¿Tiene tests?
- [ ] ¿Linting pasa (`npm run lint`)?
- [ ] ¿Build es exitoso (`npm run build`)?

---

**Última actualización**: Marzo 2026
**Versión**: 1.0.0
**Mantenedor**: David B.
