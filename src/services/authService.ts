import { request } from './http'
import { session, type Session, type SessionUser } from './session'

export const authService = {
  async register(email: string, password: string): Promise<SessionUser> {
    const data = await request<Session>('/auth/register', {
      method: 'POST',
      body: { email, password },
      auth: false
    })
    session.set(data)
    return data.user
  },

  async login(email: string, password: string): Promise<SessionUser> {
    const data = await request<Session>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false
    })
    session.set(data)
    return data.user
  },

  // Revoga o refresh token no servidor e encerra a sessão local. Se o servidor não responder
  // (offline, dormindo), a sessão local é encerrada do mesmo jeito: sair nunca pode travar.
  async logout(): Promise<void> {
    const refreshToken = session.refreshToken

    try {
      if (refreshToken) {
        await request('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false })
      }
    } catch {
      // melhor esforço
    } finally {
      session.clear()
    }
  },

  async me(): Promise<SessionUser> {
    return request<SessionUser>('/auth/me')
  }
}
