export const formatPhone = (phone: string): string => {
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
