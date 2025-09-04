<script>
  import { auth, db } from '../lib/firebase'
  import { createUserWithEmailAndPassword } from 'firebase/auth'
  import { doc, setDoc } from 'firebase/firestore'
  import { navigateTo } from '../lib/router'
  let email = ''
  let password = ''
  let displayName = ''
  let error = ''
  async function handleRegister(e) {
    e.preventDefault()
    error = ''
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), { email, displayName, createdAt: Date.now() })
      navigateTo('/')
    } catch (e) {
      error = e.message
    }
  }
</script>

<form class="max-w-sm mx-auto card bg-base-200 p-6 space-y-4" on:submit|preventDefault={handleRegister}>
  <h2 class="card-title">Create account</h2>
  {#if error}
    <div class="alert alert-error text-sm">{error}</div>
  {/if}
  <label class="form-control">
    <div class="label"><span class="label-text">Display name</span></div>
    <input class="input input-bordered" type="text" bind:value={displayName} required />
  </label>
  <label class="form-control">
    <div class="label"><span class="label-text">Email</span></div>
    <input class="input input-bordered" type="email" bind:value={email} required />
  </label>
  <label class="form-control">
    <div class="label"><span class="label-text">Password</span></div>
    <input class="input input-bordered" type="password" bind:value={password} minlength="6" required />
  </label>
  <button class="btn btn-primary w-full" type="submit">Register</button>
  <p class="text-sm">Already have an account? <button type="button" class="link" on:click={() => navigateTo('/login')}>Login</button></p>
</form>


