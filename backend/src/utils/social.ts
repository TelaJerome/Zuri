import { z } from 'zod'

// Accepte « pseudo », « @pseudo » ou un lien de profil, et ne garde que le pseudo
function cleanHandle(value: string, host: RegExp) {
  return value
    .trim()
    .replace(host, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
}

// Chaîne vide = réseau retiré
export const instagramSchema = z
  .string()
  .transform((v) => cleanHandle(v, /^(https?:\/\/)?(www\.)?instagram\.com\//i))
  .refine((v) => v === '' || /^[A-Za-z0-9._]{1,30}$/.test(v), 'Pseudo Instagram invalide')

export const snapchatSchema = z
  .string()
  .transform((v) => cleanHandle(v, /^(https?:\/\/)?(www\.)?snapchat\.com\/(add\/)?/i))
  .refine((v) => v === '' || /^[A-Za-z][A-Za-z0-9._-]{2,14}$/.test(v), 'Pseudo Snapchat invalide')

// Ce qu'une pro voit d'une cliente (jamais la fiche complète du compte)
export const CLIENT_FOR_PRO = { id: true, email: true, name: true, instagram: true, snapchat: true } as const
