import { writable } from 'svelte/store'

export const currentPath = writable(typeof window !== 'undefined' ? window.location.pathname : '/')

export function navigateTo(path) {
  if (typeof window === 'undefined') return
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  currentPath.set(path)
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => currentPath.set(window.location.pathname))
}


