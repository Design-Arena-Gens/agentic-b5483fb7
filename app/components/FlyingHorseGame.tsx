"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Vector = {
  x: number;
  y: number;
};

type Horseman = {
  id: number;
  name: string;
  color: string;
  trailColor: string;
  accent: string;
  position: Vector;
  velocity: Vector;
  targetTilt: number;
  tilt: number;
  score: number;
};

type Orb = {
  id: number;
  position: Vector;
  velocity: Vector;
  pulse: number;
  pulseDir: number;
};

type Cloud = {
  id: number;
  position: Vector;
  size: number;
  speed: number;
  opacity: number;
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 560;
const HORSEMAN_ACCEL = 0.24;
const HORSEMAN_FRICTION = 0.985;
const HORSEMAN_MAX_SPEED = 7.4;
const ORB_RESPAWN_TIME = 12000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distance(a: Vector, b: Vector) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function FlyingHorseGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();
  const [activeHorseman, setActiveHorseman] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const horsemenRef = useRef<Horseman[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const pressedKeys = useRef<Record<string, boolean>>({});

  const palette = useMemo(
    () => [
      {
        color: "#ff8c69",
        trailColor: "rgba(255,160,122,0.65)",
        accent: "#ffd8a8",
        name: "Aurora"
      },
      {
        color: "#6ec3ff",
        trailColor: "rgba(110,195,255,0.65)",
        accent: "#b8e2ff",
        name: "Zephyr"
      },
      {
        color: "#b992ff",
        trailColor: "rgba(185,146,255,0.65)",
        accent: "#e3c8ff",
        name: "Nyx"
      },
      {
        color: "#7be78a",
        trailColor: "rgba(123,231,138,0.65)",
        accent: "#c6f7d4",
        name: "Pyrros"
      }
    ],
    []
  );

  useEffect(() => {
    horsemenRef.current = palette.map((colors, index) => ({
      id: index,
      name: colors.name,
      color: colors.color,
      trailColor: colors.trailColor,
      accent: colors.accent,
      position: {
        x: CANVAS_WIDTH / 2 + (index - 1.5) * 120,
        y: CANVAS_HEIGHT / 2 + (index % 2 === 0 ? -60 : 60)
      },
      velocity: { x: randomRange(-1, 1), y: randomRange(-1, 1) },
      tilt: 0,
      targetTilt: 0,
      score: 0
    }));

    orbsRef.current = Array.from({ length: 6 }).map((_, idx) => ({
      id: idx,
      position: {
        x: randomRange(80, CANVAS_WIDTH - 80),
        y: randomRange(80, CANVAS_HEIGHT - 80)
      },
      velocity: {
        x: randomRange(-0.4, 0.4),
        y: randomRange(-0.3, 0.3)
      },
      pulse: randomRange(0.5, 1),
      pulseDir: Math.random() > 0.5 ? 1 : -1
    }));

    cloudsRef.current = Array.from({ length: 12 }).map((_, idx) => ({
      id: idx,
      position: {
        x: randomRange(0, CANVAS_WIDTH),
        y: randomRange(0, CANVAS_HEIGHT)
      },
      size: randomRange(120, 240),
      speed: randomRange(0.2, 0.6),
      opacity: randomRange(0.05, 0.14)
    }));
  }, [palette]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current[event.key.toLowerCase()] = true;

      if (event.key >= "1" && event.key <= "4") {
        const idx = Number(event.key) - 1;
        setActiveHorseman(idx);
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    let orbTimer = 0;

    const step = (timestamp: number) => {
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      setElapsed((prev) => prev + delta);
      orbTimer += delta;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx);
      updateClouds(ctx, delta);
      updateHorsemen(delta);
      updateOrbs(delta, orbTimer, () => {
        orbTimer = 0;
      });
      drawHorsemen(ctx);
      drawOrbs(ctx);
      drawUI(ctx);

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHorseman]);

  const updateClouds = (ctx: CanvasRenderingContext2D, delta: number) => {
    cloudsRef.current.forEach((cloud) => {
      cloud.position.x += cloud.speed * (delta / 16);
      if (cloud.position.x - cloud.size > CANVAS_WIDTH) {
        cloud.position.x = -cloud.size;
        cloud.position.y = randomRange(0, CANVAS_HEIGHT);
      }

      const gradient = ctx.createRadialGradient(
        cloud.position.x,
        cloud.position.y,
        cloud.size * 0.2,
        cloud.position.x,
        cloud.position.y,
        cloud.size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cloud.position.x, cloud.position.y, cloud.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#05274a");
    gradient.addColorStop(0.45, "#0e4f78");
    gradient.addColorStop(0.8, "#5ab5d6");
    gradient.addColorStop(1, "#c7f0ff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < 5; i += 1) {
      const y = (Math.sin((elapsed / 1500 + i) * 0.6) * 60 + CANVAS_HEIGHT / 2) / 1.1;
      ctx.fillRect(0, y + i * 80, CANVAS_WIDTH, 2);
    }
  };

  const updateHorsemen = (delta: number) => {
    const currentHorsemen = horsemenRef.current;
    const active = currentHorsemen[activeHorseman];

    const horizontal = (pressedKeys.current["arrowright"] ? 1 : 0) - (pressedKeys.current["arrowleft"] ? 1 : 0);
    const vertical = (pressedKeys.current["arrowdown"] ? 1 : 0) - (pressedKeys.current["arrowup"] ? 1 : 0);
    const boost = pressedKeys.current[" "] || pressedKeys.current["shift"] ? 1.4 : 1;

    if (active) {
      const acceleration = HORSEMAN_ACCEL * boost;
      active.velocity.x += horizontal * acceleration;
      active.velocity.y += vertical * acceleration;
      if (horizontal || vertical) {
        active.targetTilt = clamp(active.targetTilt + horizontal * 0.06, -0.45, 0.45);
      } else {
        active.targetTilt *= 0.88;
      }
    }

    currentHorsemen.forEach((horseman, index) => {
      if (!horseman) return;

      if (index !== activeHorseman) {
        // Gentle flocking behavior so they feel alive.
        const dx = active.position.x - horseman.position.x;
        const dy = active.position.y - horseman.position.y;
        horseman.velocity.x += dx * 0.0006;
        horseman.velocity.y += dy * 0.0006;

        const wander = Math.sin(performance.now() / 800 + index * 1.3);
        horseman.velocity.x += wander * 0.03;
        horseman.targetTilt = clamp(wander * 0.4, -0.45, 0.45);
      }

      horseman.velocity.x = clamp(horseman.velocity.x, -HORSEMAN_MAX_SPEED, HORSEMAN_MAX_SPEED);
      horseman.velocity.y = clamp(horseman.velocity.y, -HORSEMAN_MAX_SPEED, HORSEMAN_MAX_SPEED);

      horseman.position.x += horseman.velocity.x * (delta / 16);
      horseman.position.y += horseman.velocity.y * (delta / 16);

      horseman.velocity.x *= HORSEMAN_FRICTION;
      horseman.velocity.y *= HORSEMAN_FRICTION;

      if (horseman.position.x < 40 || horseman.position.x > CANVAS_WIDTH - 40) {
        horseman.velocity.x *= -0.7;
        horseman.position.x = clamp(horseman.position.x, 40, CANVAS_WIDTH - 40);
      }
      if (horseman.position.y < 50 || horseman.position.y > CANVAS_HEIGHT - 100) {
        horseman.velocity.y *= -0.7;
        horseman.position.y = clamp(horseman.position.y, 50, CANVAS_HEIGHT - 100);
      }

      horseman.tilt += (horseman.targetTilt - horseman.tilt) * 0.18;
    });
  };

  const updateOrbs = (delta: number, orbTimer: number, onRespawn: () => void) => {
    const orbs = orbsRef.current;
    orbs.forEach((orb) => {
      orb.position.x += orb.velocity.x * (delta / 16);
      orb.position.y += orb.velocity.y * (delta / 16);
      orb.pulse += orb.pulseDir * 0.01;
      if (orb.pulse < 0.5 || orb.pulse > 1.2) {
        orb.pulseDir *= -1;
      }

      if (orb.position.x < 50 || orb.position.x > CANVAS_WIDTH - 50) {
        orb.velocity.x *= -1;
      }
      if (orb.position.y < 50 || orb.position.y > CANVAS_HEIGHT - 50) {
        orb.velocity.y *= -1;
      }
    });

    horsemenRef.current.forEach((horseman) => {
      orbs.forEach((orb) => {
        if (distance(horseman.position, orb.position) < 42) {
          horseman.score += 1;
          orb.position.x = -999;
          orb.position.y = -999;
          orb.velocity.x = 0;
          orb.velocity.y = 0;
        }
      });
    });

    if (orbTimer > ORB_RESPAWN_TIME) {
      orbs.forEach((orb) => {
        if (orb.position.x === -999) {
          orb.position = {
            x: randomRange(80, CANVAS_WIDTH - 80),
            y: randomRange(80, CANVAS_HEIGHT - 160)
          };
          orb.velocity = {
            x: randomRange(-0.5, 0.5),
            y: randomRange(-0.4, 0.4)
          };
        }
      });
      onRespawn();
    }
  };

  const drawHorsemen = (ctx: CanvasRenderingContext2D) => {
    horsemenRef.current.forEach((horseman, idx) => {
      ctx.save();
      ctx.translate(horseman.position.x, horseman.position.y);
      ctx.rotate(horseman.tilt);

      const scale = 1 + Math.min(horseman.score, 20) * 0.02;
      ctx.scale(scale, scale);

      // Wing glow trail
      ctx.fillStyle = horseman.trailColor;
      ctx.beginPath();
      ctx.ellipse(-45, 0, 40, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = horseman.color;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-4, -12, 24, -8);
      ctx.quadraticCurveTo(32, 4, 10, 16);
      ctx.quadraticCurveTo(-2, 20, -18, 0);
      ctx.fill();

      // Head
      ctx.fillStyle = horseman.accent;
      ctx.beginPath();
      ctx.ellipse(22, -6, 10, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = horseman.accent;
      ctx.beginPath();
      ctx.moveTo(-20, -6);
      ctx.quadraticCurveTo(-48, -26, -70, -4);
      ctx.quadraticCurveTo(-46, -10, -28, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-20, 6);
      ctx.quadraticCurveTo(-46, 20, -60, 18);
      ctx.quadraticCurveTo(-38, 10, -24, -2);
      ctx.fill();

      // Rider silhouette
      ctx.fillStyle = "#0a1825";
      ctx.beginPath();
      ctx.arc(4, -12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-2, -12, 8, 12);

      if (idx === activeHorseman) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 62, 38, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  const drawOrbs = (ctx: CanvasRenderingContext2D) => {
    orbsRef.current.forEach((orb) => {
      if (orb.position.x === -999) return;
      const gradient = ctx.createRadialGradient(
        orb.position.x,
        orb.position.y,
        6 * orb.pulse,
        orb.position.x,
        orb.position.y,
        28 * orb.pulse
      );
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.3, "rgba(255,240,200,0.85)");
      gradient.addColorStop(1, "rgba(255,200,120,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(orb.position.x, orb.position.y, 28 * orb.pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.font = "18px 'Space Grotesk', sans-serif";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(20, 28, 40, 0.9)";
    ctx.fillText("Arrow Keys to steer • Shift/Space to boost • 1-4 to swap riders", 20, 18);

    horsemenRef.current.forEach((horseman, idx) => {
      const x = 20 + idx * 220;
      const y = CANVAS_HEIGHT - 68;
      ctx.fillStyle = "rgba(8,18,28,0.55)";
      ctx.fillRect(x - 10, y - 10, 200, 54);
      ctx.fillStyle = idx === activeHorseman ? "#ffffff" : "rgba(255,255,255,0.7)";
      ctx.font = "20px 'Space Grotesk', sans-serif";
      ctx.fillText(`${idx + 1}. ${horseman.name}`, x, y);
      ctx.font = "16px 'Space Grotesk', sans-serif";
      ctx.fillStyle = horseman.accent;
      ctx.fillText(`Sky Orbs: ${horseman.score}`, x, y + 24);
    });

    ctx.restore();
  };

  return (
    <div className="game-shell">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        role="presentation"
      />
    </div>
  );
}
