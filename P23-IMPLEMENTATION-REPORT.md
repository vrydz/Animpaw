# P2/P3 — Visual polish dan aksen sinematik
Tanggal: 19 September 2026
Proyek: D:/Experiment/Animpaw

## Lingkup implementasi
P2:
- Tilt kartu memakai requestAnimationFrame dan CSS variables, bukan empat pembaruan React state pada setiap mousemove. Sudut dibatasi ±4 derajat, shadow statis, highlight lebih halus.
- Tilt dihentikan saat pointer keluar, elemen keluar viewport, tab tersembunyi, reduced motion aktif, atau kualitas Ringan. Frame dan observer dibersihkan saat unmount.
- Pulse pada keseluruhan kartu Mythic dihapus agar artwork/angka tidak ikut meredup. Aksen latar tetap terpisah.
- Artwork fallback dimemoisasi; gambar kartu kecil memakai lazy loading, sementara kartu utama tetap eager. Decode gambar asinkron dan placeholder reveal statis.
- Pengaturan visual Auto/Ringan/Standar tersimpan lokal, di Settings > Audio & BGM. Mode Ringan menyembunyikan partikel ambient Battle/Raid, partikel Territory, partikel reveal dan highlight pointer; menghentikan animasi ambient terpilih. Label/HP/progress tetap tersedia.

P3:
- Aksen dekoratif lokal untuk Legend/Mythic, evolusi, banner kemenangan, dan transisi boss tumbang yang terkonfirmasi.
- Maksimal empat streak dan satu seal, selesai/dibersihkan dalam 1.2 detik; transform/opacity, tanpa blur, video, full-screen flash atau camera shake baru.
- Opt-in, default mati. Reduced motion dan mode Ringan selalu menonaktifkannya; mode Auto juga menonaktifkan pada viewport <=640 px atau pointer coarse.
- Tidak menahan tombol, request, hasil, callback, atau timing permainan. Tidak memainkan ulang efek selesai saat preferensi diaktifkan belakangan.
- Tab tersembunyi atau elemen offscreen menghentikan aksen, bukan menumpuk replay.

## Validasi
- Type checking: npm run lint lulus.
- Presentation regression suite: 25/25 lulus, termasuk 4 tes baru P2/P3.
- Existing backend/security/balance suite: npm test 27/27 lulus. Total 52 tes.
- Production build lulus, 2152 modules; git diff --check lulus.
- Hash server.ts, server/websocket.ts, src/types.ts tetap sama seperti baseline P1.
- Preview lokal: default opt-out; opt-in menghasilkan aksen; setelah selesai node aksen hilang; mode Ringan menyembunyikan partikel dan aksen.
- Reduced-motion override: animation none, hasil evolusi opacity 1, cinematic count 0 meski pilihan Standar + cinematic aktif.
- Desktop tilt terverifikasi melalui DOM data-tilted dan transform. Tidak ada overflow horizontal.
- Mobile viewport diminta 390x844; scaling host menghasilkan CSS width 309 px. Kartu dan pengaturan diperiksa visual; tidak overflow horizontal, Auto tidak memasang cinematic.
- Frame sampling 4 detik desktop: 480 frame, p95 8.4 ms, 0 interval >33.4 ms.
- Frame sampling 4 detik narrow viewport: 480 frame, p95 8.4 ms, 0 interval >33.4 ms. Ini sampling host desktop, bukan benchmark HP fisik; sebagian reveal berada di bawah fold.
- Banner victory tetap non-blocking (pointer-events none pada aksen).
- Raid synthetic victory: hasil/HP/hadiah dan dialog tetap muncul, tanpa error console.
- Tidak ditemukan error console pada alur yang diperiksa. Preferensi preview dipulihkan ke Auto/cinematic mati.
- Browser skill digunakan untuk verifikasi visual lokal dan kontrol mobile/reduced-motion.

## Batasan / belum termasuk
- Belum diuji pada HP fisik, CPU throttling, jaringan lambat, atau sesi multiplayer produksi.
- Belum mengoptimalkan PNG boss P1 menjadi WebP/AVIF atau meregenerasi 14 boss lainnya.
- Bundle utama tetap sekitar 1.70 MB (gzip 444.24 KB), warning >500 KB masih ada. Route-level code splitting dan pipeline responsive assets belum dilakukan.
- Tidak ditambahkan sinematik video penuh, cutscene, atau library partikel; pilihan P3 sengaja berupa aksen singkat yang dapat dimatikan.
- Tidak ada modifikasi backend/API/database, stats, perhitungan, ekonomi maupun hadiah.
- Tidak commit/push/deploy.

## File berubah/baru
Semua relatif terhadap D:/Experiment/Animpaw. Perubahan lama sebelum tahap ini dipertahankan.

1. src/components/NekomonCard.tsx
2. src/components/SettingsView.tsx
3. src/components/feedback/CardReveal.tsx
4. src/components/feedback/cardTilt.ts (baru)
5. src/components/feedback/CinematicAccent.tsx (baru)
6. src/components/feedback/polish.test.ts (baru)
7. src/components/feedback/presentation.css
8. src/components/feedback/PresentationScope.tsx
9. src/components/feedback/preview.tsx
10. src/components/feedback/ResultFeedback.tsx
11. src/components/feedback/useCardTilt.ts (baru)
12. src/components/feedback/visualPreferences.ts (baru)
13. src/components/feedback/VisualSettings.tsx (baru)
14. src/components/raid/RaidPresentation.tsx
15. P23-IMPLEMENTATION-REPORT.md (baru)
