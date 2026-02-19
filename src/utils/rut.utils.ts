export const formatRut = (rut: string): string => {
  if (!rut) return "";
  let value = rut.replace(/\D/g, "");
  if (value.length < 2) return value;

  const dv = value.slice(-1);
  const body = value.slice(0, -1);

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
};

export const validateRut = (rut: string | undefined): boolean => {
  if (!rut) return true;
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");
  if (cleanRut.length < 8) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]!) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const dvChar = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();

  return dv === dvChar;
};
