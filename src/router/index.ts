import { createRouter, createWebHistory } from 'vue-router';
import ContactsView from '../views/ContactsView.vue';

const routes = [{ path: '/', name: 'Contacts', component: ContactsView }];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
