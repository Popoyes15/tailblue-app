(() => {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = 1;

  const stars = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, force = 1) {
    const count = Math.max(
      1,
      Math.round(2 * force)
    );

    for (let i = 0; i < count; i += 1) {
      stars.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.44,
        size: 0.8 + Math.random() * 2,
        life: 0,
        maxLife: 42 + Math.random() * 55,
        spin: Math.random() * Math.PI,
      });
    }

    if (stars.length > 190) {
      stars.splice(
        0,
        stars.length - 190
      );
    }
  }

  function drawStar(star) {
    const progress =
      star.life / star.maxLife;

    const alpha =
      Math.sin(
        Math.PI *
          Math.min(1, progress)
      ) * 0.9;

    ctx.save();

    ctx.translate(
      star.x,
      star.y
    );

    ctx.rotate(
      star.spin +
        progress * 0.7
    );

    ctx.globalAlpha = alpha;

    const glow =
      ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        star.size * 5
      );

    glow.addColorStop(
      0,
      "rgba(255,255,255,.95)"
    );

    glow.addColorStop(
      0.22,
      "rgba(185,240,255,.72)"
    );

    glow.addColorStop(
      1,
      "rgba(85,190,255,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      star.size * 5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "rgba(245,253,255,.96)";

    ctx.fillRect(
      -star.size * 2.8,
      -0.5,
      star.size * 5.6,
      1
    );

    ctx.fillRect(
      -0.5,
      -star.size * 2.8,
      1,
      star.size * 5.6
    );

    ctx.restore();
  }

  function tick() {
    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    for (
      let i = stars.length - 1;
      i >= 0;
      i -= 1
    ) {
      const star = stars[i];

      star.life += 1;
      star.x += star.vx;
      star.y += star.vy;

      drawStar(star);

      if (
        star.life >=
        star.maxLife
      ) {
        stars.splice(i, 1);
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener(
    "resize",
    resize
  );

  window.addEventListener(
    "pointermove",
    (event) => {
      spawn(
        event.clientX,
        event.clientY,
        1.2
      );
    },
    { passive: true }
  );

  window.addEventListener(
    "pointerdown",
    (event) => {
      for (
        let i = 0;
        i < 8;
        i += 1
      ) {
        spawn(
          event.clientX,
          event.clientY,
          1.7
        );
      }
    },
    { passive: true }
  );

  window.setInterval(() => {
    spawn(
      Math.random() * width,
      55 +
        Math.random() *
          Math.max(
            140,
            height * 0.62
          ),
      0.45
    );
  }, 520);

  resize();
  tick();

  // -------------------------------------------------------------------------
  // FAUSSE APPLICATION TAILBLUE
  //
  // On garde EXACTEMENT :
  // - l'inclinaison 3D
  // - le mouvement souris
  // - le parallax interne
  //
  // On retire seulement le shiny intérieur.
  // -------------------------------------------------------------------------

  const stage =
    document.getElementById(
      "appStage"
    );

  const app = document.getElementById("appWindow");
  const layers = [
    ...document.querySelectorAll(
      ".parallax-card"
    ),
  ];

  if (
    stage &&
    app &&
    window.matchMedia(
      "(pointer:fine)"
    ).matches
  ) {
    let raf = 0;

    // --------------------------------------------------
    // INCLINAISON DE BASE
    // NE PAS CHANGER
    // --------------------------------------------------

    const baseRotateY = -7;
    const baseRotateX = 2;

    // --------------------------------------------------
    // RETOUR À LA POSITION INITIALE
    // --------------------------------------------------

    const resetApp = () => {
      app.style.transform =
        `rotateY(${baseRotateY}deg) ` +
        `rotateX(${baseRotateX}deg) ` +
        `translate(0px, 0px) ` +
        `scale(1)`;

      app.style.boxShadow = `
        0 38px 75px
          rgba(0, 10, 28, .46),

        0 0 0 1px
          rgba(255,255,255,.025),

        0 0 48px
          rgba(38,147,255,.11)
      `;

      app.style.borderColor =
        "rgba(164, 220, 255, .27)";

      layers.forEach(
        (layer) => {
          const depth =
            Number(
              layer.dataset.depth ||
                8
            );

          layer.style.transform =
            "translate(0px, 0px)";
        }
      );
    };

    // --------------------------------------------------
    // MOUVEMENT SOURIS
    // --------------------------------------------------

    stage.addEventListener(
      "pointermove",
      (event) => {
        const rect =
          stage.getBoundingClientRect();

        const nx = Math.max(
          -1,
          Math.min(
            1,
            (
              (event.clientX -
                rect.left) /
                rect.width -
              0.5
            ) * 2
          )
        );

        const ny = Math.max(
          -1,
          Math.min(
            1,
            (
              (event.clientY -
                rect.top) /
                rect.height -
              0.5
            ) * 2
          )
        );

        // ------------------------------------------------
        // NOUVEL EFFET :
        // seulement ombre + aura EXTÉRIEURE
        // aucun reflet sur l'écran
        // ------------------------------------------------

        const shadowX =
          -nx * 24;

        const shadowY =
          38 + ny * 8;

        const glowStrength =
          48 +
          Math.abs(nx) * 18 +
          Math.abs(ny) * 10;

        const glowOpacity =
          0.12 +
          Math.abs(nx) * 0.035 +
          Math.abs(ny) * 0.02;

        const borderAlpha =
          0.27 +
          (
            Math.abs(nx) +
            Math.abs(ny)
          ) * 0.035;

        app.style.boxShadow = `
          ${shadowX}px
          ${shadowY}px
          82px
          rgba(0, 10, 28, .48),

          0 0 0 1px
          rgba(255,255,255,.035),

          0 0
          ${glowStrength}px
          rgba(
            54,
            169,
            255,
            ${glowOpacity}
          )
        `;

        app.style.borderColor =
          `rgba(
            164,
            220,
            255,
            ${borderAlpha}
          )`;

        cancelAnimationFrame(raf);

        raf =
          requestAnimationFrame(
            () => {
              // ------------------------------------------
              // MOUVEMENT 3D ORIGINAL
              // NE PAS CHANGER
              // ------------------------------------------

              const rotateY =
                baseRotateY +
                nx * 15;

              const rotateX =
                baseRotateX -
                ny * 10;

              const moveX =
                nx * 18;

              const moveY =
                ny * 10;

              app.style.transform =
                `rotateY(${rotateY}deg)
                 rotateX(${rotateX}deg)
                 translate(${moveX}px, ${moveY}px)
                 scale(1.015)`;

              // ------------------------------------------
              // PARALLAX INTERNE ORIGINAL
              // NE PAS CHANGER
              // ------------------------------------------

              layers.forEach(
                (layer) => {
                  const depth =
                    Number(
                      layer.dataset
                        .depth || 8
                    );

                  layer.style.transform =
                    `translate(
                      ${nx * depth * 1.25}px,
                      ${ny * depth * 0.8}px
                    )`;
                }
              );
            }
          );
      }
    );

    // --------------------------------------------------
    // QUAND LA SOURIS QUITTE LA FAUSSE APP
    // --------------------------------------------------

    stage.addEventListener(
      "pointerleave",
      () => {
        cancelAnimationFrame(raf);
        resetApp();
      }
    );

    resetApp();
  }

  // -------------------------------------------------------------------------
  // GLOW SUR LES CARTES DU BAS
  // -------------------------------------------------------------------------

  document
    .querySelectorAll(
      "[data-glow]"
    )
    .forEach((card) => {
      card.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            card.getBoundingClientRect();

          card.style.setProperty(
            "--mx",
            `${
              event.clientX -
              rect.left
            }px`
          );

          card.style.setProperty(
            "--my",
            `${
              event.clientY -
              rect.top
            }px`
          );
        }
      );
    });

  // -------------------------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------------------------

  const navLinks = [
    ...document.querySelectorAll(
      ".top-nav a"
    ),
  ];

  navLinks.forEach(
    (link) => {
      link.addEventListener(
        "click",
        () => {
          navLinks.forEach(
            (item) => {
              item.classList.remove(
                "active"
              );
            }
          );

          link.classList.add(
            "active"
          );
        }
      );
    }
  );
})();