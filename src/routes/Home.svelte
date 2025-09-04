<script>
  import { userStore } from '../lib/authStore'
  let user
</script>

<div class="prose max-w-none">
  <h2>Welcome { $userStore ? $userStore.email : 'to DartChampion'}</h2>
  <p>Track players, record results, and see the leaderboard.</p>
</div>

<div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
  <a href="/setup" class="card bg-base-200 hover:shadow-lg">
    <div class="card-body">
      <h3 class="card-title">Setup Championship</h3>
      <p>Choose player count and create profiles.</p>
    </div>
  </a>
  <a href="/results" class="card bg-base-200 hover:shadow-lg">
    <div class="card-body">
      <h3 class="card-title">Enter Results</h3>
      <p>Log games and keep scores updated.</p>
    </div>
  </a>
  <a href="/leaderboard" class="card bg-base-200 hover:shadow-lg">
    <div class="card-body">
      <h3 class="card-title">Leaderboard</h3>
      <p>See standings across all players.</p>
    </div>
  </a>
  </div>


