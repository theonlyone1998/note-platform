import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/notebook/:notebookId',
      name: 'NotebookNotes',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/tag/:tagId',
      name: 'TagNotes',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/trash',
      name: 'Trash',
      component: () => import('@/views/TrashView.vue')
    },
    {
      path: '/note/:id?',
      name: 'NoteEditor',
      component: () => import('@/views/NoteEditorView.vue')
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { admin: true },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue')
        },
        {
          path: 'users',
          name: 'AdminUsers',
          component: () => import('@/views/admin/AdminUsersView.vue')
        },
        {
          path: 'notes',
          name: 'AdminNotes',
          component: () => import('@/views/admin/AdminNotesView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore()

  const isAdminPath = to.path.startsWith('/admin')

  if (isAdminPath) {
    if (adminStore.isLoggedIn && adminStore.isAdmin) {
      return
    }

    return '/login'
  }

  if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    return '/'
  }

  if (!to.meta.public && !userStore.isLoggedIn) {
    return '/login'
  }
})

export default router