declare module 'vue-router' {
  import { Component } from 'vue'
  
  export interface RouteRecordRaw {
    path: string
    name?: string
    component: Component
    children?: RouteRecordRaw[]
  }
  
  export function createRouter(options: {
    history: any
    routes: RouteRecordRaw[]
  }): any
  
  export function createWebHistory(): any
}