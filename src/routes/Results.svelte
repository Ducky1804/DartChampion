<script>
  import { db } from '../lib/firebase'
  import { collection, addDoc, getDoc, doc, getDocs, query, orderBy } from 'firebase/firestore'
  let championshipId = ''
  let selectedPlayerKey = '' // 'user:<uid>' or 'guest:<name>'
  let championship = null
  let score = ''
  let message = ''
  let recent = []

  async function loadChampionshipAndRecent() {
    if (!championshipId) return
    const champDoc = await getDoc(doc(db, 'championships', championshipId))
    championship = champDoc.exists() ? champDoc.data() : null
    const q = query(collection(db, 'championships', championshipId, 'results'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    recent = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async function submitResult() {
    message = ''
    if (!championshipId || !selectedPlayerKey || !score) {
      message = 'Fill all fields'
      return
    }
    const [kind, value] = selectedPlayerKey.split(':')
    await addDoc(collection(db, 'championships', championshipId, 'results'), {
      userId: kind === 'user' ? value : null,
      guestName: kind === 'guest' ? value : null,
      score: Number(score),
      createdAt: Date.now(),
    })
    message = 'Saved'
    selectedPlayerKey = ''
    score = ''
    await loadChampionshipAndRecent()
  }
</script>

<div class="max-w-xl mx-auto card bg-base-200 p-6 space-y-4">
  <h2 class="card-title">Enter Result</h2>
  <label class="form-control">
    <div class="label"><span class="label-text">Championship ID</span></div>
    <input class="input input-bordered" bind:value={championshipId} on:change={loadChampionshipAndRecent} placeholder="e.g. from Setup" />
  </label>
  <div class="grid grid-cols-2 gap-4">
    <label class="form-control">
      <div class="label"><span class="label-text">Player</span></div>
      <select class="select select-bordered" bind:value={selectedPlayerKey}>
        <option value="">Select player…</option>
        {#if championship}
          {#each championship.players as p}
            {#if p.mode === 'user'}
              <option value={`user:${p.userId}`}>{p.displayName}</option>
            {:else}
              <option value={`guest:${p.displayName}`}>{p.displayName} (guest)</option>
            {/if}
          {/each}
        {/if}
      </select>
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


