import { request } from './http'
import { session, type Session, type SessionUser } from './session'
import { dismissDemoExpired } from './demo'

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

  // Conta de demonstração: sem e-mail nem senha, vale por um tempo limitado (o servidor impõe o prazo)
  async demo(): Promise<SessionUser> {
    const data = await request<Session>('/auth/demo', { method: 'POST', auth: false })
    session.set(data)
    dismissDemoExpired()
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

  // Exclui a conta com as notas, pastas e sessões (definitivo). Conta com senha manda a senha atual; a demo, nada.
  // Senha errada volta como 400 (não 401: um 401 derrubaria a sessão), e a sessão local só acaba se deu certo.
  async deleteAccount(password?: string): Promise<void> {
    await request('/auth/delete-account', {
      method: 'POST',
      body: password ? { password } : undefined
    })
    session.clear()
  },

  async me(): Promise<SessionUser> {
    return request<SessionUser>('/auth/me')
  }
}
