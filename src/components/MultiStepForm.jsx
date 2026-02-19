import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Stethoscope, 
  Microscope, 
  Activity,
  Eye,
  Receipt, 
  FileText, 
  CreditCard, 
  Camera, 
  Plus, 
  Building2, 
  Send,
  Loader2,
  AlertCircle,
  Info,
  Mail,
  Phone,
  Pencil
} from 'lucide-react';
import FormInput from './FormInput';

const formatRut = (rut) => {
  if (!rut) return "";
  let value = rut.replace(/\D/g, "");
  if (value.length < 2) return value;
  
  const dv = value.slice(-1);
  const body = value.slice(0, -1);
  
  let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
};

const formatPhone = (phone) => {
  if (!phone) return "+56 9 ";
  let value = phone.replace(/\D/g, "");
  if (value.startsWith("569")) {
    value = value.slice(3);
  } else if (value.startsWith("9")) {
    value = value.slice(1);
  }
  
  const part1 = value.slice(0, 4);
  const part2 = value.slice(4, 8);
  
  let res = "+56 9 ";
  if (part1) res += part1;
  if (part2) res += " " + part2;
  return res;
};

const validateRut = (rut) => {
  if (!rut) return true;
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");
  if (cleanRut.length < 8) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const dvChar = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();

  return dv === dvChar;
};

