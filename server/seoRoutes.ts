import fs from "fs";
import path from "path";

export interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  heading: string;
  contentHtml: string;
}

export const VIRTUAL_SEO_ROUTES: Record<string, RouteMeta> = {
  "/privacy-policy": {
    title: "Kebijakan Privasi (Privacy Policy) - Nekomon Online",
    description: "Kebijakan privasi resmi Nekomon Online: perlindungan data pengguna, otentikasi Firebase, enkripsi Cloud Firestore, dan transparansi iklan Google AdSense.",
    canonical: "https://nekomon.online/privacy-policy",
    heading: "Kebijakan Privasi (Privacy Policy) Nekomon Online",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Kebijakan Privasi (Privacy Policy) - Nekomon Online</h1>
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">Terakhir diperbarui: 2 September 2026 | Berlaku untuk semua pengguna aplikasi web Nekomon Online</p>
      
      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">1. Pengumpulan & Penggunaan Data</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Nekomon Online mengumpulkan data yang diperlukan untuk mendukung fungsionalitas game, antara lain:
      </p>
      <ul style="color: #cbd5e1; line-height: 1.8; margin-left: 20px;">
        <li><strong>Informasi Akun:</strong> Alamat email, nama pengguna (username), dan faksi yang dipilih (Sentinel atau Vanguard).</li>
        <li><strong>Data Gameplay:</strong> Koleksi kartu, riwayat penempaan (forging), poin trainer, Nekomon Cores, dan histori pertarungan arena.</li>
        <li><strong>Izin Perangkat:</strong> Sensor kamera digunakan secara lokal untuk fitur pemindaian foto kucing asli dalam penempaan kartu. Foto diproses untuk ekstraksi metadata visual game dan tidak disalahgunakan.</li>
        <li><strong>Data Lokasi (GPS):</strong> Digunakan secara opsional untuk menampilkan titik interaktif (Community Cat Spots) dan Raid Boss terdekat.</li>
      </ul>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">2. Keamanan & Penyimpanan Cloud</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Semua kredensial dan data game disimpan menggunakan infrastruktur terenkripsi Google Cloud Firestore dan Firebase Authentication. Kami tidak pernah menjual, menyewakan, atau memperjualbelikan data pribadi pengguna kepada pihak ketiga yang tidak berwenang.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">3. Layanan Iklan Pihak Ketiga (Google AdSense)</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Situs web ini bekerja sama dengan Google AdSense untuk menampilkan iklan digital. Google menggunakan cookie (seperti cookie DoubleClick / Google Advertising Cookie) untuk menayangkan iklan yang relevan berdasarkan kunjungan pengguna ke situs ini atau situs web lain di internet. Pengguna dapat memilih untuk tidak menggunakan cookie yang dipersonalisasi melalui <a href="https://adssettings.google.com" style="color: #38bdf8;" target="_blank">Google Ads Settings</a>.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">4. Kontak Pengembang & Hak Pengguna</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Pengguna berhak meminta penghapusan akun atau pembaruan data kapan saja dengan menghubungi tim dukungan resmi di:
        <br/><strong>Email:</strong> <a href="mailto:support@nekomon.online" style="color: #38bdf8;">support@nekomon.online</a> atau <a href="mailto:verydiaz@gmail.com" style="color: #38bdf8;">verydiaz@gmail.com</a>
        <br/><strong>Alamat:</strong> Pasir Putih Residence B7, Indonesia | WhatsApp: +6285624089327
      </p>
    `
  },
  "/terms-of-service": {
    title: "Syarat dan Ketentuan Layanan (Terms of Service) - Nekomon Online",
    description: "Syarat dan ketentuan layanan resmi Nekomon Online: peraturan permainan, kepemilikan item digital, larangan kecurangan (anti-cheat), dan kepatuhan hukum.",
    canonical: "https://nekomon.online/terms-of-service",
    heading: "Syarat & Ketentuan Layanan (Terms of Service)",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Syarat dan Ketentuan Layanan - Nekomon Online</h1>
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">Terakhir diperbarui: 2 September 2026</p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">1. Ketentuan Umum & Penerimaan Syarat</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Dengan mengakses dan memainkan game Nekomon Online (nekomon.online), pengguna menyetujui seluruh ketentuan dan peraturan yang berlaku. Jika Anda tidak menyetujui salah satu poin ketentuan ini, harap hentikan penggunaan layanan.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">2. Peraturan Akun & Fairplay</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Setiap pengguna bertanggung jawab penuh atas keamanan akun mereka. Penggunaan bot ilegal, eksploitasi celah keamanan (bug abuse), atau manipulasi transaksi dilarang keras dan dapat mengakibatkan pemblokiran akun permanen.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">3. Item Virtual & Faksi</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Kartu digital, Nekomon Cores, poin, dan status Faksi (Sentinel atau Vanguard) adalah aset hiburan virtual di dalam game. Item-item ini tidak memiliki nilai moneter riil di luar ekosistem resmi Nekomon Online.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">4. Kontak Operasional</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Pertanyaan seputar syarat layanan dapat dikirimkan ke <a href="mailto:support@nekomon.online" style="color: #38bdf8;">support@nekomon.online</a>.
      </p>
    `
  },
  "/refund-policy": {
    title: "Kebijakan Pengembalian Dana (Refund Policy) - Nekomon Online",
    description: "Kebijakan pengembalian dana resmi Nekomon Online: prosedur klaim transaksi ganda, kegagalan pengiriman item digital, dan waktu pemrosesan.",
    canonical: "https://nekomon.online/refund-policy",
    heading: "Kebijakan Pengembalian Dana (Refund Policy)",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Kebijakan Pengembalian Dana (Refund Policy)</h1>
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">Terakhir diperbarui: 2 September 2026</p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">1. Ketentuan Pembelian Barang Digital</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Semua pembelian item digital (seperti paket Nekomon Cores atau fitur penempaan khusus) bersifat instan. Setelah item berhasil dikreditkan ke akun pemain, transaksi secara umum bersifat final dan tidak dapat dibatalkan.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">2. Perlindungan Potongan Ganda & Item Belum Masuk</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Jika terjadi kesalahan sistem di mana saldo terpotong ganda atau item tidak masuk setelah pembayaran terkonfirmasi oleh payment gateway (Midtrans), pemain berhak mengajukan pengembalian dana atau pengiriman ulang item dalam batas waktu 7 hari kalender.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">3. Cara Mengajukan Klaim</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Kirimkan bukti transaksi, ID pesanan, dan username akun ke <a href="mailto:support@nekomon.online" style="color: #38bdf8;">support@nekomon.online</a> atau WhatsApp +6285624089327. Tim kami akan menindaklanjuti dalam waktu 1x24 jam kerja.
      </p>
    `
  },
  "/about": {
    title: "Tentang Nekomon Online (About Us) - Studio & Profil Game",
    description: "Tentang Nekomon Online: platform trading card game (TCG) augmented reality berbasis foto kucing asli buatan Indonesia dengan sistem penempaan kartu anime dan faksi.",
    canonical: "https://nekomon.online/about",
    heading: "Tentang Nekomon Online",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Tentang Nekomon Online</h1>
      <p style="color: #cbd5e1; line-height: 1.7;">
        <strong>Nekomon Online</strong> adalah game kartu augmented reality (AR) inovatif yang memadukan kecintaan terhadap kucing di dunia nyata dengan strategi kartu anime yang kompetitif.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">Visi & Misi Kami</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Mengajak komunitas pecinta hewan dan gamer untuk berinteraksi di dunia nyata secara sehat, mendokumentasikan kucing di lingkungan sekitar, dan merangkainya menjadi dek kartu pertarungan bernilai koleksi tinggi dengan 5 elemen dasar (Air, Api, Tanah, Angin, Petir).
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">Studio & Pengembang</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Dikelola oleh Nekomon Studio mandiri berlokasi di Pasir Putih Residence B7, Indonesia. Hubungi pengembang di <a href="mailto:support@nekomon.online" style="color: #38bdf8;">support@nekomon.online</a>.
      </p>
    `
  },
  "/contact": {
    title: "Hubungi Kami (Contact Us) - Dukungan Pemain Nekomon Online",
    description: "Kontak resmi pengembang Nekomon Online: layanan bantuan pemain, email dukungan teknis, kontak WhatsApp, dan alamat studio operasional.",
    canonical: "https://nekomon.online/contact",
    heading: "Hubungi Tim Dukungan Nekomon Online",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Hubungi Kami (Contact Us)</h1>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Kami siap membantu Anda terkait pertanyaan akun, kendala pembayaran, kerja sama, maupun masukan gameplay:
      </p>

      <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-top: 16px;">
        <p style="color: #f8fafc; margin-bottom: 10px;"><strong>📧 Email Resmi:</strong> <a href="mailto:support@nekomon.online" style="color: #38bdf8;">support@nekomon.online</a></p>
        <p style="color: #f8fafc; margin-bottom: 10px;"><strong>🏢 Studio:</strong> Nekomon Online Studio (Indonesia)</p>
        <p style="color: #f8fafc; margin-bottom: 0;"><strong>📸 Akun Instagram Resmi:</strong> <a href="https://www.instagram.com/nekomontcg/" style="color: #ec4899;" target="_blank">https://www.instagram.com/nekomontcg/ (@nekomontcg)</a></p>
      </div>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">Jam Operasional Dukungan: Senin - Minggu (08:00 - 22:00 WIB).</p>
    `
  },
  "/disclaimer": {
    title: "Penafian & Transparansi Iklan (Disclaimer) - Nekomon Online",
    description: "Penafian resmi dan transparansi periklanan Google AdSense di platform Nekomon Online: kepatuhan pedoman dan penafian karya seni.",
    canonical: "https://nekomon.online/disclaimer",
    heading: "Penafian & Transparansi Google AdSense",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Penafian (Disclaimer) & Transparansi Iklan</h1>
      
      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">1. Transparansi Iklan Google AdSense</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Situs web ini menampilkan iklan Google AdSense untuk mendukung biaya server awan, pemrosesan kecerdasan buatan, dan pemeliharaan platform gratis bagi seluruh pemain. Semua penayangan iklan mematuhi Kebijakan Program Google AdSense dan diletakkan tanpa menipu interaksi pengguna.
      </p>

      <h2 style="color: #facc15; font-size: 18px; margin-top: 20px;">2. Penafian Merek Dagang & Karya Seni</h2>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Seluruh ilustrasi karakter anime, kartu penempaan, dan nama dalam game Nekomon Online adalah karya orisinal untuk tujuan hiburan dan tidak berafiliasi dengan waralaba TCG lainnya.
      </p>
    `
  },
  "/guide": {
    title: "Panduan Bermain (Game Guide) - Nekomon Online",
    description: "Panduan lengkap permainan Nekomon Online: cara berburu foto kucing nyata, penempaan kartu AR 5 elemen, faksi Sentinel & Vanguard, Co-op Raid Boss, dan arena PVP.",
    canonical: "https://nekomon.online/guide",
    heading: "Panduan Bermain Resmi Nekomon Online",
    contentHtml: `
      <h1 style="color: #38bdf8; font-size: 26px; margin-bottom: 12px;">Panduan Bermain Resmi Nekomon Online</h1>
      <p style="color: #cbd5e1; line-height: 1.7;">
        Pelajari mekanisme lengkap permainan Nekomon Online dari pemindaian foto kucing nyata hingga penguasaan turnamen kartu:
      </p>
      <ul style="color: #cbd5e1; line-height: 1.8; margin-left: 20px;">
        <li><strong>1. Foto Kucing Nyata:</strong> Cari kucing di dunia nyata dan gunakan kamera perangkat untuk mendeteksi pose dan warna kucing.</li>
        <li><strong>2. Penempaan Kartu (Card Forging):</strong> Tempa foto menjadi kartu anime berelemen Api, Air, Tanah, Angin, atau Petir.</li>
        <li><strong>3. Pemilihan Faksi:</strong> Faksi Sentinel (Pertahanan Cyber) atau Faksi Vanguard (Penyerang Taktis).</li>
        <li><strong>4. Co-op Raid Boss:</strong> Bertarung bersama pemain terdekat mengalahkan Boss raksasa multi-spesies.</li>
        <li><strong>5. PVP Arena:</strong> Susun dek 5 kartu andalanmu untuk memenangkan hadiah poin dan mendaki leaderboard.</li>
      </ul>
    `
  }
};

