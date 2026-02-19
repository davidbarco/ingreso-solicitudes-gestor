import { useState, useRef, useEffect, ChangeEvent } from 'react';
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
import { FormFields, FilesState, SavedState } from '../types/form.types';
import { STORAGE_KEY, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../constants/api.constants';
import { STEPS, FILE_UPLOAD_SKELETON_DELAY_MS } from '../constants/form.constants';
import { formatRut, validateRut } from '../utils/rut.utils';
import { formatPhone } from '../utils/phone.utils';
import { formatFileSize } from '../utils/file.utils';
import { submitReimbursementRequest } from '../services/request.service';

const MultiStepForm = () => {
  // Estabilizamos la carga inicial para evitar bucles
  const [initialSaved] = useState<SavedState | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as SavedState;
      } catch { return null; }
    }
    return null;
  });

  const [step, setStep] = useState<number>(initialSaved?.step ?? 1);
  const [formData, setFormData] = useState<Partial<FormFields>>(initialSaved?.formData ?? {});
  const [files, setFiles] = useState<FilesState>(initialSaved?.filesMetadata ?? { receipt: null, additional: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankSelected, setBankSelected] = useState(initialSaved?.bankSelected ?? false);
  const [personSelected, setPersonSelected] = useState(initialSaved?.personSelected ?? false);
  const [isFileLoading, setIsFileLoading] = useState<Record<string, boolean>>({ receipt: false, additional: false });
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<FormFields>({
    mode: "onBlur",
    defaultValues: (initialSaved?.formData ?? {}) as FormFields
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
    const filesMetadata: FilesState = {
      receipt: files.receipt ? {
        name: files.receipt.name,
        size: files.receipt.size,
        preview: files.receipt.preview
      } : null,
      additional: files.additional ? {
        name: files.additional.name,
        size: files.additional.size,
        preview: files.additional.preview
      } : null
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
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
      reset(initialSaved.formData as FormFields);
    }
  }, [reset, initialSaved?.formData]);

  // REHIDRATACIÓN: Convierte el Base64 de vuelta a objeto File para poder enviarlo
  useEffect(() => {
    const rehydrateFiles = async () => {
      if (!initialSaved?.filesMetadata) return;

      const metadata = initialSaved.filesMetadata;
      const updatedFiles: FilesState = { receipt: null, additional: null };
      let hasUpdates = false;

      const restore = async (key: keyof FilesState) => {
        if (metadata[key]?.preview?.startsWith('data:')) {
          try {
            const res = await fetch(metadata[key]!.preview);
            const blob = await res.blob();
            updatedFiles[key] = {
              ...metadata[key]!,
              file: new File([blob], metadata[key]!.name, { type: blob.type })
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: keyof FilesState) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validaciones
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setErrorMessage("Formato no permitido. Por favor usa JPG, PNG o PDF.");
        setShowErrorModal(true);
        e.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage("El archivo es demasiado grande. El máximo permitido es 5 MB.");
        setShowErrorModal(true);
        e.target.value = '';
        return;
      }

      setIsFileLoading(prev => ({ ...prev, [type]: true }));

      const fileSizeFormatted = formatFileSize(file.size);

      // Convertir a Base64 para persistencia
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;

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
        }, FILE_UPLOAD_SKELETON_DELAY_MS);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = (data: Partial<FormFields>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (finalData: Partial<FormFields>) => {
    // Usamos formData como base y mezclamos con finalData (que suele estar vacío en el paso 7)
    const fullData = { ...formData, ...finalData };
    console.log("Submitting full form data:", fullData);

    setIsSubmitting(true);
    try {
      await submitReimbursementRequest(fullData, files);
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

  // --- RENDERING HELPERS ---

  const renderStepHeader = () => (
    <div className="steps-container">
      {STEPS.map((label, index) => (
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
            className="fixed inset-0 bg-black/85 z-1000 flex items-center justify-center p-8 backdrop-blur-10"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-(--bg-card) w-full max-w-[420px] rounded-[28px] border border-(--border) p-12 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] text-center m-4"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 mx-auto mb-6">
                <Check size={32} strokeWidth={2.5} />
              </div>

              <h2 className="text-2xl font-bold text-(--text-main) mb-3 leading-tight">
                ¡Solicitud enviada con éxito!
              </h2>

              <p className="text-(--text-muted) text-sm mb-8 leading-relaxed">
                Tu reembolso ha sido ingresado correctamente y está siendo procesado por nuestro equipo.
              </p>

              <button
                className="w-full p-4 text-base"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
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
            className="fixed inset-0 bg-black/85 z-1100 flex items-center justify-center p-8 backdrop-blur-10"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-(--bg-card) w-full max-w-[500px] rounded-[24px] border border-(--border) p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-center m-4"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>

              <h2 className="text-2xl font-bold text-(--text-main) mb-4">
                Atención
              </h2>

              <p className="text-(--text-muted) mb-8 leading-relaxed">
                {errorMessage}
              </p>

              <button
                className="w-full p-4 bg-red-500 border-none text-white"
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
              <h2 className="mb-6">Datos Personales</h2>
              <div className="responsive-grid grid-2">
                <FormInput<FormFields>
                  label="Nombre"
                  name="firstName"
                  placeholder="Tu nombre"
                  register={register}
                  errors={errors}
                  validation={{ required: "Campo obligatorio" }}
                />
                <FormInput<FormFields>
                  label="Apellido"
                  name="lastName"
                  placeholder="Tu apellido"
                  register={register}
                  errors={errors}
                  validation={{ required: "Campo obligatorio" }}
                />
              </div>
              <FormInput<FormFields>
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
              <FormInput<FormFields>
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
              <FormInput<FormFields>
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
              <h2 className="mb-4">Selecciona a la persona que recibió la atención</h2>
              <p className="text-(--text-muted) text-sm leading-relaxed mb-8">
                Tu solicitud de reembolso será resuelta en hasta 7 días hábiles. En el caso de prestaciones hospitalarias, el plazo puede extenderse hasta 20 días hábiles.
              </p>

              <div
                role="button"
                tabIndex={0}
                aria-pressed={personSelected}
                aria-label={`Seleccionar a ${formData.firstName} ${formData.lastName} como beneficiario`}
                className={`selectable-card max-w-[400px] mx-auto relative transition-all duration-300 cursor-pointer ${personSelected ? 'selected' : ''}`}
                onClick={() => setPersonSelected(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPersonSelected(true);
                  }
                }}
              >
                <div className="icon-wrapper">
                  <User size={24} />
                </div>
                <div className="text-center">
                  <h3 className="text-(--text-main) text-xl mb-2">{formData.firstName} {formData.lastName}</h3>
                  <p className="text-(--text-muted) text-sm">{formData.rut}</p>
                  <p className="text-(--text-muted) text-sm">{formData.email}</p>
                </div>
                <div className="badge">Titular</div>

                {personSelected ? (
                  <div className="flex items-center justify-center gap-1 mt-6 text-(--primary) font-semibold">
                    <Check size={18} /> Seleccionado
                  </div>
                ) : (
                  <button
                    type="button"
                    className="secondary mt-6 w-full pointer-events-none"
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
                  className={personSelected ? '' : 'opacity-50 cursor-not-allowed'}
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Service Selection */}
          {step === 3 && (
            <div>
              <h2 className="mb-2">Tipo de Servicio</h2>
              <p className="mb-8">Selecciona el tipo de atención médica recibida.</p>

              <div className="grid-cards">
                <div
                  role="button"
                  tabIndex={0}
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
                    <div className="flex items-center justify-center gap-1 mt-2 text-(--primary) font-semibold">
                      <Check size={16} /> Seleccionado
                    </div>
                  )}
                </div>

                {['Exámenes e Imágenes', 'Dental', 'Óptica'].map((item) => (
                  <div
                    key={item}
                    className="selectable-card disabled"
                    role="button"
                    tabIndex={-1}
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
                  className={formData.serviceType ? '' : 'opacity-50 cursor-not-allowed'}
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Receipt Type */}
          {step === 4 && (
            <div>
              <h2 className="mb-2">Tipo de Comprobante</h2>
              <p className="mb-8">Indica el documento que adjuntarás para el reembolso.</p>

              <div className="grid-cards">
                <div
                  role="button"
                  tabIndex={0}
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
                    <div className="flex items-center justify-center gap-1 mt-2 text-(--primary) font-semibold">
                      <Check size={16} /> Seleccionado
                    </div>
                  )}
                </div>

                {['Bonos Fonasa', 'Bonos Isapre', 'Órdenes médicas'].map((item) => (
                  <div
                    key={item}
                    className="selectable-card disabled"
                    role="button"
                    tabIndex={-1}
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
                  className={formData.receiptType ? '' : 'opacity-50 cursor-not-allowed'}
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
              <h2 className="mb-6">Detalles de la Boleta</h2>

              <div className="responsive-grid grid-2">
                <FormInput<FormFields>
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
                <FormInput<FormFields>
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
                <FormInput<FormFields>
                  label="Monto"
                  name="amount"
                  type="number"
                  placeholder="$ 0"
                  register={register}
                  errors={errors}
                  validation={{ required: "Monto requerido", min: { value: 1, message: "Monto debe ser mayor a 0" } }}
                />
                <FormInput<FormFields>
                  label="Fecha"
                  name="date"
                  type="date"
                  register={register}
                  errors={errors}
                  validation={{ required: "Fecha requerida" }}
                />
                <FormInput<FormFields>
                  label="N° Boleta"
                  name="receiptNumber"
                  placeholder="12345"
                  register={register}
                  errors={errors}
                  validation={{ required: "N° requerido" }}
                />
              </div>

              {/* Información sobre carga de archivos */}
              <div className="flex gap-4 items-start rounded-2xl p-5 mt-6 border border-red-500/10 bg-red-500/5">
                <div className="flex p-2 rounded-lg bg-red-500/10 text-(--primary)">
                  <Info size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-(--text-main) mb-2">
                    Adjunta solo una boleta por solicitud
                  </p>
                  <p className="text-xs text-(--text-muted) mb-4">
                    Todos los documentos que cargues deben tener las siguientes cualidades:
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-y-2.5 gap-x-6">
                    <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--primary)" /> Imagen Limpia
                    </div>
                    <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--primary)" /> Solo imagen de la boleta
                    </div>
                    <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--primary)" /> Imagen de frente y no de perspectiva
                    </div>
                    <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--primary)" /> Buena iluminación
                    </div>
                    <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--primary)" /> Datos del médico legibles
                    </div>
                  </div>
                </div>
              </div>

              <div className="responsive-grid grid-2 mt-6">
                {/* Receipt Upload */}
                <div
                  className="upload-card"
                  onClick={() => receiptInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Subir foto de la boleta (Obligatorio)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      receiptInputRef.current?.click();
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
                    <div className="flex items-center gap-4 w-full max-w-[300px]">
                      <div className="shimmer rounded-md shrink-0 w-10 h-10"></div>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="shimmer rounded-sm w-3/5 h-3.5"></div>
                        <div className="shimmer rounded-sm w-2/5 h-2.5"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {files.receipt?.preview && (
                        <div className="w-10 h-10 rounded overflow-hidden border border-(--border) shrink-0 flex items-center justify-center bg-(--bg-input)">
                          <img src={files.receipt.preview} alt="Vista previa" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm">{files.receipt ? 'Boleta Cargada' : <>Foto de Boleta <span className="text-red-500">*</span></>}</h4>
                        <p className="text-xs text-(--text-muted)">
                          {files.receipt ? `${files.receipt.name} (${files.receipt.size})` : 'JPG/PNG/PDF. Máximo 5 mb.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Upload */}
                <div
                  className="upload-card"
                  onClick={() => additionalInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Subir documento adicional (Opcional)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      additionalInputRef.current?.click();
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
                    <div className="flex items-center gap-4 w-full max-w-[300px]">
                      <div className="shimmer rounded-md shrink-0 w-10 h-10"></div>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="shimmer rounded-sm w-3/5 h-3.5"></div>
                        <div className="shimmer rounded-sm w-2/5 h-2.5"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {files.additional?.preview && (
                        <div className="w-10 h-10 rounded overflow-hidden border border-(--border) shrink-0 flex items-center justify-center bg-(--bg-input)">
                          <img src={files.additional.preview} alt="Vista previa" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm">{files.additional ? 'Doc. Adicional' : 'Foto Adicional'}</h4>
                        <p className="text-xs text-(--text-muted)">
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
              <h2 className="mb-2">Selecciona la cuenta de destino del reembolso</h2>
              <p className="mb-8">Los fondos serán depositados en la siguiente cuenta:</p>

              <div
                className={`selectable-card ${bankSelected ? 'selected' : ''}`}
                onClick={() => setBankSelected(true)}
                role="button"
                tabIndex={0}
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

              <div className="responsive-grid grid-2 mt-8">
                <div className="form-group">
                  <label className="text-xs text-(--text-muted) block mb-2">Correo electrónico</label>
                  <div className="flex items-center gap-3 rounded-[12px] p-3 border border-(--border) bg-white/5">
                    <Mail size={18} color="var(--text-muted)" />
                    <input
                      disabled
                      value="pedro.gonzalez@gmail.com"
                      className="w-full bg-none border-none text-(--text-main) outline-none text-sm"
                    />
                    <Pencil size={14} color="var(--primary)" className="opacity-50" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-xs text-(--text-muted) block mb-2">Teléfono celular</label>
                  <div className="flex items-center gap-3 rounded-[12px] p-3 border border-(--border) bg-white/5">
                    <Phone size={18} color="var(--text-muted)" />
                    <input
                      disabled
                      value="967047364"
                      className="w-full bg-none border-none text-(--text-main) outline-none text-sm"
                    />
                    <Pencil size={14} color="var(--primary)" className="opacity-50" />
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
                  className={bankSelected ? '' : 'opacity-50 cursor-not-allowed'}
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
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="m-0">Información Personal</h4>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="secondary p-1 rounded-full w-8 h-8"
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
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="m-0">Atención y Pago</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="secondary p-1 rounded-full w-8 h-8"
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
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="m-0">Datos de la Boleta</h4>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="secondary p-1 rounded-full w-8 h-8"
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
                    <div className="summary-item flex flex-row items-center gap-4">
                      <div className="w-10 h-10 rounded overflow-hidden border border-(--border) shrink-0 bg-(--bg-input) flex items-center justify-center">
                        {files.receipt?.preview ? (
                          <img src={files.receipt.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={20} color="var(--text-muted)" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <label>Boleta</label>
                        <span>{files.receipt?.name} ({files.receipt?.size})</span>
                      </div>
                    </div>
                    {files.additional && (
                      <div className="summary-item flex flex-row items-center gap-4">
                        <div className="w-10 h-10 rounded overflow-hidden border border-(--border) shrink-0 bg-(--bg-input) flex items-center justify-center">
                          {files.additional.preview ? (
                            <img src={files.additional.preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={20} color="var(--text-muted)" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <label>Doc. Adicional</label>
                          <span>{files.additional.name} ({files.additional.size})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="summary-group">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="m-0">Datos de depósito</h4>
                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="secondary p-1 rounded-full w-8 h-8"
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
                  className="bg-(--primary-hover) px-10 min-w-[180px]"
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

      <div className="flex flex-col gap-2 mt-14 pt-8 border-t border-(--border) text-center text-(--text-muted) text-sm">
        <p className="m-0 font-medium text-(--text-main)">
          Paso {step} de {STEPS.length} — {STEPS[step - 1]}
        </p>
        <p className="text-xs opacity-70">
          © {new Date().getFullYear()} Plataforma de Gestión de Reembolsos
        </p>
      </div>
    </div>
  );
};

export default MultiStepForm;
