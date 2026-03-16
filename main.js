

const cfg = window.CopyflixConfig || {};
console.log(cfg.baseUrl);
console.log(cfg.apiKey);
console.log(cfg.imageBaseUrl);

async function fetchFromApi(endpoint, params = {}) {
    if (!cfg.baseUrl || !cfg.apiKey) {
        console.warn(
            "[Copyflix] Configure 'baseUrl' em config.js para buscar dados reais da API."
        );
        return null;
    }

    const url = new URL(endpoint, cfg.baseUrl);
    const search = url.searchParams;

    if (cfg.apiKey) {
        search.set("api_key", cfg.apiKey);
    }

    Object.entries(params).forEach(([Key, value]) => {
        if (value != null) search.set(Key, value);
    });

    const headers = { accept: "application/json" };

    try {
        const res = await fetch(url.toString(), { headers });
        if (!res.ok) throw new Error("Erro na requisição: " + res.status);
        return await res.json();
    } catch (err) {
        console.error("[Copyflix] Erro ao buscar dados da API:", err);
        return null;
    } 
}
    function getImageUrl(path) {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        if (!cfg.imageBaseUrl) return path;
        return cfg.imageBaseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    }


    let heroItems = [];
    let heroIndex = 0;
    let heroTimerId = null;

    function renderHero() {
        const item = heroItems[heroIndex];
        const titleEl = document.getElementById("hero-title");
        const overviewEl = document.getElementById("hero-overview");
        const backgroundEl = document.getElementById("hero-background");
        const paginationEl = document.getElementById("hero-pagination");

        if (!item) {
    titleEl.textContent = "Nenhum destaque disponível";
    overviewEl.textContent =
      "Configure a API em config.js para carregar filmes reais.";
    backgroundEl.style.backgroundImage =
      "linear-gradient(120deg, #111 0%, #222 50%, #000 100%)";
    paginationEl.innerHTML = "";
    return;
  }

   titleEl.textContent = item.title || item.name || "Título desconhecido";
  overviewEl.textContent =
    item.overview ||
    item.description ||
    "Sem sinopse disponível. Conecte a API para ver mais detalhes.";

  const backdrop =
    item.backdrop_path || item.poster_path || item.image || item.banner;
  const bgUrl = getImageUrl(backdrop);
  backgroundEl.style.backgroundImage = bgUrl
    ? `url("${bgUrl}")`
    : "linear-gradient(120deg, #111 0%, #222 50%, #000 100%)";


paginationEl.innerHTML = "";
heroItems.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.className = "hero-dot" + (idx === heroIndex ? " active" : "");
    dot.type = "button";
    dot.addEventListener("click", () => {
        heroIndex = idx;
        restartHeroTimer();
        renderHero();
    });
    paginationEl.appendChild(dot);
 });
}

function nextHero() {
    if (heroItems.length === 0) return;
    heroIndex = (heroIndex + 1) % heroItems.length;
    renderHero();
}

function restartHeroTimer() {
    if (heroTimerId) clearInterval(heroTimerId);
    heroTimerId = setInterval(nextHero, 8000);
}


function createCard(item) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
  const poster = item.poster_path || item.backdrop_path || item.image;
  img.src = getImageUrl(poster);
  img.alt = item.title || item.name || "Capa";

  img.onerror = () => {
    img.src =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='%23000'/><stop offset='1' stop-color='%23181818'/></linearGradient></defs><rect width='400' height='600' fill='url(%23g)'/><text x='50%' y='50%' fill='%23fff' font-size='32' font-family='Arial, sans-serif' text-anchor='middle'>COPYFLIX</text></svg>`
      );
  };

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.name || "";

  card.appendChild(img);
  card.appendChild(title);
  return card;
}

function renderRow(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (!items || !items.length) {
        const placeholder = document.createElement("div");
        placeholder.style.color = "#777";
        placeholder.style.fontSize = "0.85rem";
        placeholder.textContent =
            "Nenhum item carregado. Configure a API em config.js";
        container.appendChild(placeholder);
        return;
    }
    items.forEach((item) => {
        container.appendChild(createCard(item));
    });
}



async function loadData() {
  // Se não houver config de API, apenas registra um aviso e não tenta buscar
  if (!cfg.baseUrl || !cfg.apiKey) {
    console.error(
      "[Copyflix] Defina 'baseUrl' e 'apiKey' em config.js para carregar dados da API."
    );
    heroItems = [];
    renderHero();
    renderRow("row-trending", []);
    renderRow("row-series", []);
    renderRow("row-movies", []);
    return;
  }

  try {
    
    const [trendingRes, seriesRes, moviesRes] = await Promise.all([
      fetchFromApi("trending/all/week", { language: "pt-BR", page: 1 }),
      fetchFromApi("tv/popular", { language: "pt-BR", page: 1 }),
      fetchFromApi("movie/popular", { language: "pt-BR", page: 1 }),
    ]);

    const trending = trendingRes?.results ?? [];
    const series = seriesRes?.results ?? [];
    const movies = moviesRes?.results ?? [];

    // Destaque usa os primeiros itens de "trending"
    heroItems = trending.slice(0, 5);
    renderHero();

    // Listas
    renderRow("row-trending", trending.slice(0, 18));
    renderRow("row-series", series.slice(0, 18));
    renderRow("row-movies", movies.slice(0, 18));
    restartHeroTimer();
  } catch (error) {
    console.error("[Copyflix] Falha ao carregar dados da API:", error);
    heroItems = [];
    renderHero();
    renderRow("row-trending", []);
    renderRow("row-series", []);
    renderRow("row-movies", []);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});


