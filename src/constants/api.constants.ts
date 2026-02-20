export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
export const STORAGE_KEY =
  import.meta.env.VITE_STORAGE_KEY || "reimbursement_form";
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const TIPOLOGY_CODE =
  import.meta.env.VITE_TIPOLOGY_CODE || "REEMBOLSO-CONSULTAMEDICA";
