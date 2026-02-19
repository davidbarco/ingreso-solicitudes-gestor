export const STEPS = [
  "Datos",
  "Validación",
  "Servicio",
  "Comprobante",
  "Detalles",
  "Pago",
  "Resumen"
];

export const FILE_UPLOAD_SKELETON_DELAY_MS = 800;

export const SERVICE_OPTIONS = [
  {
    value: 'consultas',
    label: 'Consultas Médicas',
    icon: 'Stethoscope',
    description: 'Reembolso de bonos y boletas de consultas.',
    disabled: false
  },
  {
    value: 'examenes',
    label: 'Exámenes e Imágenes',
    icon: 'Microscope',
    description: 'Prestaciones de apoyo diagnóstico.',
    disabled: true
  },
  {
    value: 'dental',
    label: 'Dental',
    icon: 'Activity',
    description: 'Servicios dentales.',
    disabled: true
  },
  {
    value: 'optica',
    label: 'Óptica',
    icon: 'Eye',
    description: 'Servicios oftalmológicos.',
    disabled: true
  }
];

export const RECEIPT_OPTIONS = [
  {
    value: 'boletas',
    label: 'Otras Boletas',
    icon: 'Receipt',
    description: 'Boletas de farmacia, insumos o servicios médicos.',
    disabled: false
  },
  {
    value: 'fonasa',
    label: 'Bonos Fonasa',
    icon: 'CreditCard',
    description: 'Documentación electrónica o física.',
    disabled: true
  },
  {
    value: 'isapre',
    label: 'Bonos Isapre',
    icon: 'CreditCard',
    description: 'Documentación electrónica o física.',
    disabled: true
  },
  {
    value: 'ordenes',
    label: 'Órdenes médicas',
    icon: 'FileText',
    description: 'Documentación electrónica o física.',
    disabled: true
  }
];
