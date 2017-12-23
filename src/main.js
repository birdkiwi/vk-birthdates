import Vue from 'vue';
import store from './store';
import App from './App.vue';
import Toaster from 'v-toaster';
import 'v-toaster/dist/v-toaster.css';

Vue.use(Toaster, {timeout: 5000});

new Vue({
  el: '#app',
  store,
  render: h => h(App)
});
