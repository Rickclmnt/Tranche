// profile.js
document.addEventListener("DOMContentLoaded", () => {
  const inboxEl = document.getElementById("inbox");
  const mynewsEl = document.getElementById("mynews");
  const searchInput = document.getElementById("profile-search");
  const profileName = document.getElementById("profileName");
  const profileBio = document.getElementById("profileBio");

  // dummy profile
  const profile = JSON.parse(localStorage.getItem("brief_profile") || JSON.stringify({
    name: "Reader",
    bio: "Curious reader"
  }));
  profileName.textContent = profile.name;
  profileBio.textContent = profile.bio;

  // dummy inbox messages
  const inbox = JSON.parse(localStorage.getItem("brief_inbox") || JSON.stringify([
    {from:"Tranche Vericon", text:"Weekly brief ready."},
    {from:"Analyst", text:"Your verify request completed (demo)."}
  ]));
  inbox.forEach(m => {
    const d = document.createElement("div"); d.className = "message"; d.innerHTML = `<b>${m.from}</b><div>${m.text}</div>`;
    inboxEl.appendChild(d);
  });

  function renderMyNews(filter=""){
    mynewsEl.innerHTML = "";
    const wl = JSON.parse(localStorage.getItem("brief_watchlist") || "[]");
    if(!wl.length){ mynewsEl.innerHTML = "<p>No followed stories.</p>"; return; }
    wl.filter(s => (s.title||"").toLowerCase().includes(filter.toLowerCase())).forEach(s => {
      const d = document.createElement("div"); d.className = "story"; d.innerHTML = `<h3>${s.title}</h3><div class="meta">${s.region || ''}</div><p>${s.summary||''}</p>`;
      d.addEventListener("click", ()=> location.href = `story.html?id=${encodeURIComponent(s.id)}`);
      mynewsEl.appendChild(d);
    });
  }

  renderMyNews();
  searchInput.addEventListener("input", e => renderMyNews(e.target.value));
});
