import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard/home',
    children: [
      { path: 'home', name: 'Home', component: () => import('../views/Home.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue') },
      { path: 'matching', name: 'Matching', component: () => import('../views/Matching.vue') },
      { path: 'classroom', name: 'Classroom', component: () => import('../views/Classroom.vue') },
      { path: 'invitation', name: 'Invitation', component: () => import('../views/Invitation.vue') },
      { path: 'team', name: 'TeamManage', component: () => import('../views/TeamManage.vue') },
      { path: 'evaluation', name: 'Evaluation', component: () => import('../views/Evaluation.vue') },
      { path: 'database', name: 'Database', component: () => import('../views/Database.vue') },
      { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const currentUser = localStorage.getItem('currentUser')
  if (to.meta.requiresAuth && !currentUser) {
    next('/login')
  } else {
    next()
  }
})

export default router
