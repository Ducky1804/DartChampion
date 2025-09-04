<script>
  import { onMount } from 'svelte'
  import { db } from '../lib/firebase'
  import {doc, getDoc, collection, getDocs, addDoc, updateDoc, query, orderBy, where} from 'firebase/firestore'
  let championshipId = ''
  let championship = null
  let matches = []
  let editing = {}
  let error = ''
  let selectedRound = 1
  let loading = false
  let visibleMatches = []
  let roundsList = []
  let standings = []

  function parseIdFromUrl() {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return sp.get('id') || ''
  }

  async function loadAll() {
    error = ''
    loading = true
    try {
      const champRef = doc(db, 'championships', championshipId)
      const champSnap = await getDoc(champRef)
      championship = champSnap.exists() ? { id: champSnap.id, ...champSnap.data() } : null
      if (!championship) {
        error = 'Tournament not found.'
        matches = []
        return
      }

      const matchesRef = collection(db, 'championships', championshipId, 'matches')
      const snap = await getDocs(matchesRef)
      matches = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      roundsList = listRounds()
      if (roundsList.length > 0 && !roundsList.includes(selectedRound)) {
        selectedRound = roundsList[0]
      }
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }

  onMount(async () => {
    championshipId = parseIdFromUrl()
    if (championshipId) await loadAll()
    standings = computeStandings();
  })

  function playerNameFromKey(key) {
    if (!championship) return key
    const p = championship.players.find(p => (p.mode === 'user' ? `user:${p.userId}` : `guest:${p.displayName}`) === key)
    return p ? p.displayName : key
  }

  function computeStandings() {
    const table = {}
    if (!championship) return []
    championship.players.forEach(p => {
      const key = p.mode === 'user' ? `user:${p.userId}` : `guest:${p.displayName}`
      table[key] = { key, name: p.displayName, played: 0, won: 0, lost: 0, points: 0 }
    })
    matches.forEach(m => {
      const { playerAKey, playerBKey, scoreA, scoreB } = m
      if (scoreA == null || scoreB == null) return
      table[playerAKey].played++
      table[playerBKey].played++
      if (Number(scoreA) > Number(scoreB)) {
        table[playerAKey].won++
        table[playerBKey].lost++
        table[playerAKey].points += 1
      } else if (Number(scoreB) > Number(scoreA)) {
        table[playerBKey].won++
        table[playerAKey].lost++
        table[playerBKey].points += 1
      }
    })
    return Object.values(table).sort((a,b) => b.points - a.points || b.won - a.won || a.lost - b.lost)
  }

  $: standings = computeStandings()

  function roundMatches(roundNumber) {
    return matches.filter(m => m.stage === 'round_robin' && m.round === roundNumber)
  }

  function listRounds() {
    const set = new Set(matches.filter(m => m.stage === 'round_robin' && m.round != null).map(m => m.round))
    return Array.from(set).sort((a,b) => a - b)
  }

  $: visibleMatches = championship
    ? (championship.stage === 'round_robin'
        ? roundMatches(selectedRound)
        : matches.filter(m => m.stage === championship.stage))
    : []

  $: roundsList = listRounds()
  $: if (championship && championship.stage === 'round_robin' && roundsList.length && !roundsList.includes(selectedRound)) {
    selectedRound = roundsList[0]
  }

  async function saveMatch(m) {
    if (!championship || championship.locked) return
    const idx = matches.findIndex(x => x.id === m.id)
    if (idx === -1) return
    let newScoreA = null
    let newScoreB = null
    let newWinner = null
    if (!(m.scoreA === '' || m.scoreB === '' || m.scoreA == null || m.scoreB == null)) {
      const a = Number(m.scoreA)
      const b = Number(m.scoreB)
      newScoreA = a
      newScoreB = b
      newWinner = a === b ? null : (a > b ? m.playerAKey : m.playerBKey)
    }
    await updateDoc(doc(db, 'championships', championshipId, 'matches', m.id), {
      scoreA: newScoreA,
      scoreB: newScoreB,
      winnerKey: newWinner,
    })
    // Optimistically update local state so standings update immediately
    matches[idx] = { ...matches[idx], scoreA: newScoreA, scoreB: newScoreB, winnerKey: newWinner }
    matches = [...matches]
    editing[m.id] = false
    standings = computeStandings();
  }

  function allMatchesHaveScores() {
    return matches
      .filter(m => m.stage === 'round_robin')
      .every(m => m.scoreA != null && m.scoreB != null)
  }

  async function advanceToSemifinals() {
    if (!championship) return
    if (!allMatchesHaveScores()) {
      error = 'Fill in all round-robin match scores before proceeding to semifinals.'
      return
    }
    // Seeds by points then differential (won-lost)
    const table = computeStandings()
    if (table.length < 4) {
      error = 'Need at least 4 players to create semifinals.'
      return
    }
    const seed1 = table[0].key, seed2 = table[1].key, seed3 = table[2].key, seed4 = table[3].key
    await addDoc(collection(db, 'championships', championshipId, 'matches'), {
      stage: 'semifinals',
      round: 1,
      playerAKey: seed1,
      playerBKey: seed4,
      scoreA: null,
      scoreB: null,
      winnerKey: null,
      createdAt: Date.now(),
    })
    await addDoc(collection(db, 'championships', championshipId, 'matches'), {
      stage: 'semifinals',
      round: 1,
      playerAKey: seed2,
      playerBKey: seed3,
      scoreA: null,
      scoreB: null,
      winnerKey: null,
      createdAt: Date.now(),
    })
    await updateDoc(doc(db, 'championships', championshipId), { stage: 'semifinals' })
    await loadAll()
  }

  async function semifinalsDone() {
    const q = query(
            collection(db, 'championships', championshipId, 'matches'),
            where('stage', '==', 'semifinals')
    )
    const snap = await getDocs(q)
    const semis = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    return semis.length === 2 && semis.every(m => m.scoreA != null && m.scoreB != null)
  }

  async function advanceToFinals() {
    if (!championship) return
    const semis = matches.filter(m => m.stage === 'semifinals')
    if (semis.length !== 2 || !semis.every(m => m.scoreA != null && m.scoreB != null)) {
      error = 'Complete both semifinal matches first.'
      return
    }
    const winners = semis.map(m => m.winnerKey).filter(Boolean)
    const losers = semis.map(m => (m.winnerKey === m.playerAKey ? m.playerBKey : m.playerAKey))
    await addDoc(collection(db, 'championships', championshipId, 'matches'), {
      stage: 'finals',
      round: 1,
      type: 'final',
      playerAKey: winners[0],
      playerBKey: winners[1],
      scoreA: null,
      scoreB: null,
      winnerKey: null,
      createdAt: Date.now(),
    })
    await addDoc(collection(db, 'championships', championshipId, 'matches'), {
      stage: 'finals',
      round: 1,
      type: 'third_place',
      playerAKey: losers[0],
      playerBKey: losers[1],
      scoreA: null,
      scoreB: null,
      winnerKey: null,
      createdAt: Date.now(),
    })
    await updateDoc(doc(db, 'championships', championshipId), { stage: 'finals' })
    await loadAll()
  }

  async function finalsDone() {
    const q = query(
            collection(db, 'championships', championshipId, 'matches'),
            where('stage', '==', 'finals')
    )
    const snap = await getDocs(q)
    const finals = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    return finals.length === 2 && finals.every(m => m.scoreA != null && m.scoreB != null)
  }

  async function finishTournament() {
    if (!championship) return
    const finals = matches.filter(m => m.stage === 'finals')
    if (finals.length !== 2 || !finals.every(m => m.scoreA != null && m.scoreB != null)) {
      error = 'Complete both finals matches first.'
      return
    }
    const finalMatch = finals.find(m => m.type === 'final')
    const thirdMatch = finals.find(m => m.type === 'third_place')
    const gold = finalMatch.winnerKey
    const silver = gold === finalMatch.playerAKey ? finalMatch.playerBKey : finalMatch.playerAKey
    const bronze = thirdMatch.winnerKey
    await updateDoc(doc(db, 'championships', championshipId), {
      stage: 'finished',
      locked: true,
      podium: { gold, silver, bronze },
    })
    await loadAll()
  }
</script>

{#if error}
  <div class="alert alert-error mb-4">{error}</div>
{/if}

{#if championship}
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-2xl font-semibold">{championship.name || 'Tournament'}</h2>
    <div class="flex gap-2 items-center">
      {#if championship.stage === 'round_robin'}
        <button class="btn btn-success" on:click={advanceToSemifinals}>Go to semifinals</button>
      {:else if championship.stage === 'semifinals'}
        <button class="btn btn-success" on:click={advanceToFinals} disabled={!semifinalsDone()}>Go to finals</button>
      {:else if championship.stage === 'finals'}
        <button class="btn btn-warning" on:click={finishTournament} disabled={!finalsDone()}>Finish tournament</button>
      {/if}
    </div>
  </div>

  {#if championship.stage === 'finished' && championship.podium}
    <div class="my-8 relative">
      <!-- Confetti effect -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/4 animate-bounce text-yellow-400 text-2xl">✨</div>
        <div class="absolute top-2 right-1/4 animate-pulse text-yellow-300 text-xl">⭐</div>
        <div class="absolute top-4 left-1/3 animate-ping text-yellow-500 text-lg">🎉</div>
        <div class="absolute top-1 right-1/3 animate-bounce text-yellow-400 text-xl delay-300">✨</div>
      </div>

      <div class="text-center mb-8">
        <h3 class="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
          🏆 Tournament Champions 🏆
        </h3>
        <div class="text-base-content/60 text-lg">Congratulations to our winners!</div>
      </div>

      <div class="flex justify-center items-end gap-6 max-w-2xl mx-auto">
        <!-- Silver (2nd Place) -->
        <div class="flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
          <div class="mb-3">
            <div class="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-gray-200">
              🥈
            </div>
          </div>
          <div class="bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg shadow-xl w-24 h-20 flex flex-col items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div class="text-white font-bold text-xl relative z-10">2</div>
            <div class="text-white/80 text-xs relative z-10">SECOND</div>
          </div>
          <div class="mt-3 px-3 py-1 bg-base-200 rounded-lg shadow-sm">
            <div class="font-semibold text-sm">{playerNameFromKey(championship.podium.silver)}</div>
          </div>
        </div>

        <!-- Gold (1st Place) -->
        <div class="flex flex-col items-center transform hover:scale-105 transition-transform duration-300 -mt-4">
          <div class="mb-4 relative">
            <div class="absolute -top-2 -right-2 text-yellow-400 animate-pulse">👑</div>
            <div class="w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-xl ring-4 ring-yellow-200">
              🥇
            </div>
          </div>
          <div class="bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-500 rounded-t-lg shadow-2xl w-28 h-28 flex flex-col items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20"></div>
            <div class="text-white font-bold text-2xl relative z-10 drop-shadow-lg">1</div>
            <div class="text-white/90 text-xs relative z-10 font-semibold tracking-wider">CHAMPION</div>
          </div>
          <div class="mt-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white rounded-lg shadow-lg">
            <div class="font-bold text-base">{playerNameFromKey(championship.podium.gold)}</div>
          </div>
        </div>

        <!-- Bronze (3rd Place) -->
        <div class="flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
          <div class="mb-3">
            <div class="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-amber-200">
              🥉
            </div>
          </div>
          <div class="bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg shadow-xl w-24 h-16 flex flex-col items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div class="text-white font-bold text-xl relative z-10">3</div>
            <div class="text-white/80 text-xs relative z-10">THIRD</div>
          </div>
          <div class="mt-3 px-3 py-1 bg-base-200 rounded-lg shadow-sm">
            <div class="font-semibold text-sm">{playerNameFromKey(championship.podium.bronze)}</div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if championship.stage === 'round_robin'}
    <div class="tabs tabs-boxed mb-4">
      {#each roundsList as r}
        <button type="button" role="tab" class="tab {selectedRound === r ? 'tab-active' : ''}" on:click={() => selectedRound = r}>Round {r}</button>
      {/each}
    </div>
    <div class="flex items-center gap-2 mb-4">
      <button type="button" class="btn btn-sm" on:click={() => selectedRound = Math.max(roundsList[0] || 1, selectedRound - 1)}>&lt; Prev</button>
      <div class="opacity-70 text-sm">Round {selectedRound} of {roundsList.length || 0}</div>
      <button type="button" class="btn btn-sm" on:click={() => selectedRound = Math.min(roundsList[roundsList.length - 1] || selectedRound, selectedRound + 1)}>Next &gt;</button>
    </div>
  {/if}

  <div class="grid md:grid-cols-3 gap-3">
    {#each visibleMatches as m}
      <div class="card bg-base-200">
        <div class="card-body gap-2">
          <div class="flex items-center justify-between">
            <div class="font-medium">{playerNameFromKey(m.playerAKey)} vs {playerNameFromKey(m.playerBKey)}</div>
            {#if !championship.locked}
              {#if editing[m.id]}
                <button class="btn btn-sm" on:click={() => editing[m.id] = false}>Cancel</button>
              {:else}
                <button class="btn btn-sm" on:click={() => editing[m.id] = true}>Edit</button>
              {/if}
            {/if}
          </div>
          {#if editing[m.id] && !championship.locked}
            <div class="join">
              <input class="input input-bordered input-sm join-item w-20" type="number" min="0" bind:value={m.scoreA} placeholder="A" />
              <span class="join-item px-2">-</span>
              <input class="input input-bordered input-sm join-item w-20" type="number" min="0" bind:value={m.scoreB} placeholder="B" />
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm" on:click={() => saveMatch(m)}>Save</button>
            </div>
          {:else}
            <div class="text-sm">
              <span class="font-semibold">{m.scoreA ?? '-'}</span>
              <span class="opacity-70">  -  </span>
              <span class="font-semibold">{m.scoreB ?? '-'}</span>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="divider">Standings</div>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr><th>Rank</th><th>Player</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr>
      </thead>
      <tbody>
        {#if standings.length}
          {#each standings as row, i}
            <tr>
              <td>{i + 1}</td>
              <td>{row.name}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.lost}</td>
              <td class="font-semibold">{row.points}</td>
            </tr>
          {/each}
        {:else if championship}
          {#each championship.players as p, i}
            <tr>
              <td>{i + 1}</td>
              <td>{p.displayName}</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td class="font-semibold">0</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
{/if}


