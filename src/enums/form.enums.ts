export enum ServiceType {
  CONSULTAS = 'consultas',
  EXAMENES = 'examenes',
  DENTAL = 'dental',
  OPTICA = 'optica'
}

export enum ReceiptType {
  BOLETAS = 'boletas',
  FONASA = 'fonasa',
  ISAPRE = 'isapre',
  ORDENES = 'ordenes'
}

export enum FormStep {
  DATOS = 1,
  VALIDACION = 2,
  SERVICIO = 3,
  COMPROBANTE = 4,
  DETALLES = 5,
  PAGO = 6,
  RESUMEN = 7
}

export enum FileKey {
  RECEIPT = 'receipt',
  ADDITIONAL = 'additional'
}
