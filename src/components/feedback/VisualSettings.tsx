import React from 'react';
import { setVisualPreferences, useVisualPreferences, type VisualPreferences } from './visualPreferences';

export function VisualSettings({ language = 'id' }: { language?: 'id' | 'en' }) {
  const settings = useVisualPreferences();
  return <section className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
    <label htmlFor="visual-quality" className="block text-sm font-bold">{language === 'id' ? 'Kualitas efek visual' : 'Visual effects quality'}</label>
    <select id="visual-quality" className="bg-slate-950 border border-slate-600 rounded-lg p-2 w-full" value={settings.quality}
      onChange={event => setVisualPreferences({ ...settings, quality: event.target.value as VisualPreferences['quality'] })}>
      <option value="auto">{language === 'id' ? 'Otomatis (lebih ringan di mobile)' : 'Auto (lighter on mobile)'}</option>
      <option value="low">{language === 'id' ? 'Ringan' : 'Low'}</option>
      <option value="standard">{language === 'id' ? 'Standar' : 'Standard'}</option>
    </select>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.cinematic} onChange={event => setVisualPreferences({ ...settings, cinematic: event.target.checked })} />
      {language === 'id' ? 'Aksen sinematik singkat (opsional)' : 'Short cinematic accents (optional)'}</label>
    <p className="text-xs text-slate-400">{language === 'id' ? 'Tidak mengubah waktu permainan. Nonaktif pada mode Ringan atau reduced motion; Otomatis juga menonaktifkannya di layar kecil/perangkat sentuh.' : 'Never changes game timing. Disabled with Low quality or reduced motion; Auto also disables accents on small screens/touch devices.'}</p>
  </section>;
}
