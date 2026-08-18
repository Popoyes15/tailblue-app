
(() => {
  // Reveal on scroll
  const reveals = [...document.querySelectorAll(".reveal")];

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    reveals.forEach((item) => observer.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add("is-visible"));
  }

  // Realm cards: gentle mouse glow position
  document.querySelectorAll(".realm-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--rx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--ry", `${event.clientY - rect.top}px`);
    });
  });

  // Feature filters
  const filters = [...document.querySelectorAll(".feature-filter")];
  const modules = [...document.querySelectorAll(".module-card")];

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      filters.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      modules.forEach((card) => {
        const group = card.dataset.group || "";
        const visible = filter === "all" || group === filter;
        card.classList.toggle("hidden-module", !visible);
      });
    });
  });

  // Roadmap. Today it reads a local JSON file.
  // Later, replace this URL with a public TailBlue API route.
  const timeline = document.getElementById("roadmapTimeline");

  if (timeline) {
    const source =
      document.body.dataset.roadmapSource ||
      "./roadmap.json";

    fetch(source, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Roadmap HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((roadmap) => {
        renderRoadmap(roadmap);
      })
      .catch((error) => {
        console.error(error);
        timeline.innerHTML = `
          <div class="phase-card">
            <h3>Roadmap indisponible</h3>
            <p>Impossible de charger les données pour le moment.</p>
          </div>
        `;
      });
  }

  function renderRoadmap(roadmap) {
    const phases = Array.isArray(roadmap.phases) ? roadmap.phases : [];

    let totalItems = 0;
    let score = 0;

    phases.forEach((phase) => {
      (phase.items || []).forEach((item) => {
        totalItems += 1;

        if (item.status === "done") score += 1;
        if (item.status === "doing") score += 0.5;
      });
    });

    const overall =
      totalItems > 0
        ? Math.round((score / totalItems) * 100)
        : 0;

    const overallValue =
      document.getElementById("roadmapOverallValue");

    const overallFill =
      document.getElementById("roadmapOverallFill");

    if (overallValue) {
      overallValue.textContent = `${overall}%`;
    }

    if (overallFill) {
      requestAnimationFrame(() => {
        overallFill.style.width = `${overall}%`;
      });
    }

    timeline.innerHTML = "";

    phases.forEach((phase, index) => {
      const phaseItems = phase.items || [];
      let phaseScore = 0;

      phaseItems.forEach((item) => {
        if (item.status === "done") phaseScore += 1;
        if (item.status === "doing") phaseScore += 0.5;
      });

      const percentage =
        phaseItems.length > 0
          ? Math.round((phaseScore / phaseItems.length) * 100)
          : 0;

      const statusText = {
        done: "Terminé",
        doing: "En cours",
        todo: "À venir",
      };

      const phaseEl = document.createElement("article");
      phaseEl.className = "roadmap-phase reveal";

      phaseEl.innerHTML = `
        <div class="phase-dot">${phase.icon || index + 1}</div>
        <div class="phase-card">
          <div class="phase-top">
            <div>
              <h3>${escapeHtml(phase.title || "Phase")}</h3>
              <p>${escapeHtml(phase.description || "")}</p>
            </div>
            <div class="phase-percent">${percentage}%</div>
          </div>

          <div class="progress-track">
            <div class="progress-fill" style="width:${percentage}%"></div>
          </div>

          <div class="phase-items">
            ${phaseItems
              .map(
                (item) => `
                  <div class="phase-item ${item.status}">
                    <i></i>
                    <span>${escapeHtml(item.label)}</span>
                    <b>${statusText[item.status] || item.status}</b>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `;

      timeline.appendChild(phaseEl);

      requestAnimationFrame(() => {
        phaseEl.classList.add("is-visible");
      });
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
