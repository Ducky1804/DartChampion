<script>
  import { currentPath, navigateTo } from './lib/router'
  import Home from './routes/Home.svelte'
  import Login from './routes/Login.svelte'
  import Register from './routes/Register.svelte'
  import Setup from './routes/Setup.svelte'
  import Results from './routes/Results.svelte'
  import Leaderboard from './routes/Leaderboard.svelte'
</script>

<div class="min-h-screen bg-base-100">
  <div class="navbar bg-base-200">
    <div class="flex-1">
      <button type="button" on:click={() => navigateTo('/')} class="btn btn-ghost text-xl">DartChampion</button>
    </div>
    <div class="flex-none gap-2">
      <button class="btn btn-ghost" on:click={() => navigateTo('/')}>Home</button>
      <button class="btn btn-ghost" on:click={() => navigateTo('/setup')}>Setup</button>
      <button class="btn btn-ghost" on:click={() => navigateTo('/results')}>Results</button>
      <button class="btn btn-ghost" on:click={() => navigateTo('/leaderboard')}>Leaderboard</button>
      <button class="btn btn-primary" on:click={() => navigateTo('/login')}>Login</button>
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
    {:else if $currentPath === '/results'}
      <Results />
    {:else if $currentPath === '/leaderboard'}
      <Leaderboard />
    {:else}
      <div class="alert">Not found</div>
    {/if}
  </div>
</div>
