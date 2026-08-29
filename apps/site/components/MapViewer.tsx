'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';
import {
  AlertTriangle,
  ChevronLeft,
  Clock3,
  Compass,
  Crosshair,
  Layers3,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import CityPanel from './CityPanel';
import DungeonPanel from './DungeonPanel';
import SpecialLocationPanel from './SpecialLocationPanel';
import styles from './MapViewer.module.css';

type Place = {
  id: string;
  name: string;
  type: 'city' | 'island';
  x: number;
  y: number;
  dangerLevel: string;
  protected?: boolean;
};

type Dungeon = {
  id: string;
  name: string;
  x: number;
  y: number;
  rank: string;
  type: 'common' | 'red';
  status: string;
  rewardWon: number;
  rewardXp: number;
  expiresInDays: number;
  travelTargetId?: string;
  travelTargetName?: string;
  boss?: string;
  description?: string;
};

type Special = {
  id: string;
  name: string;
  x: number;
  y: number;
  location: string;
  kind: string;
  reason?: string;
  travelTargetId?: string;
};

type ViewportSize = { width: number; height: number };

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1280;
const WORLD_ASPECT = WORLD_WIDTH / WORLD_HEIGHT;
const MAJOR_CITIES = new Set(['seoul', 'busan', 'daegu', 'incheon', 'daejeon', 'gwangju', 'ulsan', 'jeju']);

function koreaTime() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const label = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  let phase: 'dawn' | 'day' | 'dusk' | 'night' = 'night';
  if (h >= 5 && h < 7) phase = 'dawn';
  else if (h >= 7 && h < 17) phase = 'day';
  else if (h >= 17 && h < 19) phase = 'dusk';
  return { label, phase };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Falha no servidor (${response.status}).` };
  }
}

function MapControls({ currentLocationId, fitScale }: { currentLocationId: string; fitScale: number }) {
  const { zoomIn, zoomOut, resetTransform, zoomToElement } = useControls();

  return (
    <div className={styles.zoomControls} aria-label="Controles do mapa">
      <button type="button" onClick={() => zoomIn(0.35)} aria-label="Aumentar zoom">
        <Plus />
      </button>
      <button type="button" onClick={() => zoomOut(0.35)} aria-label="Diminuir zoom">
        <Minus />
      </button>
      <button
        type="button"
        onClick={() => zoomToElement(`map-city-${currentLocationId}`, Math.max(fitScale * 2.1, 0.75), 450)}
        aria-label="Centralizar na minha localização"
      >
        <LocateFixed />
      </button>
      <button type="button" onClick={() => resetTransform(450)} aria-label="Mostrar mapa completo">
        <RotateCcw />
      </button>
    </div>
  );
}

export default function MapViewer() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [places, setPlaces] = useState<Place[]>([]);
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [location, setLocation] = useState('seoul');
  const [time, setTime] = useState(koreaTime());
  const [showAllNames, setShowAllNames] = useState(false);
  const [zoomRatio, setZoomRatio] = useState(1);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setViewport({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch('/data/places.json')
      .then(readJson)
      .then((data) => setPlaces(data.places || []));
    fetch('/api/dungeons', { cache: 'no-store' })
      .then(readJson)
      .then((data) => setDungeons(data.active || []));
    fetch('/data/special-locations.json')
      .then(readJson)
      .then((data) => setSpecials(data.locations || []));
    fetch('/api/me', { cache: 'no-store' })
      .then(readJson)
      .then((data) => {
        if (data?.location?.city_id) setLocation(data.location.city_id);
      });

    const timer = window.setInterval(() => setTime(koreaTime()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const current = useMemo(() => places.find((place) => place.id === location), [places, location]);

  const fitScale = useMemo(() => {
    if (!viewport.width || !viewport.height) return 0.4;
    return Math.min(viewport.width / WORLD_WIDTH, viewport.height / WORLD_HEIGHT);
  }, [viewport]);

  const minScale = Math.max(0.08, fitScale * 0.94);
  const maxScale = Math.max(4.2, fitScale * 8.5);
  const wrapperKey = `${Math.round(viewport.width)}x${Math.round(viewport.height)}`;

  const travel = async (id: string) => {
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cityId: id }),
    });
    if (response.ok) setLocation(id);
  };

  const participate = async (id: string, action: 'arrive' | 'enter') => {
    const response = await fetch(`/api/dungeons/${id}/participation`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const data = await readJson(response);
      alert(data.error || 'Não foi possível registrar a participação.');
      return;
    }
    if (action === 'enter') setSelectedDungeon(null);
  };

  const selectPlace = (place: Place) => {
    setSelectedDungeon(null);
    setSelectedSpecial(null);
    setSelected(place);
  };

  const selectDungeon = (dungeon: Dungeon) => {
    setSelected(null);
    setSelectedSpecial(null);
    setSelectedDungeon(dungeon);
  };

  const selectSpecial = (place: Special) => {
    setSelected(null);
    setSelectedDungeon(null);
    setSelectedSpecial(place);
  };

  const showCityName = (place: Place) =>
    showAllNames || place.id === location || MAJOR_CITIES.has(place.id) || zoomRatio >= 1.85;

  return (
    <main ref={shellRef} className={`${styles.shell} ${styles[`phase_${time.phase}`]}`}>
      <div className={styles.mapBackdrop} aria-hidden="true" />

      {viewport.width > 0 && viewport.height > 0 && (
        <TransformWrapper
          key={wrapperKey}
          initialScale={fitScale}
          minScale={minScale}
          maxScale={maxScale}
          centerOnInit
          centerZoomedOut
          limitToBounds
          wheel={{ step: 0.09, smooth: true }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          panning={{ velocityDisabled: false, excluded: ['world-map-action'] }}
          onTransformed={(_, state) => setZoomRatio(state.scale / Math.max(fitScale, 0.001))}
        >
          <TransformComponent wrapperClass={styles.viewport} contentClass={styles.transformContent}>
            <div
              className={styles.world}
              style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT, aspectRatio: WORLD_ASPECT }}
              aria-label="Mapa interativo da Coreia do Sul"
            >
              <img
                className={styles.mapImage}
                src="/mapa-coreia.png"
                alt="Mapa completo da Coreia do Sul"
                draggable={false}
                decoding="async"
                fetchPriority="high"
              />
              <div className={styles.atmosphere} aria-hidden="true" />
              <div className={styles.grid} aria-hidden="true" />

              {places.map((place) => {
                const isCurrent = place.id === location;
                const isMajor = MAJOR_CITIES.has(place.id);
                return (
                  <button
                    id={`map-city-${place.id}`}
                    key={place.id}
                    type="button"
                    className={`world-map-action ${styles.marker} ${styles.cityMarker} ${
                      place.type === 'island' ? styles.islandMarker : ''
                    } ${place.protected ? styles.protectedMarker : ''} ${isCurrent ? styles.currentMarker : ''}`}
                    style={{ left: `${place.x}%`, top: `${place.y}%` }}
                    onClick={() => selectPlace(place)}
                    aria-label={`Abrir ${place.name}`}
                  >
                    <span className={styles.markerPulse} aria-hidden="true" />
                    <span className={styles.markerCore} aria-hidden="true">
                      {isCurrent ? <Crosshair /> : place.protected ? <Shield /> : <MapPin />}
                    </span>
                    <span
                      className={`${styles.markerLabel} ${showCityName(place) ? styles.markerLabelVisible : ''} ${
                        isMajor ? styles.majorLabel : ''
                      }`}
                    >
                      {isCurrent && <small>VOCÊ</small>}
                      <b>{place.name}</b>
                    </span>
                  </button>
                );
              })}

              {specials.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className={`world-map-action ${styles.marker} ${styles.specialMarker}`}
                  style={{ left: `${place.x}%`, top: `${place.y}%` }}
                  onClick={() => selectSpecial(place)}
                  aria-label={`Abrir ${place.name}`}
                >
                  <span className={styles.specialGlow} aria-hidden="true" />
                  <span className={styles.markerCore} aria-hidden="true">
                    <Sparkles />
                  </span>
                  <span
                    className={`${styles.markerLabel} ${
                      showAllNames || zoomRatio >= 1.45 ? styles.markerLabelVisible : ''
                    }`}
                  >
                    <small>LOCAL ESPECIAL</small>
                    <b>{place.name}</b>
                  </span>
                </button>
              ))}

              {dungeons.map((dungeon) => (
                <button
                  key={dungeon.id}
                  type="button"
                  className={`world-map-action ${styles.marker} ${styles.dungeonMarker} ${
                    dungeon.type === 'red' ? styles.redDungeon : styles.commonDungeon
                  }`}
                  style={{ left: `${dungeon.x}%`, top: `${dungeon.y}%` }}
                  onClick={() => selectDungeon(dungeon)}
                  aria-label={`${dungeon.name}, Rank ${dungeon.rank}`}
                >
                  <span className={styles.gateOuter} aria-hidden="true" />
                  <span className={styles.gateInner} aria-hidden="true" />
                  <span className={styles.gateRank}>{dungeon.rank}</span>
                  <span
                    className={`${styles.markerLabel} ${
                      showAllNames || zoomRatio >= 1.3 ? styles.markerLabelVisible : ''
                    }`}
                  >
                    <small>{dungeon.type === 'red' ? 'RED GATE' : 'DUNGEON'}</small>
                    <b>{dungeon.name}</b>
                  </span>
                </button>
              ))}
            </div>
          </TransformComponent>

          <MapControls currentLocationId={location} fitScale={fitScale} />
        </TransformWrapper>
      )}

      <header className={styles.topHud}>
        <Link href="/" className={styles.backButton} aria-label="Voltar ao portal">
          <ChevronLeft />
        </Link>
        <div className={styles.titleBlock}>
          <Compass />
          <div>
            <small>WORLD MAP</small>
            <strong>COREIA DO SUL</strong>
          </div>
        </div>
        <div className={styles.clock}>
          <Clock3 />
          <div>
            <b>{time.label}</b>
            <span>{time.phase === 'day' ? 'DIA' : time.phase === 'dawn' ? 'AMANHECER' : time.phase === 'dusk' ? 'ENTARDECER' : 'NOITE'}</span>
          </div>
        </div>
      </header>

      <section className={styles.locationHud}>
        <span className={styles.locationIcon}><Crosshair /></span>
        <div>
          <small>LOCALIZAÇÃO ATUAL</small>
          <strong>{current?.name || 'Seoul'}</strong>
        </div>
      </section>

      <button
        type="button"
        className={`${styles.namesToggle} world-map-action`}
        onClick={() => setShowAllNames((value) => !value)}
        aria-pressed={showAllNames}
      >
        <Layers3 />
        <span>{showAllNames ? 'OCULTAR NOMES' : 'MOSTRAR NOMES'}</span>
      </button>

      <div className={styles.gestureHint}>
        <Crosshair />
        <div>
          <b>EXPLORE O MUNDO</b>
          <span>Arraste para mover · Pinça/scroll para zoom</span>
        </div>
      </div>

      <div className={styles.legend}>
        <span><i className={styles.cityDot} /> Cidade</span>
        <span><i className={styles.specialDot} /> Especial</span>
        <span><i className={styles.gateDot} /> Gate</span>
        <span><i className={styles.redGateDot} /> Perigo</span>
      </div>

      {selectedDungeon?.type === 'red' && (
        <div className={styles.dangerSignal}>
          <AlertTriangle /> RED GATE DETECTADO
        </div>
      )}

      <CityPanel
        place={selected}
        currentLocationId={location}
        onTravel={travel}
        onClose={() => setSelected(null)}
      />
      <DungeonPanel
        dungeon={selectedDungeon}
        currentLocationId={location}
        onTravel={travel}
        onParticipate={participate}
        onClose={() => setSelectedDungeon(null)}
      />
      <SpecialLocationPanel
        place={selectedSpecial}
        currentLocationId={location}
        onTravel={travel}
        onClose={() => setSelectedSpecial(null)}
      />
    </main>
  );
}
