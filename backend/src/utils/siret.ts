// Validation du format SIRET : 14 chiffres avec algorithme de Luhn
export function isValidSiret(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '')
  if (!/^\d{14}$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i])
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}
