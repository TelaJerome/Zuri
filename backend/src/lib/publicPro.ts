// Champs d'une fiche pro jamais envoyés aux clientes ni aux visiteuses :
// le SIRET est facultatif et ne doit faire aucune différence côté public.
export const PRIVATE_PRO_FIELDS = { siret: true, siretVerified: true } as const