// Aliases for user-friendly and crawler URLs
const ROUTE_ALIASES: Record<string, string> = {
  "/privacy": "/privacy-policy",
  "/terms": "/terms-of-service",
  "/refund": "/refund-policy",
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/panduan": "/guide",
  "/game-guide": "/guide"
};

export function resolveSeoRoute(pathname: string): RouteMeta | null {
  const clean = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (VIRTUAL_SEO_ROUTES[clean]) {
    return VIRTUAL_SEO_ROUTES[clean];
  }
  const target = ROUTE_ALIASES[clean];
  if (target && VIRTUAL_SEO_ROUTES[target]) {
    return VIRTUAL_SEO_ROUTES[target];
  }
  return null;
}

export function renderSeoHtml(baseHtml: string, routeMeta: RouteMeta): string {
  let html = baseHtml;

  // Replace Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${routeMeta.title}</title>`);

  // Replace or inject Meta Title
  if (html.includes('name="title"')) {
    html = html.replace(/<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i, `<meta name="title" content="${routeMeta.title}" />`);
  }

  // Replace Meta Description
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${routeMeta.description}" />`);

  // Replace OG tags
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${routeMeta.title}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${routeMeta.description}" />`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${routeMeta.canonical}" />`);

  // Replace Canonical Link
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${routeMeta.canonical}" />`);

  // Inject Crawler-Visible Semantic HTML inside <div id="root">
  const noscriptFallback = `
    <noscript>
      <div style="max-width: 900px; margin: 40px auto; padding: 24px; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
        ${routeMeta.contentHtml}
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #334155; font-size: 12px; color: #94a3b8;">
          <a href="/" style="color: #38bdf8;">Beranda Nekomon Online</a> | 
          <a href="/privacy-policy" style="color: #38bdf8;">Kebijakan Privasi</a> | 
          <a href="/terms-of-service" style="color: #38bdf8;">Syarat Layanan</a> | 
          <a href="/refund-policy" style="color: #38bdf8;">Kebijakan Refund</a> | 
          <a href="/about" style="color: #38bdf8;">Tentang Kami</a> | 
          <a href="/contact" style="color: #38bdf8;">Hubungi Kami</a>
        </div>
      </div>
    </noscript>`;

  if (html.includes('<div id="root">')) {
    html = html.replace('<div id="root">', `<div id="root">${noscriptFallback}`);
  }

  return html;
}
