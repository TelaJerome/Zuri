import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET!
const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

export function signToken(payload: { userId: string; role: string }) {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, secret) as { userId: string; role: string }
}
