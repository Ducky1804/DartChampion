<script>
  import { db } from '../lib/firebase'
  import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'
  let championshipId = ''
  let player = ''
  let score = ''
  let message = ''
  let recent = []

  async function loadRecent() {
    if (!championshipId) return
    const q = query(collection(db, 'championships', championshipId, 'results'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    recent = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async function submitResult() {
    message = ''
    if (!championshipId || !player || !score) {
      message = 'Fill all fields'
      return
    }
    await addDoc(collection(db, 'championships', championshipId, 'results'), {
      player,
      score: Number(score),
      createdAt: Date.now(),
    })
    message = 'Saved'
    player = ''
    score = ''
    await loadRecent()
  }
</script>

<div class="max-w-xl mx-auto card bg-base-200 p-6 space-y-4">
  <h2 class="card-title">Enter Result</h2>
  <label class="form-control">
    <div class="label"><span class="label-text">Championship ID</span></div>
    <input class="input input-bordered" bind:value={championshipId} on:change={loadRecent} placeholder="e.g. from Setup" />
  </label>
  <div class="grid grid-cols-2 gap-4">
    <label class="form-control">
      <div class="label"><span class="label-text">Player</span></div>
      <input class="input input-bordered" bind:value={player} />
    </label>
    <label class="form-control">
      <div class="label"><span class="label-text">Score</span></div>
      <input class="input input-bordered" type="number" bind:value={score} />
    </label>
  </div>
  <button class="btn btn-primary" on:click={submitResult}>Save</button>
  {#if message}
    <div class="alert">{message}</div>
  {/if}

  <div class="divider">Recent</div>
  <ul class="space-y-2">
    {#each recent as r}
      <li class="flex justify-between bg-base-100 p-3 rounded">
        <span>{r.player}</span>
        <span class="font-semibold">{r.score}</span>
      </li>
    {/each}
  </ul>
</div>