const MultiStepForm = () => {
  // Estabilizamos la carga inicial para evitar bucles
  const [initialSaved] = useState(() => {
    const saved = localStorage.getItem('reimbursement_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { return null; }
    }
    return null;
  });

  const [step, setStep] = useState(initialSaved?.step || 1);
  const [formData, setFormData] = useState(initialSaved?.formData || {});
  const [files, setFiles] = useState(initialSaved?.filesMetadata || { receipt: null, additional: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankSelected, setBankSelected] = useState(initialSaved?.bankSelected || false);
  const [personSelected, setPersonSelected] = useState(initialSaved?.personSelected || false);
  const [isFileLoading, setIsFileLoading] = useState({ receipt: false, additional: false });
  const receiptInputRef = useRef(null);
  const additionalInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    mode: "onBlur",
    defaultValues: initialSaved?.formData || {}
  });

  const watchedFields = watch();
  const watchedFieldsString = JSON.stringify(watchedFields);

  // Sync watched fields to formData con protección contra bucles
  useEffect(() => {
    setFormData(prev => {
      const next = { ...prev, ...watchedFields };
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [watchedFieldsString, watchedFields]);

  // Persistence logic: Save to localStorage
  useEffect(() => {
    const filesMetadata = {
      receipt: files.receipt ? { 
        name: files.receipt.name, 
        size: files.receipt.size, 
        preview: files.receipt.preview // Guardamos el Base64 directamente
      } : null,
      additional: files.additional ? { 
        name: files.additional.name, 
        size: files.additional.size, 
        preview: files.additional.preview 
      } : null
    };

    try {
      localStorage.setItem('reimbursement_form', JSON.stringify({
        formData,
        step,
        bankSelected,
        personSelected,
        filesMetadata
      }));
    } catch {
      console.warn("LocalStorage limit reached. Images might be too large to persist across reloads.");
    }
  }, [formData, step, bankSelected, personSelected, files]);

  // Handle initial hydration (solo una vez al montar)
  useEffect(() => {
    if (initialSaved?.formData) {
      reset(initialSaved.formData);
    }
  }, [reset, initialSaved?.formData]); 

  // REHIDRATACIÓN: Convierte el Base64 de vuelta a objeto File para poder enviarlo
  useEffect(() => {
    const rehydrateFiles = async () => {
      if (!initialSaved?.filesMetadata) return;
      
      const metadata = initialSaved.filesMetadata;
      const updatedFiles = { receipt: null, additional: null };
      let hasUpdates = false;

      const restore = async (key) => {
        if (metadata[key]?.preview?.startsWith('data:')) {
          try {
            const res = await fetch(metadata[key].preview);
            const blob = await res.blob();
            updatedFiles[key] = {
              ...metadata[key],
              file: new File([blob], metadata[key].name, { type: blob.type })
            };
            hasUpdates = true;
          } catch (err) {
            console.error("Error al recuperar archivo:", err);
          }
        }
      };

      await restore('receipt');
      await restore('additional');
      if (hasUpdates) {
        setFiles(prev => ({ ...prev, ...updatedFiles }));
      }
    };

    rehydrateFiles();
  }, [initialSaved]); // Usamos initialSaved como dependencia estable
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validaciones
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("Formato no permitido. Por favor usa JPG, PNG o PDF.");
        setShowErrorModal(true);
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        setErrorMessage("El archivo es demasiado grande. El máximo permitido es 5 MB.");
        setShowErrorModal(true);
        e.target.value = '';
        return;
      }

      setIsFileLoading(prev => ({ ...prev, [type]: true }));
      
      const fileSizeFormatted = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      // Convertir a Base64 para persistencia
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        
        // Simular carga con skeleton
        setTimeout(() => {
          setFiles(prev => ({ 
            ...prev, 
            [type]: { 
              file, 
              name: file.name, 
              preview: base64Data, 
              size: fileSizeFormatted 
            } 
          }));
          setIsFileLoading(prev => ({ ...prev, [type]: false }));
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (finalData) => {
    // Usamos formData como base y mezclamos con finalData (que suele estar vacío en el paso 7)
    const fullData = { ...formData, ...finalData };
    console.log("Submitting full form data:", fullData);
    
    // Preparar el objeto request según la estructura de Postman
    const requestBody = {
      tipologyCode: "REEMBOLSO-CONSULTAMEDICA",
      comment: `Solicitud de Reembolso - ${fullData.serviceLabel}`,
      rutRequester: fullData.rut,
      contactEmail: fullData.email,
      createdBy: `${fullData.firstName || ''} ${fullData.lastName || ''}`.trim(),
      data: {
        nationalId: "11223344-K",
        prestador: "isapre prueba",
        tipoSolicitud: fullData.serviceLabel,
        montoSolicitado: `$${fullData.amount}`,
        diagnosticoIngresado: fullData.serviceLabel,
        descripcion: `Reembolso por ${fullData.serviceLabel || 'Servicio'} - Documento N° ${fullData.receiptNumber}`,
        fechaPrestacion: fullData.date,
        folioColilla: fullData.receiptNumber,
        folioPam: fullData.receiptNumber,
        rutMedico: fullData.docRut,
        rutCentro: fullData.centerRut,
        numeroBoleta: `$${fullData.receiptNumber}`
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

    setIsSubmitting(true);
    try {
      const response = await fetch('https://qa.api.gestor.seiza-ti.cl/request?client-id=4b9b9ab5b734408d915ec31751bbf114', {
        method: 'POST',
        body: apiBody
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      // Intentar parsear JSON, pero manejar si viene vacío
      let result = {};
      const text = await response.text();
      if (text) {
        try {
          result = JSON.parse(text);
          console.log("Success:", result);
        } catch {
          console.warn("Response body is not JSON:", text);
        }
      }
      
      // Mostrar el modal de éxito
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Submission failed:", error);
      setErrorMessage("Hubo un error al enviar la solicitud al servidor. Por favor, intenta nuevamente.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    "Datos",
    "Validación",
    "Servicio",
    "Comprobante",
    "Detalles",
    "Pago",
    "Resumen"
  ];

  // --- RENDERING HELPERS ---

  const renderStepHeader = () => (
    <div className="steps-container">
      {steps.map((label, index) => (
        <div 
          key={index} 
          className={`step-item ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'completed' : ''}`}
        >
          <div className="step-number">
            {step > index + 1 ? <Check size={16} /> : index + 1}
          </div>
          <span className="step-label">{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="multi-step-wrapper">
      {renderStepHeader()}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.85)', 
              zIndex: 1000, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ 
                background: 'var(--bg-card)', 
                width: '100%', 
                maxWidth: '420px', 
                borderRadius: '28px', 
                border: '1px solid var(--border)',
                padding: '3rem 2rem',
                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.4)',
                textAlign: 'center',
                margin: '1rem'
              }}
            >
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: '#22c55e', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <Check size={32} strokeWidth={2.5} />
              </div>

              <h2 style={{ 
                fontSize: '1.5rem', 
                color: 'var(--text-main)', 
                fontWeight: '700', 
                marginBottom: '0.75rem', 
                lineHeight: '1.2' 
              }}>
                ¡Solicitud enviada con éxito!
              </h2>
              
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.95rem', 
                marginBottom: '2rem',
                lineHeight: '1.5'
              }}>
                Tu reembolso ha sido ingresado correctamente y está siendo procesado por nuestro equipo.
              </p>

              <button 
                style={{ 
                  width: '100%', 
                  padding: '1rem',
                  fontSize: '1rem'
                }}
                onClick={() => {
                  localStorage.removeItem('reimbursement_form');
                  window.location.reload(); 
                }}
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.85)', 
              zIndex: 1100, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{ 
                background: 'var(--bg-card)', 
                width: '100%', 
                maxWidth: '500px', 
                borderRadius: '24px', 
                border: '1px solid var(--border)',
                padding: '2rem 1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                margin: '1rem'
              }}
            >
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem'
              }}>
                <AlertCircle size={32} />
              </div>
              
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: '700', marginBottom: '1rem' }}>
                Atención
              </h2>
              
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                {errorMessage}
              </p>

              <button 
                style={{ width: '100%', padding: '1rem', background: '#ef4444', border: 'none' }}
                onClick={() => setShowErrorModal(false)}
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
        >
          {/* STEP 1: Personal Data */}
          {step === 1 && (
            <form onSubmit={handleSubmit(nextStep)}>
              <h2 style={{ marginBottom: '1.5rem' }}>Datos Personales</h2>
              <div className="responsive-grid grid-2">
                <FormInput
                  label="Nombre"
                  name="firstName"
                  placeholder="Tu nombre"
                  register={register}
                  errors={errors}
                  validation={{ required: "Campo obligatorio" }}
                />
                <FormInput
                  label="Apellido"
                  name="lastName"
                  placeholder="Tu apellido"
                  register={register}
                  errors={errors}
                  validation={{ required: "Campo obligatorio" }}
                />
              </div>
              <FormInput
                label="RUT"
                name="rut"
                placeholder="12.345.678-9"
                register={register}
                errors={errors}
                validation={{ 
                  required: "El RUT es obligatorio",
                  validate: (v) => validateRut(v) || "El RUT ingresado no es válido"
                }}
                onChange={(e) => {
                  const formatted = formatRut(e.target.value);
                  setValue('rut', formatted, { shouldValidate: true });
                }}
              />
              <FormInput
                label="Correo"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                register={register}
                errors={errors}
                validation={{ 
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Dirección de correo inválida"
                  }
                }}
              />
              <FormInput
                label="Teléfono"
                name="phone"
                placeholder="+56 9 1234 5678"
                register={register}
                errors={errors}
                validation={{ 
                  required: "El teléfono es obligatorio",
                  pattern: {
                    value: /^\+56\s?9\s?\d{4}\s?\d{4}$/,
                    message: "Formato inválido (+56 9 XXXX XXXX)"
                  }
                }}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setValue('phone', formatted, { shouldValidate: true });
                }}
              />
              <div className="form-actions">
                <button type="submit" aria-label="Continuar al siguiente paso">
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Validation Card */}
          {step === 2 && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Selecciona a la persona que recibió la atención</h2>
              <p style={{ marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Tu solicitud de reembolso será resuelta en hasta 7 días hábiles. En el caso de prestaciones hospitalarias, el plazo puede extenderse hasta 20 días hábiles.
              </p>
              
              <div 
                role="button"
                tabIndex="0"
                aria-pressed={personSelected}
                aria-label={`Seleccionar a ${formData.firstName} ${formData.lastName} como beneficiario`}
                className={`selectable-card ${personSelected ? 'selected' : ''}`} 
                onClick={() => setPersonSelected(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPersonSelected(true);
                  }
                }}
                style={{ 
                  maxWidth: '400px', 
                  margin: '0 auto',
                  border: personSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <div className="icon-wrapper">
                  <User size={24} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{formData.firstName} {formData.lastName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formData.rut}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formData.email}</p>
                </div>
                <div className="badge">Titular</div>
                
                {personSelected ? (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    color: 'var(--primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px',
                    fontWeight: '600'
                  }}>
                    <Check size={18} /> Seleccionado
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="secondary"
                    style={{ marginTop: '1.5rem', width: '100%', pointerEvents: 'none' }}
                  >
                    Hacer clic para seleccionar
                  </button>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={prevStep}>
                  <ChevronLeft size={18} /> Volver
                </button>
                <button 
                  type="button" 
                  onClick={() => nextStep({})} 
                  disabled={!personSelected}
                  style={{
                    opacity: personSelected ? 1 : 0.5,
                    cursor: personSelected ? 'pointer' : 'not-allowed'
                  }}
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Service Selection */}
          {step === 3 && (
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Tipo de Servicio</h2>
              <p style={{ marginBottom: '2rem' }}>Selecciona el tipo de atención médica recibida.</p>
              
              <div className="grid-cards">
                <div 
                  role="button"
                  tabIndex="0"
                  aria-pressed={formData.serviceType === 'consultas'}
                  aria-label="Seleccionar Consultas Médicas"
                  className={`selectable-card ${formData.serviceType === 'consultas' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, serviceType: 'consultas', serviceLabel: 'Consultas Médicas' }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFormData(prev => ({ ...prev, serviceType: 'consultas', serviceLabel: 'Consultas Médicas' }));
                    }
                  }}
                >
                  <div className="icon-wrapper">
                    <Stethoscope size={32} />
                  </div>
                  <h3>Consultas Médicas</h3>
                  <p>Reembolso de bonos y boletas de consultas.</p>
                  {formData.serviceType === 'consultas' && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={16} /> Seleccionado
                    </div>
                  )}
                </div>

                {['Exámenes e Imágenes', 'Dental', 'Óptica'].map((item) => (
                  <div 
                    key={item} 
                    className="selectable-card disabled"
                    role="button"
                    tabIndex="-1"
                    aria-disabled="true"
                    aria-label={`${item} (Próximamente)`}
                  >
                    <div className="badge">Próximamente</div>
                    <div className="icon-wrapper">
                      {item === 'Dental' ? <Activity size={32} /> : item === 'Óptica' ? <Eye size={32} /> : <Microscope size={32} />}
                    </div>
                    <h3>{item}</h3>
                    <p>Prestaciones de apoyo diagnóstico.</p>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={prevStep}>
                  <ChevronLeft size={18} /> Volver
                </button>
                <button 
                  type="button" 
                  onClick={() => nextStep({})} 
                  disabled={!formData.serviceType}
                  style={{
                    opacity: formData.serviceType ? 1 : 0.5,
                    cursor: formData.serviceType ? 'pointer' : 'not-allowed'
                  }}
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Receipt Type */}
          {step === 4 && (
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Tipo de Comprobante</h2>
              <p style={{ marginBottom: '2rem' }}>Indica el documento que adjuntarás para el reembolso.</p>
              
              <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div 
                  role="button"
                  tabIndex="0"
                  aria-pressed={formData.receiptType === 'boletas'}
                  aria-label="Seleccionar Otras Boletas"
                  className={`selectable-card ${formData.receiptType === 'boletas' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, receiptType: 'boletas', receiptLabel: 'Otras Boletas' }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFormData(prev => ({ ...prev, receiptType: 'boletas', receiptLabel: 'Otras Boletas' }));
                    }
                  }}
                >
                  <div className="icon-wrapper">
                    <Receipt size={32} />
                  </div>
                  <h3>Otras Boletas</h3>
                  <p>Boletas de farmacia, insumos o servicios médicos.</p>
                  {formData.receiptType === 'boletas' && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={16} /> Seleccionado
                    </div>
                  )}
                </div>

                {['Bonos Fonasa', 'Bonos Isapre', 'Órdenes médicas'].map((item) => (
                  <div 
                    key={item} 
                    className="selectable-card disabled"
                    role="button"
                    tabIndex="-1"
                    aria-disabled="true"
                    aria-label={`${item} (Próximamente)`}
                  >
                    <div className="badge">Próximamente</div>
                    <div className="icon-wrapper">
                      {item === 'Órdenes médicas' ? <FileText size={32} /> : <CreditCard size={32} />}
                    </div>
                    <h3>{item}</h3>
                    <p>Documentación electrónica o física.</p>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={prevStep}>
                  <ChevronLeft size={18} /> Volver
                </button>
                <button 
                  type="button" 
                  onClick={() => nextStep({})} 
                  disabled={!formData.receiptType}
                  style={{
                    opacity: formData.receiptType ? 1 : 0.5,
                    cursor: formData.receiptType ? 'pointer' : 'not-allowed'
                  }}
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Details & Upload */}
          {step === 5 && (
            <form onSubmit={handleSubmit((data) => {
              if (!files.receipt) {
                setErrorMessage("La foto de la boleta es obligatoria para continuar con el reembolso.");
                setShowErrorModal(true);
                return;
              }
              nextStep(data);
            })}>
              <h2 style={{ marginBottom: '1.5rem' }}>Detalles de la Boleta</h2>
              
              <div className="responsive-grid grid-2">
                <FormInput
                  label="RUT Médico"
                  name="docRut"
                  placeholder="12.345.678-9"
                  register={register}
                  errors={errors}
                  validation={{ 
                    required: "RUT médico requerido",
                    validate: (v) => validateRut(v) || "RUT inválido"
                  }}
                />
                <FormInput
                  label="RUT Centro Médico"
                  name="centerRut"
                  placeholder="76.000.000-0"
                  register={register}
                  errors={errors}
                  validation={{ 
                    required: "RUT centro requerido",
                    validate: (v) => validateRut(v) || "RUT inválido"
                  }}
                />
              </div>

              <div className="responsive-grid grid-3">
                <FormInput
                  label="Monto"
                  name="amount"
                  type="number"
                  placeholder="$ 0"
                  register={register}
                  errors={errors}
                  validation={{ required: "Monto requerido", min: { value: 1, message: "Monto debe ser mayor a 0" } }}
                />
                <FormInput
                  label="Fecha"
                  name="date"
                  type="date"
                  register={register}
                  errors={errors}
                  validation={{ required: "Fecha requerida" }}
                />
                <FormInput
                  label="N° Boleta"
                  name="receiptNumber"
                  placeholder="12345"
                  register={register}
                  errors={errors}
                  validation={{ required: "N° requerido" }}
                />
              </div>

              {/* Información sobre carga de archivos */}
              <div style={{ 
                background: 'rgba(220, 38, 38, 0.05)', 
                border: '1px solid rgba(220, 38, 38, 0.1)', 
                borderRadius: '16px', 
                padding: '1.25rem', 
                marginTop: '1.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  background: 'rgba(220, 38, 38, 0.1)', 
                  color: 'var(--primary)', 
                  padding: '8px', 
                  borderRadius: '10px',
                  display: 'flex'
                }}>
                  <Info size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Adjunta solo una boleta por solicitud
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Todos los documentos que cargues deben tener las siguientes cualidades:
                  </p>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '0.6rem 1.5rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} /> Imagen Limpia
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} /> Solo imagen de la boleta
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} /> Imagen de frente y no de perspectiva
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} /> Buena iluminación
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} /> Datos del médico legibles
                    </div>
                  </div>
                </div>
              </div>

              <div className="responsive-grid grid-2" style={{ marginTop: '1.5rem' }}>
                {/* Receipt Upload */}
                <div 
                  className="upload-card" 
                  onClick={() => receiptInputRef.current.click()}
                  role="button"
                  tabIndex="0"
                  aria-label="Subir foto de la boleta (Obligatorio)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      receiptInputRef.current.click();
                    }
                  }}
                >
                  <input 
                    type="file" 
                    hidden 
                    ref={receiptInputRef} 
                    onChange={(e) => handleFileChange(e, 'receipt')}
                    accept="image/*,application/pdf"
                  />
                  <div className="icon-circle">
                    <Camera size={24} />
                  </div>
                  {isFileLoading.receipt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                      <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0 }}></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                        <div className="shimmer" style={{ width: '60%', height: '14px', borderRadius: '4px' }}></div>
                        <div className="shimmer" style={{ width: '40%', height: '10px', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {files.receipt?.preview && (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                          <img src={files.receipt.preview} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '0.9rem' }}>{files.receipt ? 'Boleta Cargada' : <>Foto de Boleta <span style={{ color: '#ef4444' }}>*</span></>}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {files.receipt ? `${files.receipt.name} (${files.receipt.size})` : 'JPG/PNG/PDF. Máximo 5 mb.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Upload */}
                <div 
                  className="upload-card" 
                  onClick={() => additionalInputRef.current.click()}
                  role="button"
                  tabIndex="0"
                  aria-label="Subir documento adicional (Opcional)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      additionalInputRef.current.click();
                    }
                  }}
                >
                  <input 
                    type="file" 
                    hidden 
                    ref={additionalInputRef} 
                    onChange={(e) => handleFileChange(e, 'additional')}
                    accept="image/*,application/pdf"
                  />
                  <div className="icon-circle">
                    <Plus size={24} />
                  </div>
                  {isFileLoading.additional ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                      <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0 }}></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                        <div className="shimmer" style={{ width: '60%', height: '14px', borderRadius: '4px' }}></div>
                        <div className="shimmer" style={{ width: '40%', height: '10px', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {files.additional?.preview && (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                          <img src={files.additional.preview} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '0.9rem' }}>{files.additional ? 'Doc. Adicional' : 'Foto Adicional'}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {files.additional ? `${files.additional.name} (${files.additional.size})` : 'JPG/PNG/PDF. Máximo 5 mb.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={prevStep}>
                  <ChevronLeft size={18} /> Volver
                </button>
                <button type="submit">
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 6: Bank Info */}
          {step === 6 && (
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Selecciona la cuenta de destino del reembolso</h2>
              <p style={{ marginBottom: '2rem' }}>Los fondos serán depositados en la siguiente cuenta:</p>
              
              <div 
                className={`selectable-card ${bankSelected ? 'selected' : ''}`} 
                onClick={() => setBankSelected(true)}
                role="button"
                tabIndex="0"
                aria-pressed={bankSelected}
                aria-label="Seleccionar cuenta bancaria del Banco Santander Chile"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setBankSelected(true);
                  }
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: bankSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                  padding: '2.5rem 2rem',
                  borderRadius: '24px',
                  boxShadow: bankSelected ? '0 25px 50px -12px rgba(220, 38, 38, 0.4)' : '0 15px 30px -5px rgba(0, 0, 0, 0.15)',
                  maxWidth: '450px',
                  margin: '0 auto',
                  cursor: 'pointer',
                  textAlign: 'left',
                  alignItems: 'stretch',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2 }}>
                  <Building2 size={120} />
                </div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                    <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Banco Santander</h3>
                    <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Chile</div>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', display: 'block' }}>Titular</label>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Pedro Gonzalez</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', display: 'block' }}>Cuenta Corriente</label>
                      <span style={{ fontSize: '1rem', letterSpacing: '2px' }}>0 000 47 90856-0</span>
                    </div>
                  </div>

                  {bankSelected ? (
                    <div style={{ 
                      marginTop: '2rem', 
                      background: '#ffffff', 
                      color: 'var(--primary)',
                      borderRadius: '14px', 
                      padding: '1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '10px',
                      fontWeight: '700',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <Check size={22} strokeWidth={3} /> Cuenta Seleccionada
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '1.5rem', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '12px', 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      border: '1px dashed rgba(255,255,255,0.3)'
                    }}>
                      Hacer clic para seleccionar cuenta
                    </div>
                  )}
                </div>
              </div>
              
              <div className="responsive-grid grid-2" style={{ marginTop: '2rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Correo electrónico</label>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '12px', 
                    padding: '0.75rem 1rem',
                    gap: '0.75rem'
                  }}>
                    <Mail size={18} color="var(--text-muted)" />
                    <input 
                      disabled 
                      value="pedro.gonzalez@gmail.com" 
                      style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <Pencil size={14} color="var(--primary)" style={{ opacity: 0.5 }} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Teléfono celular</label>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '12px', 
                    padding: '0.75rem 1rem',
                    gap: '0.75rem'
                  }}>
                    <Phone size={18} color="var(--text-muted)" />
                    <input 
                      disabled 
                      value="967047364" 
                      style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <Pencil size={14} color="var(--primary)" style={{ opacity: 0.5 }} />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={prevStep}>
                  <ChevronLeft size={18} /> Volver
                </button>
                <button 
                  type="button" 
                  onClick={() => nextStep({})} 
                  disabled={!bankSelected}
                  style={{
                    opacity: bankSelected ? 1 : 0.5,
                    cursor: bankSelected ? 'pointer' : 'not-allowed'
                  }}
                >
                  Resumen <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Summary & Finish */}
          {step === 7 && (
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Resumen de Solicitud</h2>
              <p style={{ marginBottom: '2rem' }}>Verifica que todos los datos sean correctos antes de enviar.</p>
              
              <div className="summary-container">
                <div className="summary-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Información Personal</h4>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="secondary" 
                      style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
                      aria-label="Editar información personal"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>Nombre Completo</label>
                      <span>{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="summary-item">
                      <label>RUT</label>
                      <span>{formData.rut}</span>
                    </div>
                    <div className="summary-item">
                      <label>Email</label>
                      <span>{formData.email}</span>
                    </div>
                    <div className="summary-item">
                      <label>Teléfono</label>
                      <span>{formData.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Atención y Pago</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setStep(3)} 
                        className="secondary" 
                        style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
                        aria-label="Editar tipo de servicio"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>Tipo de Servicio</label>
                      <span>{formData.serviceLabel}</span>
                    </div>
                    <div className="summary-item">
                      <label>Comprobante</label>
                      <span>{formData.receiptLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Datos de la Boleta</h4>
                    <button 
                      type="button" 
                      onClick={() => setStep(5)} 
                      className="secondary" 
                      style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
                      aria-label="Editar datos de la boleta"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>Monto</label>
                      <span>$ {formData.amount}</span>
                    </div>
                    <div className="summary-item">
                      <label>N° Boleta</label>
                      <span>{formData.receiptNumber}</span>
                    </div>
                    <div className="summary-item">
                      <label>RUT Médico</label>
                      <span>{formData.docRut}</span>
                    </div>
                    <div className="summary-item">
                      <label>RUT Centro</label>
                      <span>{formData.centerRut}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-group">
                  <h4>Documentos Cargados</h4>
                  <div className="summary-grid">
                    <div className="summary-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {files.receipt?.preview ? (
                          <img src={files.receipt.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Camera size={20} color="var(--text-muted)" />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Boleta</label>
                        <span>{files.receipt?.name} ({files.receipt?.size})</span>
                      </div>
                    </div>
                    {files.additional && (
                      <div className="summary-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {files.additional.preview ? (
                            <img src={files.additional.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <FileText size={20} color="var(--text-muted)" />
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label>Doc. Adicional</label>
                          <span>{files.additional.name} ({files.additional.size})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="summary-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Datos de depósito</h4>
                    <button 
                      type="button" 
                      onClick={() => setStep(6)} 
                      className="secondary" 
                      style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
                      aria-label="Editar datos de depósito"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>Titular</label>
                      <span>Pedro Gonzalez</span>
                    </div>
                    <div className="summary-item">
                      <label>Banco</label>
                      <span>Banco Santander Chile</span>
                    </div>
                    <div className="summary-item">
                      <label>Cuenta</label>
                      <span>Cuenta Corriente</span>
                    </div>
                    <div className="summary-item">
                      <label>Número</label>
                      <span>0 000 47 90856-0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={prevStep}>
                  <ChevronLeft size={18} /> Volver
                </button>
                <button 
                  type="button" 
                  onClick={handleSubmit(onSubmit)} 
                  disabled={isSubmitting}
                  style={{ background: 'var(--primary-hover)', paddingLeft: '2.5rem', paddingRight: '2.5rem', minWidth: '180px' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spinner" /> 
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Confirmar y Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={{ 
        marginTop: '3.5rem', 
        paddingTop: '2rem',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>
          Paso {step} de {steps.length} — {steps[step - 1]}
        </p>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          © {new Date().getFullYear()} Plataforma de Gestión de Reembolsos
        </p>
      </div>
    </div>
  );
};

export default MultiStepForm;
