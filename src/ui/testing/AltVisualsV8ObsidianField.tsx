import { useEffect, useMemo, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { deriveAxisMeta, deriveAxisValues, type AxisValues } from './altVisualsAxis';
import type { StatRow } from './types';
import { ALT_VISUALS_V8_THEME, type AltVisualsV8TimelinePhase } from './altVisualsV8Theme';
import {
  fetchAltVisualsV8Manifest,
  resolveAltVisualsV8Assets,
  type AltVisualsV8ResolvedAssets,
} from './altVisualsV8Manifest';
import { useAltVisualsV8Quality, type AltVisualsV8Quality } from './useAltVisualsV8Quality';

const FALLBACK_AXIS_VALUES = {
  enemy: [65, 70, 58, 72, 60],
  player: [70, 75, 68, 74, 66],
} as const;

interface AltVisualsV8ObsidianFieldProps {
  stats: StatRow[];
}

export function AltVisualsV8ObsidianField({ stats }: AltVisualsV8ObsidianFieldProps) {
  const quality = useAltVisualsV8Quality();
  const axisValues = useMemo<AxisValues>(
    () => deriveAxisValues(stats, FALLBACK_AXIS_VALUES.enemy, FALLBACK_AXIS_VALUES.player, ALT_VISUALS_V8_THEME.axisCount),
    [stats],
  );
  const axisMeta = useMemo(
    () => deriveAxisMeta(stats, ALT_VISUALS_V8_THEME.axisMetaFallback, ALT_VISUALS_V8_THEME.axisCount),
    [stats],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const theme = ALT_VISUALS_V8_THEME;
    let disposed = false;
    let teardownScene: (() => void) | undefined;
    let app: PIXI.Application | null = new PIXI.Application();

    container.replaceChildren();
    setStatus('loading');
    setErrorMessage(null);

    const initTask = (async () => {
      try {
        await app!.init({
          width: theme.layout.canvasSize,
          height: theme.layout.canvasSize,
          backgroundAlpha: 1,
          background: hexToNumber('#05070f'),
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          resizeTo: container,
        });
        if (disposed || !app) {
          return;
        }

        const manifest = await fetchAltVisualsV8Manifest();
        if (disposed || !app) {
          return;
        }
        const resolvedAssets = resolveAltVisualsV8Assets(manifest);
        const textures = await loadAltVisualsV8Textures(resolvedAssets);
        if (disposed || !app) {
          return;
        }

        container.appendChild(app.canvas);
        teardownScene = buildObsidianScene({
          app,
          axisValues,
          assets: resolvedAssets,
          textures,
          quality,
        });
        setStatus('ready');
      } catch (error) {
        console.error('[AltVisualsV8] Failed to init scene', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Errore sconosciuto');
      }
    })();

    return () => {
      disposed = true;
      if (teardownScene) {
        teardownScene();
      }
      initTask.finally(() => {
        if (app) {
          app.destroy(true, true);
          app = null;
        }
        container.replaceChildren();
      });
    };
  }, [axisValues, quality]);

  const theme = ALT_VISUALS_V8_THEME;
  const averageEnemy = average(axisValues.enemy);
  const averageHero = average(axisValues.player);

  return (
    <section
      data-testid="alt-visuals-v8"
      className="relative w-full overflow-hidden rounded-4xl border border-white/5 bg-[#03030b] p-6 shadow-[0_40px_120px_rgba(1,2,8,0.65)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(242,201,76,0.18),transparent_65%)] mix-blend-screen" />
      <header className="relative mb-4 flex flex-col gap-1 text-shadow-glow-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-gilded-sand/80">Obsidian Meridian · v8</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">Colonne cinematiche · tar bloom</h3>
            <p className="text-sm text-white/70">contrastiamo il campo nemico con ascese dorate e goo dinamico.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right text-xs text-white/80">
            <div>
              Enemy mean: <span className="font-semibold text-white">{averageEnemy.toFixed(0)}</span>
            </div>
            <div>
              Hero mean: <span className="font-semibold text-gilded-sand">{averageHero.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={containerRef}
        className="relative aspect-square w-full max-w-[720px] overflow-hidden rounded-3xl border border-white/5 bg-black"
        style={{ minHeight: theme.layout.canvasSize / 1.5 }}
      >
        {status !== 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-sm uppercase tracking-[0.2em] text-white/70">
            {status === 'loading' && 'Caricamento assets · Obsidian Meridian'}
            {status === 'error' && (
              <span>
                Errore: <span className="text-rose-200">{errorMessage ?? 'impossibile inizializzare PIΞ'}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-4 grid gap-4 text-xs text-white/80 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Axis focus</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {axisMeta.map((meta) => (
              <li
                key={meta.name}
                className="rounded-xl border border-white/5 bg-black/40 px-3 py-2 font-semibold text-white/80"
              >
                <span className="mr-2 text-gilded-sand">{meta.icon}</span>
                {meta.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Qualità FX</p>
          <div className="mt-2 flex items-center justify-between text-white">
            <span className="text-lg font-semibold uppercase tracking-[0.3em]">{quality}</span>
            <span className="text-xs text-white/70">
              {quality === 'high'
                ? 'FX completi (grain, particelle, bloom)'
                : 'Modalità preview ottimizzata per hardware leggero'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AltVisualsV8ObsidianField;

interface AltVisualsV8TextureBundle {
  enemyAlbedo: PIXI.Texture;
  playerAlbedo: PIXI.Texture;
  gooAlpha: PIXI.Texture;
  particles: PIXI.Texture;
  filmGrain: PIXI.Texture;
  blueNoise?: PIXI.Texture;
}

async function loadAltVisualsV8Textures(assets: AltVisualsV8ResolvedAssets): Promise<AltVisualsV8TextureBundle> {
  const requests: Record<string, string> = {};
  if (assets.columns.enemy.maps.albedo) {
    requests.enemyAlbedo = assets.columns.enemy.maps.albedo;
  }
  if (assets.columns.player.maps.albedo) {
    requests.playerAlbedo = assets.columns.player.maps.albedo;
  }
  if (assets.goo.alpha) {
    requests.gooAlpha = assets.goo.alpha;
  }
  if (assets.background.particles) {
    requests.particles = assets.background.particles;
  }
  if (assets.background.filmGrain) {
    requests.filmGrain = assets.background.filmGrain;
  }
  const blueNoiseKey = Object.keys(assets.blueNoise).sort((a, b) => Number(a) - Number(b))[0];
  if (blueNoiseKey) {
    requests.blueNoise = assets.blueNoise[blueNoiseKey];
  }

  const loaded = Object.keys(requests).length > 0 ? await PIXI.Assets.load<Record<string, PIXI.Texture>>(requests) : {};

  return {
    enemyAlbedo: loaded.enemyAlbedo ?? PIXI.Texture.WHITE,
    playerAlbedo: loaded.playerAlbedo ?? PIXI.Texture.WHITE,
    gooAlpha: loaded.gooAlpha ?? PIXI.Texture.WHITE,
    particles: loaded.particles ?? PIXI.Texture.WHITE,
    filmGrain: loaded.filmGrain ?? PIXI.Texture.WHITE,
    blueNoise: loaded.blueNoise,
  };
}

interface BuildSceneParams {
  app: PIXI.Application;
  axisValues: AxisValues;
  assets: AltVisualsV8ResolvedAssets;
  textures: AltVisualsV8TextureBundle;
  quality: AltVisualsV8Quality;
}

function buildObsidianScene(params: BuildSceneParams) {
  const { app, axisValues, textures, quality } = params;
  const theme = ALT_VISUALS_V8_THEME;

  const stage = app.stage;
  stage.removeChildren();

  const backgroundLayer = new PIXI.Container();
  const columnLayer = new PIXI.Container();
  const puddleLayer = new PIXI.Container();
  const starLayer = new PIXI.Container();
  const fxLayer = new PIXI.Container();

  stage.addChild(backgroundLayer, columnLayer, puddleLayer, starLayer, fxLayer);

  buildBackgroundLayer(backgroundLayer, textures, theme);

  const columns = buildColumns(columnLayer, textures, axisValues, theme);
  const puddle = buildPuddle(puddleLayer, textures, theme);
  const core = buildObsidianCore(starLayer);
  const star = buildHeroStar(starLayer);
  const particles = buildParticles(fxLayer, textures, theme, quality);
  const grain = buildFilmGrain(fxLayer, textures, theme, quality);

  const phases: AltVisualsV8TimelinePhase[] = ['enemyColumns', 'puddleMorph', 'heroAscend', 'settle'];
  const phaseDurations = theme.timings.phaseDurationsMs;
  let phaseIndex = 0;
  let phaseElapsed = 0;
  let totalTime = 0;

  const tickerHandler = (ticker: PIXI.Ticker) => {
    const deltaMs = ticker.deltaMS;
    phaseElapsed += deltaMs;
    totalTime += deltaMs;
    const currentPhase = phases[phaseIndex];
    const currentDuration = phaseDurations[currentPhase];
    if (phaseElapsed > currentDuration) {
      phaseElapsed -= currentDuration;
      phaseIndex += 1;
      if (phaseIndex >= phases.length) {
        phaseIndex = 0;
        phaseElapsed = 0;
        totalTime = 0;
      }
    }
    const phaseProgress = Math.min(1, phaseElapsed / currentDuration);

    updateColumns(columns, axisValues, theme, currentPhase, phaseProgress, totalTime);
    updatePuddle(puddle, axisValues, theme, currentPhase, phaseProgress, totalTime, quality);
    updateObsidianCore(core, theme, totalTime);
    updateHeroStar(star, axisValues, theme, currentPhase, phaseProgress, quality, totalTime);
    updateParticles(particles, theme, deltaMs);
    updateFilmGrain(grain, theme, deltaMs);
  };

  app.ticker.add(tickerHandler);

  return () => {
    app.ticker.remove(tickerHandler);
    [backgroundLayer, columnLayer, puddleLayer, starLayer, fxLayer].forEach((layer) => layer.destroy({ children: true }));
  };
}

interface ColumnVisual {
  core: PIXI.Graphics;
  enemySprite: PIXI.Sprite;
  playerSprite: PIXI.Sprite;
  glow: PIXI.Graphics;
  aura: PIXI.Graphics;
  wobbleSeed: number;
  enemyHeight: number;
  playerHeight: number;
  x: number;
}

function buildColumns(
  layer: PIXI.Container,
  textures: AltVisualsV8TextureBundle,
  axisValues: AxisValues,
  theme: typeof ALT_VISUALS_V8_THEME,
): ColumnVisual[] {
  const { canvasSize, columnThickness } = theme.layout;
  const spacing = canvasSize / (axisValues.enemy.length + 1);
  const bottom = canvasSize - 40;

  return axisValues.enemy.map((enemyValue, index) => {
    const container = new PIXI.Container();
    layer.addChild(container);

    const x = spacing * (index + 1);
    container.position.set(x, bottom);

    const plate = new PIXI.Graphics();
    plate.beginFill(hexToNumber(theme.palette.grid), 0.8);
    plate.drawRoundedRect(-columnThickness * 0.65, 0, columnThickness * 1.3, 12, 6);
    plate.endFill();
    container.addChild(plate);

    const core = new PIXI.Graphics();
    core.alpha = 0.85;
    container.addChild(core);

    const enemySprite = new PIXI.Sprite(textures.enemyAlbedo);
    enemySprite.anchor.set(0.5, 1);
    enemySprite.width = columnThickness;
    enemySprite.height = 0;
    enemySprite.tint = mixColors(theme.palette.obsidian, theme.palette.etherBlue, 0.2);
    enemySprite.alpha = 0.55;
    container.addChild(enemySprite);

    const playerSprite = new PIXI.Sprite(textures.playerAlbedo);
    playerSprite.anchor.set(0.5, 1);
    playerSprite.width = columnThickness * 0.92;
    playerSprite.height = 0;
    playerSprite.alpha = 0;
    playerSprite.tint = hexToNumber(theme.palette.moltenGold);
    playerSprite.blendMode = 'add';
    container.addChild(playerSprite);

    const glow = new PIXI.Graphics();
    glow.alpha = 0.4;
    container.addChild(glow);

    const aura = new PIXI.Graphics();
    aura.alpha = 0.15;
    container.addChildAt(aura, 0);

    return {
      enemySprite,
      playerSprite,
      glow,
      aura,
      core,
      wobbleSeed: index * 0.65,
      enemyHeight: mapStatToHeight(enemyValue, theme.columns.heightRange),
      playerHeight: mapStatToHeight(axisValues.player[index], theme.columns.heightRange) + theme.columns.playerLiftOffset,
      x,
    };
  });
}

function updateColumns(
  columns: ColumnVisual[],
  axisValues: AxisValues,
  theme: typeof ALT_VISUALS_V8_THEME,
  phase: AltVisualsV8TimelinePhase,
  phaseProgress: number,
  totalTime: number,
) {
  const range = theme.columns.heightRange;
  const baseLerp = phase === 'enemyColumns' ? easeExpoOut(phaseProgress) : 0.12;
  const heroLerp = phase === 'heroAscend' || phase === 'settle' ? easeQuartOut(phaseProgress) : 0;

  columns.forEach((column, index) => {
    const enemyTarget = mapStatToHeight(axisValues.enemy[index], range);
    column.enemyHeight = lerp(column.enemyHeight, enemyTarget, 0.08 + baseLerp * 0.6);
    const wobble = Math.sin(totalTime * 0.0018 + column.wobbleSeed) * theme.columns.wobbleAmplitude;
    column.enemySprite.height = Math.max(12, column.enemyHeight + wobble);

    column.core.clear();
    const gradientSteps = 8;
    for (let step = 0; step < gradientSteps; step += 1) {
      const t = step / (gradientSteps - 1);
      const widthFactor = 0.35 + (1 - t) * 0.4;
      const heightFactor = 0.5 + t * 0.45;
      const color = mixColors(theme.palette.obsidian, theme.palette.moltenGold, t * 0.5);
      column.core.beginFill(color, 0.35 + (1 - t) * 0.4);
      column.core.drawRoundedRect(
        (-theme.layout.columnThickness * widthFactor) / 2,
        -column.enemySprite.height * heightFactor,
        theme.layout.columnThickness * widthFactor,
        column.enemySprite.height * heightFactor,
        10,
      );
      column.core.endFill();
    }

    const heroTarget = mapStatToHeight(axisValues.player[index], range) + theme.columns.playerLiftOffset;
    column.playerHeight = lerp(column.playerHeight, heroTarget, 0.04 + heroLerp * 0.5);
    column.playerSprite.height = Math.max(0, column.playerHeight);
    column.playerSprite.alpha = heroLerp * 0.9;

    column.glow.clear();
    if (heroLerp > 0.05) {
      column.glow.beginFill(hexToNumber(theme.palette.moltenGold), 0.35 * heroLerp);
      column.glow.drawEllipse(0, -column.playerSprite.height, theme.layout.columnThickness * 0.7, 22);
      column.glow.endFill();
    }

    column.aura.clear();
    column.aura.beginFill(hexToNumber(theme.palette.etherBlue), 0.12);
    column.aura.drawRect(
      -theme.layout.columnThickness * 0.9,
      -column.enemySprite.height - 16,
      theme.layout.columnThickness * 1.8,
      column.enemySprite.height + 28,
    );
    column.aura.endFill();
  });
}

function buildPuddle(
  layer: PIXI.Container,
  textures: AltVisualsV8TextureBundle,
  theme: typeof ALT_VISUALS_V8_THEME,
) {
  const sprite = new PIXI.Sprite(textures.gooAlpha);
  sprite.anchor.set(0.5);
  sprite.position.set(theme.layout.canvasSize / 2, theme.layout.canvasSize - 50);
  sprite.tint = mixColors(theme.palette.tar, theme.palette.moltenGold, 0.35);
  sprite.alpha = 0.75;
  sprite.blendMode = 'add';
  layer.addChild(sprite);

  const noiseSprite = textures.blueNoise
    ? new PIXI.Sprite(textures.blueNoise)
    : new PIXI.Sprite(PIXI.Texture.WHITE);
  noiseSprite.anchor.set(0.5);
  noiseSprite.alpha = 0.2;
  noiseSprite.tint = hexToNumber(theme.palette.ember);
  layer.addChild(noiseSprite);
  noiseSprite.position.copyFrom(sprite.position);

  return { sprite, noiseSprite };
}

interface ObsidianCore {
  disc: PIXI.Graphics;
  halo: PIXI.Graphics;
}

function buildObsidianCore(layer: PIXI.Container): ObsidianCore {
  const disc = new PIXI.Graphics();
  const halo = new PIXI.Graphics();
  layer.addChild(disc, halo);
  return { disc, halo };
}

function updateObsidianCore(core: ObsidianCore, theme: typeof ALT_VISUALS_V8_THEME, totalTime: number) {
  const center = theme.layout.canvasSize / 2;
  const baseRadius = theme.layout.baseRadius * 0.55;
  const pulse = 1 + Math.sin(totalTime * 0.002) * 0.06;
  const haloPulse = 1 + Math.sin(totalTime * 0.0013 + Math.PI / 4) * 0.12;

  core.disc.clear();
  const gradientSteps = 32;
  for (let i = gradientSteps; i >= 0; i -= 1) {
    const t = i / gradientSteps;
    const radius = baseRadius * pulse * (0.35 + t * 0.65);
    const color = mixColors(theme.palette.moltenGold, theme.palette.ember, t * 0.6);
    core.disc.beginFill(color, 0.25 + t * 0.55);
    core.disc.drawCircle(center, center + 60, radius);
    core.disc.endFill();
  }

  core.halo.clear();
  core.halo.lineStyle(8, hexToNumber(theme.palette.etherBlue), 0.4);
  core.halo.drawCircle(center, center + 60, baseRadius * haloPulse * 1.15);
  core.halo.lineStyle(2, hexToNumber(theme.palette.moltenGold), 0.65);
  core.halo.drawCircle(center, center + 60, baseRadius * haloPulse * 1.3);
}

function updatePuddle(
  puddle: ReturnType<typeof buildPuddle>,
  axisValues: AxisValues,
  theme: typeof ALT_VISUALS_V8_THEME,
  phase: AltVisualsV8TimelinePhase,
  phaseProgress: number,
  totalTime: number,
  quality: AltVisualsV8Quality,
) {
  const radius = theme.puddle.radius;
  const strength = Math.max(0, average(axisValues.enemy) - average(axisValues.player)) / 120;
  const scaleBase = radius / (puddle.sprite.texture.width / 2 || radius);
  const ripple = Math.sin(totalTime * 0.0025) * theme.puddle.displacementAmplitude * 0.01;
  const morphBoost = phase === 'puddleMorph' ? phaseProgress * 0.15 : 0;
  const heroBoost = phase === 'heroAscend' ? phaseProgress * 0.08 : 0;
  const finalScale = scaleBase * (1 + ripple + morphBoost + heroBoost + strength * 0.25);
  puddle.sprite.scale.set(finalScale);
  puddle.sprite.alpha = 0.5 + phaseProgress * 0.25 + strength * 0.35;

  if (puddle.noiseSprite) {
    const noiseScale = finalScale * (quality === 'high' ? 1.1 : 0.9);
    puddle.noiseSprite.scale.set(noiseScale);
    puddle.noiseSprite.rotation = totalTime * 0.0002;
  }
}

function buildHeroStar(layer: PIXI.Container) {
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0;
  layer.addChild(graphics);
  return graphics;
}

function updateHeroStar(
  graphics: PIXI.Graphics,
  axisValues: AxisValues,
  theme: typeof ALT_VISUALS_V8_THEME,
  phase: AltVisualsV8TimelinePhase,
  phaseProgress: number,
  quality: AltVisualsV8Quality,
  totalTime: number,
) {
  const shouldRender = phase === 'heroAscend' || phase === 'settle';
  if (!shouldRender && graphics.alpha < 0.08) {
    graphics.alpha = Math.max(0, graphics.alpha - 0.035);
    graphics.clear();
    return;
  }

  const progress = easeQuartOut(phaseProgress);
  const canvasCenter = theme.layout.canvasSize / 2;
  const radius = theme.layout.baseRadius * 0.75;

  graphics.clear();
  graphics.beginFill(hexToNumber(theme.palette.moltenGold), 0.45 + progress * 0.4);
  for (let i = 0; i < axisValues.player.length * 2; i += 1) {
    const statIdx = Math.floor(i / 2);
    const stat = axisValues.player[statIdx];
    const inner = mapStatToHeight(stat, [radius * 0.2, radius * 0.6]);
    const outer = mapStatToHeight(stat, [radius * 0.5, radius]) + progress * 20;
    const isOuter = i % 2 === 0;
    const angle = -Math.PI / 2 + (Math.PI * i) / axisValues.player.length;
    const r = isOuter ? outer : inner;
    const x = canvasCenter + Math.cos(angle) * r;
    const y = canvasCenter + Math.sin(angle) * r;
    if (i === 0) {
      graphics.moveTo(x, y);
    } else {
      graphics.lineTo(x, y);
    }
  }
  graphics.closePath();
  graphics.endFill();
  graphics.alpha = progress;
  graphics.rotation = Math.sin(totalTime * 0.0004) * 0.05;

  if (quality === 'high' && graphics.filters?.length !== 1) {
    graphics.filters = [new PIXI.BlurFilter(4)];
  } else if (quality !== 'high') {
    graphics.filters = undefined;
  }
}

interface Particle {
  sprite: PIXI.Sprite;
  speed: number;
  drift: number;
}

function buildParticles(
  layer: PIXI.Container,
  textures: AltVisualsV8TextureBundle,
  theme: typeof ALT_VISUALS_V8_THEME,
  quality: AltVisualsV8Quality,
): Particle[] {
  const count =
    quality === 'high'
      ? theme.fx.particleCount
      : Math.max(8, Math.round(theme.fx.particleCount * 0.35));
  const particles: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    const sprite = new PIXI.Sprite(textures.particles);
    sprite.anchor.set(0.5);
    sprite.alpha = 0.25 + Math.random() * 0.4;
    sprite.scale.set(randomBetween(theme.fx.particleScaleRange[0], theme.fx.particleScaleRange[1]) * 0.4);
    sprite.position.set(Math.random() * theme.layout.canvasSize, Math.random() * theme.layout.canvasSize);
    sprite.blendMode = 'screen';
    layer.addChild(sprite);
    particles.push({
      sprite,
      speed: randomBetween(theme.fx.particleSpeedRange[0], theme.fx.particleSpeedRange[1]),
      drift: Math.random() * 0.4 - 0.2,
    });
  }
  return particles;
}

function updateParticles(particles: Particle[], theme: typeof ALT_VISUALS_V8_THEME, deltaMs: number) {
  particles.forEach((particle) => {
    particle.sprite.y -= (particle.speed * deltaMs) / 1000;
    particle.sprite.x += particle.drift * (deltaMs / 16);
    if (particle.sprite.y < -50) {
      particle.sprite.y = theme.layout.canvasSize + 50;
    }
    if (particle.sprite.x > theme.layout.canvasSize + 50) {
      particle.sprite.x = -50;
    } else if (particle.sprite.x < -50) {
      particle.sprite.x = theme.layout.canvasSize + 50;
    }
  });
}

function buildFilmGrain(
  layer: PIXI.Container,
  textures: AltVisualsV8TextureBundle,
  theme: typeof ALT_VISUALS_V8_THEME,
  quality: AltVisualsV8Quality,
) {
  if (quality !== 'high') {
    return null;
  }
  const sprite = new PIXI.TilingSprite({
    texture: textures.filmGrain,
    width: theme.layout.canvasSize,
    height: theme.layout.canvasSize,
  });
  sprite.alpha = theme.fx.grainOpacity;
  sprite.blendMode = 'multiply';
  layer.addChild(sprite);
  return sprite;
}

function updateFilmGrain(grain: PIXI.TilingSprite | null, theme: typeof ALT_VISUALS_V8_THEME, deltaMs: number) {
  if (!grain) return;
  grain.tilePosition.x += theme.fx.grainScrollSpeed * deltaMs;
  grain.tilePosition.y -= theme.fx.grainScrollSpeed * deltaMs;
}

function buildBackgroundLayer(
  layer: PIXI.Container,
  textures: AltVisualsV8TextureBundle,
  theme: typeof ALT_VISUALS_V8_THEME,
) {
  const base = new PIXI.Graphics();
  base.beginFill(hexToNumber('#0f1530'));
  base.drawRect(0, 0, theme.layout.canvasSize, theme.layout.canvasSize);
  base.endFill();
  layer.addChild(base);

  const aurora = new PIXI.Graphics();
  aurora.beginFill(hexToNumber(theme.palette.etherBlue), 0.22);
  aurora.drawEllipse(
    theme.layout.canvasSize * 0.38,
    theme.layout.canvasSize * 0.08,
    theme.layout.canvasSize * 0.6,
    theme.layout.canvasSize * 0.28,
  );
  aurora.endFill();
  aurora.beginFill(hexToNumber(theme.palette.moltenGold), theme.background.hdrContribution + 0.1);
  aurora.drawEllipse(
    theme.layout.canvasSize * 0.68,
    theme.layout.canvasSize * 0.18,
    theme.layout.canvasSize * 0.6,
    theme.layout.canvasSize * 0.32,
  );
  aurora.endFill();
  layer.addChild(aurora);

  const vignette = new PIXI.Graphics();
  vignette.beginFill(0x000000, theme.background.vignetteOpacity);
  vignette.drawRect(0, 0, theme.layout.canvasSize, theme.layout.canvasSize);
  vignette.endFill();
  vignette.blendMode = 'multiply';
  layer.addChild(vignette);

  if (textures.enemyAlbedo) {
    const textureOverlay = new PIXI.Sprite(textures.enemyAlbedo);
    textureOverlay.alpha = 0.08;
    textureOverlay.width = theme.layout.canvasSize;
    textureOverlay.height = theme.layout.canvasSize;
    textureOverlay.blendMode = 'overlay';
    layer.addChild(textureOverlay);
  }

  const grid = new PIXI.Graphics();
  grid.lineStyle(1, hexToNumber(theme.palette.grid), 0.18);
  const step = 80;
  for (let x = 0; x <= theme.layout.canvasSize; x += step) {
    grid.moveTo(x, 0);
    grid.lineTo(x, theme.layout.canvasSize);
  }
  for (let y = 0; y <= theme.layout.canvasSize; y += step) {
    grid.moveTo(0, y);
    grid.lineTo(theme.layout.canvasSize, y);
  }
  grid.blendMode = 'screen';
  layer.addChild(grid);
}

function mapStatToHeight(value: number, range: [number, number]) {
  const clamped = Math.max(0, Math.min(100, value));
  return range[0] + ((range[1] - range[0]) * clamped) / 100;
}

function easeExpoOut(t: number) {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

function easeQuartOut(t: number) {
  return 1 - (1 - t) ** 4;
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * Math.min(1, Math.max(0, alpha));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hexToNumber(hexColor: string) {
  return Number.parseInt(hexColor.replace('#', ''), 16);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function mixColors(hexA: string, hexB: string, t: number) {
  const colorA = hexToNumber(hexA);
  const colorB = hexToNumber(hexB);
  const ar = (colorA >> 16) & 0xff;
  const ag = (colorA >> 8) & 0xff;
  const ab = colorA & 0xff;
  const br = (colorB >> 16) & 0xff;
  const bg = (colorB >> 8) & 0xff;
  const bb = colorB & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}
