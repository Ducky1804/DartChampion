import { writable } from 'svelte/store'
import { auth } from './firebase'

export const userStore = writable(null)

auth.onAuthStateChanged(u => userStore.set(u))


