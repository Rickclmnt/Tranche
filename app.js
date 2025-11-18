// app.js - main feed logic
document.addEventListener("DOMContentLoaded", async () => {
  const categoriesEl = document.getElementById("categories");
  const billboardEl = document.getElementById("billboard");
  const contentEl = document.getElementById("content");
  const chartSection = document.getElementById("chart-section");
  const profileBtn = document.getElementById("profileBtn");

  profileBtn.addEventListener("click", () => location.href = "profile.html");

  const endpoints = {
    breaking: "dummy_breaking.json", //../data/breaking_feed.json",
    daily: "dummy_daily.json", //../data/daily_brief.json",
    weekly: "dummy_weekly.json" //../data/weekly_brief.json"
  };

  // categories
  const categories = ["World","Tech","Politics","Science","Business","Sports","Culture"];
  let currentCategory = "World";
  let currentFeedType = "breaking";
  let currentData = [];

function renderCategories() {
  const searchBtn = document.createElement("div");
  searchBtn.className = "cat";
  searchBtn.style.fontWeight = "700";
  searchBtn.style.border = "1px solid var(--accent)";
  searchBtn.style.color = "var(--accent)";
  searchBtn.textContent = "Search";
  searchBtn.addEventListener("click", openSearchOverlay);
  categoriesEl.appendChild(searchBtn);

  categories.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "cat" + (i===0 ? " active" : "");
    el.textContent = c;
    el.addEventListener("click", () => {
      document.querySelectorAll(".cat").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
      currentCategory = c;
      renderFeed(currentData);
      closeSearchOverlay();
    });
    categoriesEl.appendChild(el);
  });
}

renderCategories();

  // load breaking by default
  await loadFeed("breaking");

  async function loadFeed(type){
    currentFeedType = type;
    contentEl.innerHTML = "<p>Loading…</p>";
    billboardEl.innerHTML = "";
    chartSection.style.display = "none";

    try{
      const res = await fetch(endpoints[type]);
      if(!res.ok) throw new Error("Feed fetch failed");
      const data = await res.json();
      // normalize and save a merged list for story pages
      currentData = normalize(type, data);
      // store all stories globally for story page lookup
      localStorage.setItem("brief_allstories", JSON.stringify(currentData));
      // billboard only for breaking
      if(type === "breaking"){
        renderBillboard(data.breaking || []);
      } else {
        billboardEl.innerHTML = "";
      }
      renderFeed(currentData);
      if(type === "weekly"){
        chartSection.style.display = "block";
        renderTrajectory(data);
      }
    }catch(e){
      contentEl.innerHTML = "<p>Failed to load feed.</p>";
      console.error(e);
    }
  }

  function normalize(type, data){
    if(!data) return [];
    if(type === "breaking") return data.breaking || [];
    if(type === "daily") return data.top_events || [];
    if(type === "weekly") return (data.top_positive || []).concat(data.top_negative || []);
    return [];
  }

  // render billboard
  function renderBillboard(list){
    billboardEl.innerHTML = "";
    if(!list.length) return;
    list.slice(0,5).forEach((s, idx) => {
      const slide = document.createElement("div");
      slide.className = "billboard-slide" + (idx===0 ? " active" : "");
      slide.style.backgroundImage = `url(${s.image || 'data/default.jpg'})`;
      slide.innerHTML = `<div class="billboard-text"><h2>${s.title}</h2><div style="font-size:13px">${s.region} • ${s.category || ''} • ${s.verification?.status||'Unverified'}</div></div>`;
      billboardEl.appendChild(slide);
      slide.addEventListener("click", () => {
        s.id = s.id || crypto.randomUUID();
        // ensure stored
        saveStoryToAll(s);
        location.href = `story.html?id=${encodeURIComponent(s.id)}`;
      });
    });

    let i = 0;
    setInterval(()=> {
      const slides = billboardEl.querySelectorAll(".billboard-slide");
      if(!slides.length) return;
      slides.forEach(sl => sl.classList.remove("active"));
      i = (i+1) % slides.length;
      slides[i].classList.add("active");
    }, 5000);
  }

  // render feed list
  function renderFeed(list){
    contentEl.innerHTML = "";
    const filtered = list.filter(s => (s.category || "World").toLowerCase() === currentCategory.toLowerCase());
    if(!filtered.length){
      contentEl.innerHTML = `<p>No stories for ${currentCategory}.</p>`;
      return;
    }
    filtered.forEach(s => {
      s.id = s.id || crypto.randomUUID();
      // ensure allstories saved
      saveStoryToAll(s);
      const div = document.createElement("div");
      div.className = "story";
      div.innerHTML = `<h3>${s.title}</h3><div class="meta">${s.region || ''} • ${s.category || ''} • ${s.verification?.status||'Unverified'}</div><p>${s.summary||''}</p>`;
      // click to story page
      div.querySelector("h3").addEventListener("click", () => location.href = `story.html?id=${encodeURIComponent(s.id)}`);
      // follow button
      const btn = document.createElement("button");
      btn.className = "follow-btn";
      btn.textContent = isFollowed(s) ? "Following" : "Follow";
      if(isFollowed(s)) btn.classList.add("active");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFollow(s, btn);
      });
      div.appendChild(btn);
      contentEl.appendChild(div);
    });
  }

  // follow system
  function getWatchlist(){ return JSON.parse(localStorage.getItem("brief_watchlist") || "[]"); }
  function saveWatchlist(list){ localStorage.setItem("brief_watchlist", JSON.stringify(list)); }

  function isFollowed(story){
    const wl = getWatchlist();
    return wl.some(w=>w.id === story.id);
  }
  function toggleFollow(story, btn){
    const wl = getWatchlist();
    const idx = wl.findIndex(w=>w.id === story.id);
    if(idx>=0){ wl.splice(idx,1); btn.textContent = "Follow"; btn.classList.remove("active"); }
    else { wl.push(story); btn.textContent = "Following"; btn.classList.add("active"); }
    saveWatchlist(wl);
  }

  function saveStoryToAll(s){
    const all = JSON.parse(localStorage.getItem("brief_allstories") || "[]");
    if(!all.some(a=>a.id === s.id)){ all.push(s); localStorage.setItem("brief_allstories", JSON.stringify(all)); }
  }

  // trajectory chart
  function renderTrajectory(data){
    const pts = data.trajectory_points || [];
    const ctx = document.getElementById("trajectoryChart").getContext("2d");
    if(window.__trajChart) window.__trajChart.destroy();
    window.__trajChart = new Chart(ctx, {
      type:'line',
      data:{ labels: pts.map(p=>p.date), datasets:[{label:'Civilization trajectory', data:pts.map(p=>p.score), borderColor: '#00bfff', tension:0.3}] },
      options:{ scales:{ y:{min:0,max:1} } }
    });
  }

  // expose a small UI to switch feed types easily (for debugging)
  window.loadBreaking = () => loadFeed("breaking");
  window.loadDaily = () => loadFeed("daily");
  window.loadWeekly = () => loadFeed("weekly");
});

