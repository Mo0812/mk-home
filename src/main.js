import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.config.productionTip = false;

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

const socket = new WebSocket("ws://192.168.178.49:4000");

socket.addEventListener("open", () => {
    socket.send("Requesting connection");
});

socket.addEventListener("message", event => {
    console.log(`Message from server: ${event.data}`);
    store.dispatch("fetchSmarthomeData");
});

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");
