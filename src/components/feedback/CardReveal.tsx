import React, { useEffect, useRef, useState } from 'react';
import type { Card } from '../../types';
import { getAnimeNekomonSpeciesArtwork } from '../../data/nekomonSpeciesData';
import { audio } from '../../lib/audio';
import { rarityProfile } from './feedbackProfiles';
import './presentation.css';
import { CinematicAccent } from './CinematicAccent';

// Mount once per confirmed result. Network waiting never pretends to be rarity progress.
export function CardReveal({ card, previousCard, children, language = 'id' }: React.PropsWithChildren<{
  card: Card; previousCard?: Card; language?: 'id' | 'en';
}>) {
  const profile = rarityProfile(card.rarity);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const sounded = useRef(false);
  const fallback = getAnimeNekomonSpeciesArtwork(card.name, card.element, card.style, card.rarity as any);
  useEffect(() => {
    const image = root.current?.querySelector<HTMLImageElement>('[data-result-art], .nekomon-card img');
    if (image?.complete && image.naturalWidth > 0) setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || sounded.current) return;
    sounded.current = true;
    audio.playFeedback(previousCard ? 'evolution' : 'reveal', card.rarity);
  }, [ready, previousCard, card.rarity]);
  return <div ref={root} className={`card-reveal ${previousCard ? 'card-reveal--evolution' : ''}`} data-ready={ready}
    style={{ '--reveal-color': profile.color, '--reveal-duration': `${previousCard ? 1500 : profile.duration}ms` } as React.CSSProperties}
    onLoadCapture={event => { if ((event.target as HTMLElement).tagName === 'IMG' && (!(event.target as HTMLElement).hasAttribute('data-old-art'))) setReady(true); }}>
    <div className="card-reveal-art">
      {(previousCard || profile.rank >= 4) && <CinematicAccent ready={ready} kind={previousCard ? "evolution" : "rarity"} />}
      {previousCard && <img decoding="async" data-old-art className="card-reveal-before" src={previousCard.imageUrl || fallback} alt={language === 'id' ? 'Artwork sebelum evolusi' : 'Artwork before evolution'} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}
      <div className="card-reveal-result">
        {children || <img decoding="async" data-result-art src={failed ? fallback : card.imageUrl || fallback} alt={card.name} onError={() => { if (!failed) setFailed(true); else setReady(true); }} />}
      </div>
      {ready && <div className="card-reveal-energy" aria-hidden="true"><span className="card-reveal-ring" />
        {Array.from({ length: profile.particles }, (_, i) => <i key={i} style={{ '--ray-angle': `${i * 360 / profile.particles}deg` } as React.CSSProperties} />)}
      </div>}
    </div>
    <div className="card-reveal-caption" role="status">
      <b aria-hidden="true">{profile.symbol}</b><strong>{card.rarity}</strong>
      <span>{!ready ? (language === 'id' ? 'Memuat artwork…' : 'Loading artwork…') : previousCard ? (language === 'id' ? 'EVOLUSI TERKONFIRMASI' : 'EVOLUTION CONFIRMED') : (language === 'id' ? 'KARTU BARU' : 'NEW CARD')}</span>
    </div>
  </div>;
}
