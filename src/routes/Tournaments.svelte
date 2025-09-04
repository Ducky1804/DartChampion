<script>
  import { db } from '../lib/firebase'
  import { collection, getDocs, query, orderBy } from 'firebase/firestore'
  import { navigateTo } from '../lib/router'
  let tournaments = []
  
  async function load() {
    const snap = await getDocs(query(collection(db, 'championships'), orderBy('createdAt', 'desc')))
    tournaments = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
  load()
</script>

<div class="grid md:grid-cols-2 gap-4">
  {#each tournaments as t}
    <div class="card bg-base-200 hover:shadow-lg">
      <div class="card-body">
        <div class="flex justify-between items-center">
          <h3 class="card-title">{t.name || 'Championship'}</h3>
        </div>
        <p>Players: {t.players.length}</p>
        <div class="card-actions justify-end">
          <button class="btn btn-primary" on:click={() => navigateTo(`/tournament?id=${t.id}`)}>Open</button>
        </div>
      </div>
    </div>
  {/each}
</div>


