interface ClientInfo {
  email: string
  name?: string | null
  instagram?: string | null
  snapchat?: string | null
}

// Nom de la cliente (ou son email pour les comptes créés avant l'ajout du nom)
export function clientLabel(client: ClientInfo) {
  return client.name || client.email
}

// Liens vers les réseaux renseignés par la cliente, pour que la pro la reconnaisse
export function ClientSocials({ client }: { client: ClientInfo }) {
  if (!client.instagram && !client.snapchat) return null
  return (
    <span className="inline-flex gap-2 flex-wrap">
      {client.instagram && (
        <a href={`https://instagram.com/${client.instagram}`} target="_blank" rel="noopener noreferrer"
          className="text-taupe hover:underline">
          Instagram @{client.instagram}
        </a>
      )}
      {client.snapchat && (
        <a href={`https://snapchat.com/add/${client.snapchat}`} target="_blank" rel="noopener noreferrer"
          className="text-taupe hover:underline">
          Snapchat {client.snapchat}
        </a>
      )}
    </span>
  )
}
