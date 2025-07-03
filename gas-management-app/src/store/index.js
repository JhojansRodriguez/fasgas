import { createStore } from 'vuex';
import inventory from './modules/inventory';
import vehicles from './modules/vehicles';
import staff from './modules/staff';
import accountability from './modules/accountability';
import auth from './modules/auth';

export default createStore({
  state: {
    // Global state, if any, can go here
    appName: 'GasControl ERP',
  },
  getters: {
    // Global getters
    appName: state => state.appName,
  },
  mutations: {
    // Global mutations
  },
  actions: {
    // Global actions
  },
  modules: {
    inventory,
    vehicles,
    staff,
    accountability,
    auth,
  },
});
