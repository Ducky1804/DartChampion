<script>
  import { db } from '../lib/firebase'
  import { collection, getDocs } from 'firebase/firestore'
  let boards = { mostWins: [], bestWinPct: [] }

  async function load() {
    const champsSnap = await getDocs(collection(db, 'championships'))
    const totals = {}
    const played = {}
    champsSnap.forEach(c => {})
    for (const c of champsSnap.docs) {
      const champId = c.id
      const resultsSnap = await getDocs(collection(db, 'championships', champId, 'matches'))
      resultsSnap.forEach(r => {
        const d = r.data()
        if (d.scoreA == null || d.scoreB == null) return
        const keys = [d.playerAKey, d.playerBKey]
        keys.forEach(k => {
          played[k] = (played[k] || 0) + 1
        })
        const winner = d.winnerKey
        if (winner) totals[winner] = (totals[winner] || 0) + 1
      })
    }
    const entries = Object.keys(played).map(k => ({ key: k, wins: totals[k] || 0, played: played[k], winPct: Math.round(((totals[k] || 0) / played[k]) * 100) }))
    boards.mostWins = entries.sort((a,b) => b.wins - a.wins).slice(0, 20)
    boards.bestWinPct = entries.filter(e => e.played >= 3).sort((a,b) => b.winPct - a.winPct).slice(0, 20)
  }
  load()

  function displayName(key) {
    if (!key) return ''
    return key.startsWith('user:') ? key.slice(5) : key.slice(6) + ' (guest)'
  }
</script>

<div class="grid md:grid-cols-2 gap-6">
  <div>
    <h3 class="text-xl font-semibold mb-2">Most wins</h3>
    <div class="overflow-x-auto">
      <table class="table">
        <thead><tr><th>#</th><th>Player</th><th>Wins</th><th>Played</th></tr></thead>
        <tbody>
          {#each boards.mostWins as r, i}
            <tr><td>{i+1}</td><td>{displayName(r.key)}</td><td>{r.wins}</td><td>{r.played}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  <div>
    <h3 class="text-xl font-semibold mb-2">Best win % (min 3 games)</h3>
    <div class="overflow-x-auto">
      <table class="table">
        <thead><tr><th>#</th><th>Player</th><th>Win %</th><th>Played</th></tr></thead>
        <tbody>
          {#each boards.bestWinPct as r, i}
            <tr><td>{i+1}</td><td>{displayName(r.key)}</td><td>{r.winPct}%</td><td>{r.played}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  </div>


