export function setupAuthGuard(router: any) {
  router.beforeEach((to: any, from: any, next: any) => {
    const isAuthenticated = localStorage.getItem('noteesapp_auth') === 'true'
    const authTime = localStorage.getItem('noteesapp_auth_time')
    
    const isSessionExpired = authTime && 
      Date.now() - parseInt(authTime) > 24 * 60 * 60 * 1000
    
    if (isSessionExpired) {
      localStorage.removeItem('noteesapp_auth')
      localStorage.removeItem('noteesapp_auth_time')
    }
    
    const publicRoutes = ['/login']
    
    if (publicRoutes.includes(to.path)) {
      if (isAuthenticated && !isSessionExpired) {
        next('/')
      } else {
        next()
      }
    } else {
      if (isAuthenticated && !isSessionExpired) {
        next()
      } else {
        next('/login')
      }
    }
  })
}