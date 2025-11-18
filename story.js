// story.js
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const all = JSON.parse(localStorage.getItem("brief_allstories") || "[]");
  const s = all.find(x => String(x.id) === String(id));
  if(!s){
    document.getElementById("s-title").innerText = "Story not found.";
    return;
  }
  document.getElementById("s-title").innerText = s.title;
  document.getElementById("s-meta").innerText = `${s.region || ''} • ${s.category || ''} • ${s.verification?.status || 'Unverified'}`;
  document.getElementById("s-image").src = s.image || "data/default.jpg";
  document.getElementById("s-full").innerText = s.full_text || s.summary || "";
  document.getElementById("s-positive").innerText = s.positive_outlook || "—";
  document.getElementById("s-negative").innerText = s.negative_outlook || "—";
  const link = document.getElementById("s-source");
  if(s.source_url){ link.href = s.source_url; link.style.display = "inline-block"; } else link.style.display = "none";
});
