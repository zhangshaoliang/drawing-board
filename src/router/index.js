import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

let routes = [
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Home'),
  },
  {
    path: '*',
    name: 'home',
    redirect: '/home'
  }
]

let router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