// ===== GLOBAL SEARCH =====
const searchOverlay = document.getElementById("searchOverlay");
const globalSearchInput = document.getElementById("globalSearchInput");
const searchResults = document.getElementById("searchResults");
const closeSearch = document.getElementById("closeSearch");

function openSearchOverlay(){
  searchOverlay.style.display = "block";
  globalSearchInput.focus();
}

function closeSearchOverlay(){
  searchOverlay.style.display = "none";
  searchResults.innerHTML = "";
  globalSearchInput.value = "";
}

closeSearch.addEventListener("click", closeSearchOverlay);

// live search
globalSearchInput.addEventListener("input", () => {
  const q = globalSearchInput.value.toLowerCase().trim();
  if(!q){ searchResults.innerHTML = ""; return; }

  const all = JSON.parse(localStorage.getItem("brief_allstories") || "[]");

  const results = all.filter(s =>
    (s.title || "").toLowerCase().includes(q) ||
    (s.summary || "").toLowerCase().includes(q) ||
    (s.full_text || "").toLowerCase().includes(q)
  );

  renderSearchResults(results);
});

function renderSearchResults(list){
  searchResults.innerHTML = "";

  if(list.length === 0){
    searchResults.innerHTML = "<p>No results found.</p>";
    return;
  }

  list.forEach(s => {
    const div = document.createElement("div");
    div.className = "story";
    div.innerHTML = `
      <h3>${s.title}</h3>
      <div class="meta">${s.region || ""} • ${s.category || ""} • ${s.verification?.status || ""}</div>
      <p>${s.summary || ""}</p>
    `;
    div.addEventListener("click", () => location.href = `story.html?id=${encodeURIComponent(s.id)}`);
    searchResults.appendChild(div);
  });
}
