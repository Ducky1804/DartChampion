<script>
  import { db } from '../lib/firebase'
  import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
  let championshipId = ''
  let leaderboard = []

  async function loadLeaderboard() {
    if (!championshipId) return
    const champDoc = await getDoc(doc(db, 'championships', championshipId))
    const championship = champDoc.exists() ? champDoc.data() : { players: [] }
    const resultsSnap = await getDocs(collection(db, 'championships', championshipId, 'results'))
    const totals = {}
    resultsSnap.forEach(d => {
      const { userId, guestName, score } = d.data()
      const key = userId ? `user:${userId}` : `guest:${guestName}`
      totals[key] = (totals[key] || 0) + (Number(score) || 0)
    })
    const nameByKey = Object.fromEntries(
      championship.players.map(p => [p.mode === 'user' ? `user:${p.userId}` : `guest:${p.displayName}`, p.displayName])
    )
    leaderboard = Object.entries(totals)
      .map(([key, total]) => ({ key, name: nameByKey[key] || key, total }))
      .sort((a, b) => b.total - a.total)
  }
</script>

<div class="max-w-xl mx-auto card bg-base-200 p-6 space-y-4">
  <h2 class="card-title">Leaderboard</h2>
  <label class="form-control">
    <div class="label"><span class="label-text">Championship ID</span></div>
    <input class="input input-bordered" bind:value={championshipId} />
  </label>
  <button class="btn btn-primary" on:click={loadLeaderboard}>Load</button>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {#each leaderboard as row, i}
          <tr>
            <td>{i + 1}</td>
            <td>{row.name}</td>
            <td class="font-semibold">{row.total}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>


