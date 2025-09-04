<script>
  import { db, auth } from '../lib/firebase'
  import { userStore } from '../lib/authStore'
  import { collection, addDoc, getDocs } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import { navigateTo } from '../lib/router'
  let playersCount = 2
  let players = [] // [{ mode: 'user'|'guest', userId?: string, guestName?: string }]
  let users = []
  let message = ''
  let name = ''
  function escapeHtml(text) {
    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
  }
  function onUserSelectChange(idx, event) {
    const select = event.currentTarget
    players[idx] = { ...players[idx], userId: select.value }
  }

  onMount(async () => {
    players = Array.from({ length: playersCount }, () => ({ mode: 'user', userId: '', guestName: '' }))
    const snap = await getDocs(collection(db, 'users'))
    users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    console.log(users);
  })
  $: players = players
        .slice(0, playersCount)
        .concat(Array(Math.max(playersCount - players.length, 0)).fill({ mode: 'user', userId: '', guestName: '' }))

  function dedupeAndFilter(ids) {
    return Array.from(new Set(ids.filter(Boolean)))
  }

  async function createChampionship() {
    message = ''
    const user = auth.currentUser
    if (!user) {
      message = 'Please login first.'
      return
    }
    if (!name.trim()) {
      message = 'Please enter a tournament name.'
      return
    }
    const resolved = players.map(p => p.mode === 'guest' ? (p.guestName || '') : (p.userId || ''))
    const rosterIds = dedupeAndFilter(resolved)
    if (rosterIds.length < 2) {
      message = 'Select at least two players.'
      return
    }
    const roster = players
      .map(p => {
        if (p.mode === 'guest') {
          const name = (p.guestName || '').trim()
          return name ? { mode: 'guest', displayName: name } : null
        }
        const u = users.find(x => x.id === p.userId)
        return u ? { mode: 'user', userId: u.id, displayName: u.displayName || u.email } : null
      })
      .filter(Boolean)
    // prevent duplicates in final roster
    const seen = new Set()
    const uniqueRoster = []
    for (const r of roster) {
      const key = r.mode === 'user' ? `user:${r.userId}` : `guest:${r.displayName.toLowerCase()}`
      if (!seen.has(key)) { seen.add(key); uniqueRoster.push(r) }
    }
    if (uniqueRoster.length < 2) {
      message = 'Duplicate players removed; need at least two unique players.'
      return
    }
    try {
      const docRef = await addDoc(collection(db, 'championships'), {
        name: name.trim() || null,
        ownerId: user.uid,
        createdAt: Date.now(),
        players: uniqueRoster,
        locked: false,
        stage: 'round_robin',
      })
      // generate round-robin schedule with rounds (circle method)
      const keys = uniqueRoster.map(p => p.mode === 'user' ? `user:${p.userId}` : `guest:${p.displayName}`)
      const n = keys.length
      const isOdd = n % 2 === 1
      const playersKeys = isOdd ? [...keys, 'BYE'] : [...keys]
      const rounds = playersKeys.length - 1
      for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < playersKeys.length / 2; i++) {
          const a = playersKeys[i]
          const b = playersKeys[playersKeys.length - 1 - i]
          if (a !== 'BYE' && b !== 'BYE') {
            await addDoc(collection(db, 'championships', docRef.id, 'matches'), {
              stage: 'round_robin',
              round: round + 1,
              playerAKey: a,
              playerBKey: b,
              scoreA: null,
              scoreB: null,
              winnerKey: null,
              createdAt: Date.now(),
            })
          }
        }
        // rotate (keep first fixed)
        const fixed = playersKeys[0]
        const rest = playersKeys.slice(1)
        rest.unshift(rest.pop())
        playersKeys.splice(0, playersKeys.length, fixed, ...rest)
      }
      message = `Championship created: ${docRef.id}`
      navigateTo(`/tournament?id=${docRef.id}`)
    } catch (e) {
      message = e.message
    }
  }
</script>

<div class="max-w-xl mx-auto card bg-base-200 p-6 space-y-4">
  <h2 class="card-title">Championship Setup</h2>
  <label class="form-control">
    <div class="label"><span class="label-text">Tournament name</span></div>
    <input class="input input-bordered" bind:value={name} placeholder="Optional name" />
  </label>
  <label class="form-control">
    <div class="label"><span class="label-text">Number of players</span></div>
    <input type="number" class="input input-bordered" min="2" max="32" bind:value={playersCount} />
  </label>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each players as p, i}
      <div class="card bg-base-100">
        <div class="card-body gap-3">
          <h3 class="card-title">Player {i + 1}</h3>
          <div>
            <button type="button" class="btn btn-xs" on:click={() => {
              if ($userStore && !$userStore.isAnonymous) {
                const exists = players.some(pp => pp.mode === 'user' && pp.userId === $userStore.uid)
                if (!exists) players[i] = { mode: 'user', userId: $userStore.uid, guestName: '' }
              }
            }}>Add me</button>
          </div>
          <div class="join">
            <button type="button" class="btn join-item {p.mode === 'user' ? 'btn-active' : ''}"
              on:click={() => players[i] = { ...players[i], mode: 'user' }}>Existing user</button>
            <button type="button" class="btn join-item {p.mode === 'guest' ? 'btn-active' : ''}"
              on:click={() => players[i] = { ...players[i], mode: 'guest' }}>Guest name</button>
          </div>
          {#if p.mode === 'user'}
            <select
                    class="select select-bordered"
                    bind:value={players[i].userId}
                    on:change={(e) => onUserSelectChange(i, e)}
                    aria-label="Select user"
            >
              <option value="">Select user…</option>
              {#each users as u}
                <option
                        value={u.id}
                        disabled={players.some((pp, j) => j !== i && pp.mode === 'user' && pp.userId === u.id)}
                >
                  {u.displayName || u.email || u.id}
                </option>
              {/each}
            </select>
          {:else}
            <input class="input input-bordered" placeholder="Guest name" bind:value={players[i].guestName} />
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <button class="btn btn-primary" on:click={createChampionship}>Create championship</button>
  {#if message}
    <div class="alert mt-2">{message}</div>
  {/if}
</div>



