(() => {
  const platforms = {
    macos: {
      label: "macOS",
      available: true,
      url: "https://github.com/Popoyes15/tailblue-app/releases/latest/download/TailBlue-macOS.zip",
      title: "Télécharger TailBlue pour macOS",
      subtitle: "Téléchargement direct",
      help: "Version Alpha · Apple Silicon / macOS"
    },

    windows: {
      label: "Windows",
      available: false,
      url: "",
      title: "TailBlue pour Windows",
      subtitle: "Version bientôt disponible",
      help: "La version Windows de TailBlue est actuellement en préparation."
    }
  };

  const macCard = document.getElementById("platform-macos");
  const windowsCard = document.getElementById("platform-windows");
  const downloadButton = document.getElementById("direct-download-button");
  const buttonTitle = document.getElementById("download-button-title");
  const buttonSubtitle = document.getElementById("download-button-subtitle");
  const detectedOS = document.getElementById("detected-os");
  const successMessage = document.getElementById("download-success");
  const help = document.getElementById("download-help");

  if (
    !macCard ||
    !windowsCard ||
    !downloadButton ||
    !buttonTitle ||
    !buttonSubtitle ||
    !detectedOS
  ) {
    return;
  }

  function detectPlatform() {
    const params = new URLSearchParams(window.location.search);
    const forcedOS = params.get("os")?.toLowerCase();

    if (forcedOS === "windows" || forcedOS === "win") {
      return "windows";
    }

    if (forcedOS === "macos" || forcedOS === "mac") {
      return "macos";
    }

    const platform = (
      navigator.userAgentData?.platform ||
      navigator.platform ||
      navigator.userAgent ||
      ""
    ).toLowerCase();

    if (platform.includes("win")) {
      return "windows";
    }

    if (platform.includes("mac")) {
      return "macos";
    }

    return "macos";
  }

  function selectPlatform(name) {
    const config = platforms[name];

    macCard.classList.toggle("is-selected", name === "macos");
    windowsCard.classList.toggle("is-selected", name === "windows");

    downloadButton.dataset.platform = name;

    buttonTitle.textContent = config.title;
    buttonSubtitle.textContent = config.subtitle;

    if (help) {
      help.textContent = config.help;
    }

    if (config.available) {
      downloadButton.href = config.url;
      downloadButton.classList.remove("is-disabled");
      downloadButton.removeAttribute("aria-disabled");
    } else {
      downloadButton.removeAttribute("href");
      downloadButton.classList.add("is-disabled");
      downloadButton.setAttribute("aria-disabled", "true");
    }
  }

  /* Détection UNE SEULE FOIS au chargement */
  const detectedPlatform = detectPlatform();

  detectedOS.textContent =
    `${platforms[detectedPlatform].label} détecté`;

  /* Sélection automatique de l'OS détecté */
  selectPlatform(detectedPlatform);

  /* Choix manuel : ne change PAS le texte "détecté" */
  macCard.addEventListener("click", () => {
    selectPlatform("macos");
  });

  windowsCard.addEventListener("click", () => {
    selectPlatform("windows");
  });

  downloadButton.addEventListener("click", (event) => {
    const selectedPlatform = downloadButton.dataset.platform;
    const config = platforms[selectedPlatform];

    if (!config?.available) {
      event.preventDefault();

      if (successMessage) {
        successMessage.innerHTML =
          "<span>✦</span> La version Windows arrive bientôt dans le royaume !";

        successMessage.classList.add("is-visible");

        setTimeout(() => {
          successMessage.classList.remove("is-visible");
        }, 3200);
      }

      return;
    }

    if (successMessage) {
      successMessage.innerHTML =
        "<span>✦</span> TailBlue arrive dans vos téléchargements !";

      successMessage.classList.add("is-visible");

      setTimeout(() => {
        successMessage.classList.remove("is-visible");
      }, 3800);
    }
  });
})();
