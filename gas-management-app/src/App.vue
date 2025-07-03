<template>
  <div id="app-container">
    <template v-if="isAuthenticated && !isLoginPage">
      <header class="app-header">
        <button class="menu-toggle" @click="toggleSidebar" v-if="!isDesktop">☰</button>
        <!-- Dashboard link will be the main one once Dashboard exists -->
        <router-link to="/inventory" class="logo">GasControl</router-link>
        <nav class="main-nav" v-if="isDesktop">
          <!-- Desktop navigation items can go here if not using sidebar exclusively -->
        </nav>
        <div class="user-profile" v-if="currentUser">
          <span>{{ currentUser.name }} ({{ currentUser.role }})</span>
          <button @click="handleLogout" class="btn btn-sm accent">Salir</button>
        </div>
      </header>

      <div class="main-layout" :class="{ 'sidebar-open': sidebarOpen && !isDesktop }">
        <aside class="sidebar" :class="{ 'open': sidebarOpen && !isDesktop }">
          <nav>
            <ul>
              <!-- Dashboard Link (to be primary later) -->
              <!-- <li><router-link to="/dashboard" @click="closeSidebar">Dashboard</router-link></li> -->

              <li v-if="canAccess(['Administrador', 'Logística', 'Ventas'])">
                <router-link to="/inventory" @click="closeSidebar">Inventario</router-link>
              </li>
              <li v-if="canAccess(['Administrador', 'Logística'])">
                <router-link to="/vehicles" @click="closeSidebar">Vehículos</router-link>
              </li>
              <li v-if="canAccess(['Administrador'])">
                <router-link to="/staff" @click="closeSidebar">Personal</router-link>
              </li>
              <li v-if="canAccess(['Administrador', 'Chofer', 'Logística'])">
                <!-- Chofer can submit, Admin/Logistica can view/manage -->
                <router-link to="/accountability" @click="closeSidebar">Rendiciones</router-link>
              </li>
              <!-- Add more links according to roles and modules -->
            </ul>
          </nav>
        </aside>

        <main class="content-area">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </template>

    <template v-else>
       <!-- This will render LoginView or any other non-authenticated full-page views -->
      <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
    </template>

  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'App',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const sidebarOpen = ref(false);
    const isDesktop = ref(window.innerWidth >= 993);

    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const currentUser = computed(() => store.getters['auth/currentUser']);
    const userRole = computed(() => store.getters['auth/userRole']);

    // isLoginPage is true if the current route's name is 'Login'
    // This helps in deciding whether to show the main app layout or a full-page view like Login
    const isLoginPage = computed(() => route.name === 'Login');


    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const closeSidebar = () => {
      if (!isDesktop.value) {
        sidebarOpen.value = false;
      }
    };

    const updateMediaType = () => {
      isDesktop.value = window.innerWidth >= 993;
      if (isDesktop.value) {
        sidebarOpen.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener('resize', updateMediaType);
      // Attempt to simulate login if no user is found, for easier development
      // if (!isAuthenticated.value) {
      //    store.dispatch('auth/simulateLogin'); // Logs in as Admin by default
      // }
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateMediaType);
    });

    const handleLogout = async () => {
      await store.dispatch('auth/logout');
      router.push('/login');
    };

    const canAccess = (requiredRoles) => {
      if (!isAuthenticated.value || !userRole.value) return false;
      if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(userRole.value);
      }
      return userRole.value === requiredRoles;
    };

    // Watch for route changes to close sidebar on navigation
    watch(() => route.path, () => {
        if(!isDesktop.value) {
            sidebarOpen.value = false;
        }
    });


    return {
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
      isDesktop,
      isAuthenticated,
      currentUser,
      isLoginPage,
      handleLogout,
      canAccess
    };
  }
};
</script>

<style scoped>
/* App.vue specific styles, complementing global.css */
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  justify-content: space-between;
}

.logo {
  margin-left: var(--spacing-md);
}

.menu-toggle {
  display: none;
}
@media (max-width: 992px) {
  .menu-toggle {
    display: block;
  }
  .logo {
    margin-left: var(--spacing-sm);
  }
}

.main-nav {
  display: flex;
  gap: var(--spacing-md);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-right: var(--spacing-md);
  color: var(--color-text-on-primary);
}

.user-profile button {
  /* Using existing btn classes, but can be specific */
}


.content-area {
  position: relative;
}

/* login-page-container class is removed as router-view will handle full-page login directly */

/* View transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
