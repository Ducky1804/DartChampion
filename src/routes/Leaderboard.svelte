<script>
  import { db } from '../lib/firebase'
  import { collection, getDocs } from 'firebase/firestore'
  let championshipId = ''
  let leaderboard = []

  async function loadLeaderboard() {
    if (!championshipId) return
    const resultsSnap = await getDocs(collection(db, 'championships', championshipId, 'results'))
    const totals = {}
    resultsSnap.forEach(d => {
      const { player, score } = d.data()
      totals[player] = (totals[player] || 0) + (Number(score) || 0)
    })
    leaderboard = Object.entries(totals)
      .map(([player, total]) => ({ player, total }))
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
            <td>{row.player}</td>
            <td class="font-semibold">{row.total}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>


