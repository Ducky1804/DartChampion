<script>
  import { auth } from '../lib/firebase'
  import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
  import { userStore } from '../lib/authStore'
  import { navigateTo } from '../lib/router'
  let email = ''
  let password = ''
  let error = ''
  async function handleLogin(e) {
    e.preventDefault()
    error = ''
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigateTo('/')
    } catch (e) {
      error = e.message
    }
  }
  async function handleLogout() {
    await signOut(auth)
  }
</script>

{#if $userStore}
  <div class="max-w-sm mx-auto card bg-base-200 p-6 space-y-4">
    <h2 class="card-title">Signed in</h2>
    <p>{$userStore.email}</p>
    <div class="flex gap-2">
      <button class="btn" on:click={handleLogout}>Sign out</button>
      <button on:click={() => navigateTo('/')} class="btn btn-primary">Go Home</button>
    </div>
  </div>
{:else}
  <form class="max-w-sm mx-auto card bg-base-200 p-6 space-y-4" on:submit|preventDefault={handleLogin}>
    <h2 class="card-title">Login</h2>
    {#if error}
      <div class="alert alert-error text-sm">{error}</div>
    {/if}
    <label class="form-control">
      <div class="label"><span class="label-text">Email</span></div>
      <input class="input input-bordered" type="email" bind:value={email} required />
    </label>
    <label class="form-control">
      <div class="label"><span class="label-text">Password</span></div>
      <input class="input input-bordered" type="password" bind:value={password} required />
    </label>
    <button class="btn btn-primary w-full" type="submit">Sign in</button>
    <p class="text-sm">No account? <button type="button" class="link" on:click={() => navigateTo('/register')}>Register</button></p>
  </form>
{/if}


