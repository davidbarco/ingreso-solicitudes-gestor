import { FormFields, FilesState, RequestBody } from '../types/form.types';
import { API_BASE_URL, CLIENT_ID, TIPOLOGY_CODE } from '../constants/api.constants';

export async function submitReimbursementRequest(
  formData: Partial<FormFields>,
  files: FilesState
): Promise<void> {
  // Preparar el objeto request según la estructura de Postman
  const requestBody: RequestBody = {
    tipologyCode: TIPOLOGY_CODE,
    comment: `Solicitud de Reembolso - ${formData.serviceLabel}`,
    rutRequester: formData.rut || '',
    contactEmail: formData.email || '',
    createdBy: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
    data: {
      nationalId: "11223344-K",
      prestador: "isapre prueba",
      tipoSolicitud: formData.serviceLabel || '',
      montoSolicitado: `$${formData.amount}`,
      diagnosticoIngresado: formData.serviceLabel || '',
      descripcion: `Reembolso por ${formData.serviceLabel || 'Servicio'} - Documento N° ${formData.receiptNumber}`,
      fechaPrestacion: formData.date || '',
      folioColilla: formData.receiptNumber || '',
      folioPam: formData.receiptNumber || '',
      rutMedico: formData.docRut || '',
      rutCentro: formData.centerRut || '',
      numeroBoleta: `${formData.receiptNumber}`
    }
  };

  const apiBody = new FormData();
  // Añadir el JSON como string en la llave 'request'
  apiBody.append('request', JSON.stringify(requestBody));

  // Añadir archivos si existen
  if (files.receipt?.file) {
    apiBody.append('document', files.receipt.file);
  }
  if (files.additional?.file) {
    apiBody.append('document', files.additional.file);
  }

  const response = await fetch(`${API_BASE_URL}?client-id=${CLIENT_ID}`, {
    method: 'POST',
    body: apiBody
  });

  if (!response.ok) {
    throw new Error('Error en la respuesta del servidor');
  }

  // Intentar parsear JSON, pero manejar si viene vacío
  const text = await response.text();
  if (text) {
    try {
      const result = JSON.parse(text);
      console.log("Success:", result);
    } catch {
      console.warn("Response body is not JSON:", text);
    }
  }
}
