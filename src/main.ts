import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="weather-app">
    <header class="app-header">
      <p class="eyebrow">Open-Meteo</p>
      <h1>Meteo in un luogo</h1>
      <p class="intro">Cerca una località per vedere il meteo attuale e le previsioni.</p>
    </header>

    <form id="search-form" class="search-form">
      <label for="location-input">Nome del luogo</label>
      <div class="search-controls">
        <input id="location-input" name="location" type="search" placeholder="Es. Roma" autocomplete="off" required />
        <button type="submit">Cerca</button>
      </div>
    </form>

    <section id="weather-results" class="weather-results" aria-live="polite">
      <p class="empty-state">Inserisci una località per iniziare.</p>
    </section>
  </main>
`

