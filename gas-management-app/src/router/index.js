import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Import store for auth checks

import InventoryView from '../views/Inventory/InventoryView.vue';
import VehiclesView from '../views/Vehicles/VehiclesView.vue';
import StaffView from '../views/Staff/StaffView.vue';
import AccountabilityView from '../views/Accountability/AccountabilityView.vue';
import LoginView from '../views/Login/LoginView.vue';
// import DashboardView from '../views/Dashboard/DashboardView.vue'; // To be created
// import NotFoundView from '../views/NotFound/NotFoundView.vue'; // To be created
// import UnauthorizedView from '../views/UnauthorizedView.vue'; // To be created for role mismatches

const routes = [
  {
    path: '/',
    redirect: () => {
      return store.getters['auth/isAuthenticated'] ? '/dashboard' : '/login';
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  // {
  //   path: '/dashboard',
  //   name: 'Dashboard',
  //   component: DashboardView,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryView,
    meta: { requiresAuth: true, roles: ['Administrador', 'Logística', 'Ventas'] }
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: VehiclesView,
    meta: { requiresAuth: true, roles: ['Administrador', 'Logística'] }
  },
  {
    path: '/staff',
    name: 'Staff',
    component: StaffView,
    meta: { requiresAuth: true, roles: ['Administrador'] }
  },
  {
    path: '/accountability',
    name: 'Accountability',
    component: AccountabilityView,
    meta: { requiresAuth: true } // All authenticated users can access their renditions (specific permissions inside component)
  },
  // {
  //   path: '/unauthorized',
  //   name: 'Unauthorized',
  //   component: UnauthorizedView, // Simple component showing "Access Denied"
  // },
  // {
  //   path: '/:pathMatch(.*)*', // Catch-all for 404
  //   name: 'NotFound',
  //   component: NotFoundView
  // }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  const userRole = store.getters['auth/userRole'];

  // For development, if no dashboard, redirect authenticated users to inventory
  const defaultAuthenticatedRoute = '/inventory'; // '/dashboard' when created

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      // Authenticated, check roles
      if (to.meta.roles) {
        if (to.meta.roles.includes(userRole)) {
          next(); // Has role, proceed
        } else {
          // Has no required role, redirect to an unauthorized page or dashboard
          // next({ name: 'Unauthorized' });
          next(defaultAuthenticatedRoute); // Or a more user-friendly page
        }
      } else {
        next(); // No specific roles required, proceed
      }
    }
  } else if (to.meta.requiresGuest) {
    if (isAuthenticated) {
      // Authenticated user trying to access guest page (like login)
      next(defaultAuthenticatedRoute); // Redirect to dashboard
    } else {
      next(); // Not authenticated, proceed to guest page
    }
  } else {
    next(); // No specific meta fields, proceed
  }
});

export default router;
