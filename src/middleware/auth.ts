import type { Router } from 'vue-router'
import { session } from '@/services/session'

const LOGIN_PATH = '/login'

export function setupAuthGuard(router: Router) {
  router.beforeEach(to => {
    const isAuthenticated = session.isAuthenticated

    if (to.path === LOGIN_PATH) return isAuthenticated ? '/' : true

    return isAuthenticated ? true : LOGIN_PATH
  })

  // Logout, refresh recusado ou logout em outra aba: volta para o login sem esperar uma navegação
  session.onCleared(() => {
    if (router.currentRoute.value.path !== LOGIN_PATH) router.replace(LOGIN_PATH)
  })
}
