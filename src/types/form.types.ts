export interface FormFields {
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone: string;
  docRut: string;
  centerRut: string;
  amount: string;
  date: string;
  receiptNumber: string;
  serviceType?: string;
  serviceLabel?: string;
  receiptType?: string;
  receiptLabel?: string;
  [key: string]: string | undefined;
}

export interface FileEntry {
  file?: File;
  name: string;
  preview: string;
  size: string;
}

export interface FilesState {
  receipt: FileEntry | null;
  additional: FileEntry | null;
}

export interface SavedState {
  formData?: Partial<FormFields>;
  step?: number;
  bankSelected?: boolean;
  personSelected?: boolean;
  filesMetadata?: FilesState;
}

export interface RequestBodyData {
  nationalId: string;
  prestador: string;
  tipoSolicitud: string;
  montoSolicitado: string;
  diagnosticoIngresado: string;
  descripcion: string;
  fechaPrestacion: string;
  folioColilla: string;
  folioPam: string;
  rutMedico: string;
  rutCentro: string;
  numeroBoleta: string;
}

export interface RequestBody {
  tipologyCode: string;
  comment: string;
  rutRequester: string;
  contactEmail: string;
  createdBy: string;
  data: RequestBodyData;
}
