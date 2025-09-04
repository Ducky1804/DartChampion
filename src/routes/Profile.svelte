<script>
  import { userStore } from '../lib/authStore'
  import { db } from '../lib/firebase'
  import { collection, getDocs, query, where } from 'firebase/firestore'
  let user
  $: user = $userStore
  let stats = { played: 0, won: 0, lost: 0, winPct: 0 }
  let recent = []

  async function loadStats() {
    if (!user) return
    let played = 0, won = 0, lost = 0
    const champsSnap = await getDocs(collection(db, 'championships'))
    for (const champDoc of champsSnap.docs) {
      const champId = champDoc.id
      const resSnap = await getDocs(collection(db, 'championships', champId, 'matches'))
      resSnap.forEach(m => {
        const d = m.data()
        if (d.playerAKey === `user:${user.uid}` || d.playerBKey === `user:${user.uid}`) {
          if (d.scoreA != null && d.scoreB != null) {
            played++
            const myKey = `user:${user.uid}`
            const myScore = d.playerAKey === myKey ? d.scoreA : d.scoreB
            const otherScore = d.playerAKey === myKey ? d.scoreB : d.scoreA
            if (myScore > otherScore) won++
            else if (myScore < otherScore) lost++
            recent.push({ champId, vs: d.playerAKey === myKey ? d.playerBKey : d.playerAKey, myScore, otherScore })
          }
        }
      })
    }
    const winPct = played ? Math.round((won / played) * 100) : 0
    stats = { played, won, lost, winPct }
  }
  loadStats()
</script>

{#if !user}
  <div class="alert">Please login</div>
{:else}
  <div class="grid md:grid-cols-3 gap-4">
    <div class="stats shadow col-span-2">
      <div class="stat"><div class="stat-title">Played</div><div class="stat-value">{stats.played}</div></div>
      <div class="stat"><div class="stat-title">Won</div><div class="stat-value">{stats.won}</div></div>
      <div class="stat"><div class="stat-title">Lost</div><div class="stat-value">{stats.lost}</div></div>
      <div class="stat"><div class="stat-title">Win %</div><div class="stat-value">{stats.winPct}%</div></div>
    </div>
    <div class="card bg-base-200">
      <div class="card-body">
        <h3 class="card-title">Profile</h3>
        <div>{user.email}</div>
        
      </div>
    </div>
  </div>
  <div class="divider">Recent games</div>
  <div class="overflow-x-auto">
    <table class="table">
      <thead><tr><th>Champ</th><th>Opponent</th><th>Score</th></tr></thead>
      <tbody>
        {#each recent.slice(-10).reverse() as r}
          <tr>
            <td>{r.champId}</td>
            <td>{r.vs}</td>
            <td>{r.myScore} - {r.otherScore}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}


