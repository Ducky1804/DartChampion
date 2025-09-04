<script>
  import { db, auth } from '../lib/firebase'
  import { collection, addDoc } from 'firebase/firestore'
  import { onMount } from 'svelte'
  let playersCount = 2
  let players = ['','']
  let message = ''
  onMount(() => {
    players = Array.from({ length: playersCount }, () => '')
  })
  $: players = players.slice(0, playersCount).concat(Array(Math.max(playersCount - players.length, 0)).fill(''))

  async function createChampionship() {
    message = ''
    const user = auth.currentUser
    if (!user) {
      message = 'Please login first.'
      return
    }
    try {
      const docRef = await addDoc(collection(db, 'championships'), {
        ownerId: user.uid,
        createdAt: Date.now(),
        players: players.filter(Boolean),
      })
      message = `Championship created: ${docRef.id}`
    } catch (e) {
      message = e.message
    }
  }
</script>

<div class="max-w-xl mx-auto card bg-base-200 p-6 space-y-4">
  <h2 class="card-title">Championship Setup</h2>
  <label class="form-control">
    <div class="label"><span class="label-text">Number of players</span></div>
    <input type="number" class="input input-bordered" min="2" max="32" bind:value={playersCount} />
  </label>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each players as name, i}
      <label class="form-control">
        <div class="label"><span class="label-text">Player {i + 1}</span></div>
        <input class="input input-bordered" type="text" bind:value={players[i]} placeholder="Name" />
      </label>
    {/each}
  </div>

  <button class="btn btn-primary" on:click={createChampionship}>Create championship</button>
  {#if message}
    <div class="alert mt-2">{message}</div>
  {/if}
</div>


