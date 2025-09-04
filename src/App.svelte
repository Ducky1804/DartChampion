<script>
  import { currentPath, navigateTo } from './lib/router'
  import { userStore } from './lib/authStore'
  import { auth } from './lib/firebase'
  import Home from './routes/Home.svelte'
  import Login from './routes/Login.svelte'
  import Register from './routes/Register.svelte'
  import Setup from './routes/Setup.svelte'
  import Tournaments from './routes/Tournaments.svelte'
  import Tournament from './routes/Tournament.svelte'
  import Profile from './routes/Profile.svelte'
  import Leaderboards from './routes/Leaderboards.svelte'
</script>

<div class="min-h-screen bg-base-100">
  <div class="navbar bg-base-200">
    <div class="flex-1">
      <button type="button" on:click={() => navigateTo('/')} class="btn btn-ghost text-xl">DartChampion</button>
    </div>
    <div class="flex-none gap-2">
      <button class="btn btn-ghost" on:click={() => navigateTo('/')}>Home</button>
      <button class="btn btn-ghost" on:click={() => navigateTo('/tournaments')}>Tournaments</button>
      <button class="btn btn-ghost" on:click={() => navigateTo('/setup')}>Create</button>
      <button class="btn btn-ghost" on:click={() => navigateTo('/leaderboards')}>Leaderboards</button>
      {#if $userStore}
        <button class="btn" on:click={() => navigateTo('/profile')}>Profile</button>
        <button class="btn btn-outline" on:click={() => auth.signOut()}>Logout</button>
      {:else}
        <button class="btn btn-primary" on:click={() => navigateTo('/login')}>Login</button>
      {/if}
    </div>
  </div>

  <div class="container mx-auto p-4">
    {#if $currentPath === '/'}
      <Home />
    {:else if $currentPath === '/login'}
      <Login />
    {:else if $currentPath === '/register'}
      <Register />
    {:else if $currentPath === '/setup'}
      <Setup />
    {:else if $currentPath === '/tournaments'}
      <Tournaments />
    {:else if $currentPath.startsWith('/tournament')}
      <Tournament />
    {:else if $currentPath === '/profile'}
      <Profile />
    {:else if $currentPath === '/leaderboards'}
      <Leaderboards />
    {:else}
      <div class="alert">Not found</div>
    {/if}
  </div>
</div>
