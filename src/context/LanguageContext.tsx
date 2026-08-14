import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "id" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Nav & Common
    "nav.camera": "KAMERA",
    "nav.gallery": "KARTU",
    "nav.dex": "NEKOMON-DEX 📖",
    "nav.profile": "PROFIL",
    "nav.missions": "MISI",
    "nav.arena": "ARENA",
    "nav.leaderboard": "PERINGKAT",
    "nav.trading": "TRANSAKSI",
    "nav.guide": "PANDUAN",
    "nav.shop": "SHOP 🛒",
    "shop.title": "TOKO NEKOMON & BOOSTER PACK",
    "shop.desc": "Beli Nekomon Poin (Microtransactions) dan Gacha Booster Pack Virtual untuk langsung mendapatkan kartu kelangkaan tinggi secara instan!",
    "common.logout": "Keluar",
    "common.points": "Poin",
    "common.cores": "Cores",
    "common.loading": "Memuat...",
    "common.you": "Anda",
    "common.bot": "BOT",
    "common.close": "Tutup",
    "common.back": "KEMBALI",
    "common.process": "MEMPROSES...",
    "common.seconds": "detik",
    "common.level": "LV",

    // Header & Info
    "header.title": "TANGKAP KUCING ASLI, FORGE MENJADI KARTU NEKOMON ANIME!",
    "header.desc": "Misi utama game ini adalah memfoto kucing asli secara aktual. Dapatkan +10 poin untuk setiap tangkapan, lalu lakukan Forging dengan 50 poin untuk menyulap foto kucing biasa menjadi ilustrasi anime artistik Faksi Sentinel (lembut, magis) atau Faksi Vanguard (tegas, dinamis)!",
    "header.stats_label": "Koleksi Anda",
    "header.total_cards": "Total Kartu",
    "header.highest_lv": "LV Tertinggi",

    // Virtual Camera
    "camera.title": "KAMERA DETEKTOR NEKOMON",
    "camera.desc": "Arahkan kamera ke kucing asli Anda di sekitar rumah atau jalanan, lalu tekan tombol jepret untuk menangkap esensi jiwanya!",
    "camera.btn_capture": "TANGKAP KUCING! 📸",
    "camera.scanning": "Memindai lingkungan sekitar...",
    "camera.searching": "Mencari tanda kehidupan Nekomon...",
    "camera.not_found": "Belum ada kucing terdeteksi. Silakan unggah foto kucing asli atau gunakan tombol demo kucing di bawah!",
    "camera.found_title": "KUCING TERDETEKSI! 🐾",
    "camera.found_desc": "Tekan tangkap untuk menyerap energi Nekomon!",
    "camera.upload_btn": "Unggah Foto Kucing Sendiri",
    "camera.demo_btn": "Pancing Demo Kucing Acak 🐱",
    "camera.upload_success": "Foto kucing berhasil diunggah! Poin bertambah!",
    "camera.capture_success": "Berhasil menangkap kucing! +10 Poin!",
    "camera.cooldown": "Kamera sedang memanas. Silakan tunggu sebentar.",

    // Forging Station
    "forge.modal_title": "FORGING STATION: CIPTAKAN KARTU NEKOMON",
    "forge.select_material": "1. Pilih Foto Bahan",
    "forge.select_element": "2. Masukkan Elemen Kekuatan",
    "forge.select_style": "3. Pilih Aliran Seni Anime",
    "forge.consume_core": "Gunakan 1 Nekomon Core (Peluang Epic/Legendary naik drastis!)",
    "forge.cost": "Biaya Forging:",
    "forge.balance": "Saldo Anda:",
    "forge.btn_forge": "MULAI PENEMPAAN KARTU ⚔️",
    "forge.insufficient": "Poin Anda tidak cukup untuk melakukan Forging.",
    "forge.success_title": "PENEMPAAN BERHASIL! 🎉",
    "forge.success_desc": "Ilustrasi anime berhasil diciptakan dan didaftarkan ke album kartu Anda!",
    "forge.success_finish": "MASUKKAN KE ALBUM 🐾",
    "forge.preview_desc": "Foto ini akan dilarutkan menjadi Nekomon Card bergaya",
    "forge.style_sentinel_desc": "Karakter anime dengan komposisi lembut, magis, menggunakan referensi studio Ghibli/A-1 picture/Kyoto animation atau nuansa Steampunk.",
    "forge.style_vanguard_desc": "Karakter anime dengan komposisi tegas, dinamis, tajam, sinematik menggunakan referensi studio Mappa/Bones/Madhouse atau nuansa Cyberpunk.",

    // Gallery View
    "gallery.title": "ALBUM KARTU NEKOMON ANDA",
    "gallery.desc": "Koleksi Nekomon Card hasil forging dari foto kucing Anda. Perkuat level mereka atau evolusi mereka ke tingkat yang lebih tinggi!",
    "gallery.empty": "Album Anda masih kosong. Silakan gunakan Kamera dan lakukan Forging pertama Anda!",
    "gallery.detail_title": "Detail Nekomon Card",
    "gallery.revert_confirm_title": "Batalkan Evolusi Nekomon",
    "gallery.revert_success_title": "Evolusi Dibatalkan! 🔄",
    "gallery.revert_desc": "Pembatalan membutuhkan biaya tambahan sebesar 50% dari biaya evolusi sebelumnya. Biaya orisinal evolusi tidak dikembalikan.",
    "gallery.revert_cost_core": "Butuh Cores",
    "gallery.revert_cost_point": "Butuh Poin",
    "gallery.revert_balance_core": "Milik Anda Cores",
    "gallery.revert_balance_point": "Milik Anda Poin",
    "gallery.revert_btn": "BATALKAN EVOLUSI",
    "gallery.revert_insufficient": "Saldo Nekomon Cores atau Poin Anda tidak mencukupi untuk membatalkan evolusi ini.",
    "gallery.destroy_btn": "HANCURKAN KARTU",
    "gallery.destroy_confirm": "Apakah Anda yakin ingin menghancurkan kartu ini? Kartu akan musnah selamanya dan mengembalikan sebagian material.",
    "gallery.evolve_btn": "EVOLUSI KARTU",
    "gallery.evolve_confirm": "Evolusi Nekomon Card",
    "gallery.evolve_success": "Evolusi Sukses! 🎉",
    "gallery.download_btn": "UNDUH GAMBAR KARTU 📥",

    // Card Missions
    "missions.title": "MISI HARIAN TRAINER",
    "missions.desc": "Selesaikan misi harian untuk mendapatkan bonus Poin dan Nekomon Core yang berharga!",
    "missions.completed": "Semua misi hari ini selesai! Kembali dalam:",
    "missions.claim": "KLAIM HADIAH",
    "missions.claimed": "BERHASIL DIKLAIM!",

    // Arena View
    "arena.title": "ARENA PERTANDINGAN NEKOMON",
    "arena.desc": "Uji kartu Nekomon terbaik Anda melawan pemain lain atau bot latih tanding secara langsung!",
    "arena.prep": "PERSIAPAN ARENA",
    "arena.battle": "LIVE BATTLE STADIUM",
    "arena.select_card": "PILIH KARTU BERTANDING",
    "arena.queue_btn": "MULAI PVP ARENA ⚔",
    "arena.queue_cancel": "BATALKAN ANTRIAN ❌",
    "arena.searching_opponent": "Mencari lawan sebanding...",
    "arena.global_chat": "OBROLAN GLOBAL ARENA",
    "arena.chat_placeholder": "Tulis pesan arena...",
    "arena.victory": "MENANG! 🎉",
    "arena.defeat": "KALAH! 💔",

    // Leaderboard
    "leaderboard.title": "PAPAN PERINGKAT GLOBAL",
    "leaderboard.desc": "Daftar Trainer Nekomon terbaik berdasarkan akumulasi Poin kemenangan di Arena!",

    // Card Trading
    "trading.title": "BURSA TRANSAKSI KARTU",
    "trading.desc": "Tukarkan kartu Nekomon Anda dengan kartu milik pemain lain di bursa transaksi terbuka!",

    // Game Guide
    "guide.title": "PANDUAN & TIPS NEKOMON",
    "guide.desc": "Pelajari cara bermain, strategi elemen, dan rahasia menjadi Trainer Nekomon terbaik!",
    "guide.tab_tutorial": "CARA BERMAIN",
    "guide.tab_elements": "TABEL ELEMEN",
    "guide.tab_tips": "TIPS PRO",

    // BGM Audio Controller
    "bgm.title": "MUSIK BACKSOUND 🎵",
    "bgm.subtitle": "Atur musik & volume backsound aplikasi",
    "bgm.active": "BGM: AKTIF",
    "bgm.muted": "BGM: MATI",
    "bgm.volume_label": "Volume Backsound",
    "bgm.theme_label": "Pilih Tema Musik",
    "bgm.theme_cozy": "Kota Nekomon (Cozy Lofi)",
    "bgm.theme_battle": "Arena Pertarungan (RPG)",
    "bgm.theme_shrine": "Kuil Mistik (Anime)",
    "bgm.theme_vanguard": "Cyber Vanguard (Synth)",

    // Mail & Direct Messages
    "nav.mail": "KOTAK SURAT",
    "mail.title": "KOTAK SURAT & PESAN TRAINER",
    "mail.desc": "Pusat informasi resmi, update game, kompensasi hadiah, serta pesan pribadi antar sesama trainer!",
    "mail.tab_official": "SURAT RESMI & UPDATE",
    "mail.tab_direct": "PESAN PRIBADI (DM)",
    "mail.broadcast_btn": "SIARKAN PENGUMUMAN",
    "mail.broadcast_title": "Siarkan Pengumuman Resmi",
    "mail.broadcast_desc": "Surat ini akan dikirim langsung ke seluruh kotak surat (Inbox) pemain Nekomon Online dari support@nekomon.online.",
    "mail.broadcast_dev_only": "Khusus Akun Developer Resmi",
    "mail.broadcast_success": "Surat pengumuman resmi berhasil disiarkan ke seluruh pemain!",
    "mail.filter_all": "Semua Surat",
    "mail.filter_welcome": "🎉 Sambutan",
    "mail.filter_patch": "🚀 Patch Update",
    "mail.filter_maintenance": "⚙️ Pemeliharaan",
    "mail.filter_reward": "🎁 Hadiah Spesial",
    "mail.filter_announcement": "📢 Pengumuman",
    "mail.new_chat": "CHAT BARU",
    "mail.claim_reward": "KLAIM HADIAH",
    "mail.claimed": "SUDAH DIKLAIM",
    "mail.empty_official": "Belum ada surat resmi baru.",
    "mail.empty_messages": "Belum ada percakapan pribadi. Mulai kirim pesan ke trainer lain!",
    "mail.official_sender": "Nekomon Studio (support@nekomon.online)",
    "mail.send_placeholder": "Tulis pesan ke trainer...",
    "mail.read_more": "BACA DETAIL",
    "mail.reward_attached": "Lampiran Hadiah Resmi",
    "mail.sender_official": "Email Resmi: support@nekomon.online",
    "mail.chat_inbox": "Kotak Masuk Chat",
    "mail.select_chat": "Pilih Percakapan",
    "mail.select_chat_desc": "Pilih kontak dari daftar di sebelah kiri atau mulai chat baru dengan Trainer Nekomon lain.",
    "mail.search_trainer": "Kirim Pesan ke Trainer",
    "mail.search_placeholder": "Cari username trainer...",
    "mail.searching": "Mencari trainer...",
    "mail.no_trainer_found": "Tidak ada trainer ditemukan.",
    "mail.online_badge": "Online • Trainer Nekomon",
    "mail.no_message_partner": "Belum ada pesan dengan @{username}. Sapa dan mulailah berteman!",
    "mail.send": "Kirim",
    "mail.sending": "Mengirim...",
    "mail.broadcast_title_field": "Judul Surat / Pengumuman *",
    "mail.broadcast_summary_field": "Ringkasan Singkat",
    "mail.broadcast_content_field": "Isi Surat Lengkap *",
    "mail.broadcast_reward_label": "Bonus Hadiah Lampiran (Opsional)",
    "mail.broadcast_points_label": "Bonus Poin",
    "mail.broadcast_cores_label": "Bonus Cores",
    "mail.broadcast_pin_label": "Sematkan di Atas (Pinned)",
    "mail.broadcast_submit": "SIARKAN SURAT RESMI SEKARANG 📬",
    "mail.broadcasting": "MENYIARKAN...",
  },
  en: {
    // Nav & Common
    "nav.camera": "CAMERA",
    "nav.gallery": "CARDS",
    "nav.dex": "NEKOMON-DEX 📖",
    "nav.profile": "PROFILE",
    "nav.missions": "MISSIONS",
    "nav.arena": "ARENA",
    "nav.leaderboard": "LEADERBOARD",
    "nav.trading": "TRADING",
    "nav.guide": "GUIDE",
    "nav.shop": "SHOP 🛒",
    "nav.mail": "MAILBOX",
    "shop.title": "NEKOMON SHOP & BOOSTER PACKS",
    "shop.desc": "Buy Nekomon Points (Microtransactions) and virtual Gacha Booster Packs to instantly summon high-rarity cards!",
    "common.logout": "Log Out",
    "common.points": "Points",
    "common.cores": "Cores",
    "common.loading": "Loading...",
    "common.you": "You",
    "common.bot": "BOT",
    "common.close": "Close",
    "common.back": "BACK",
    "common.process": "PROCESSING...",
    "common.seconds": "seconds",
    "common.level": "LV",

    // Header & Info
    "header.title": "CAPTURE REAL CATS, FORGE INTO NEKOMON ANIME CARDS!",
    "header.desc": "The main objective of this game is to photograph real-life cats. Earn +10 points for every photo, then use 50 points in Forging to turn ordinary cat photos into artistic anime illustrations, choosing either Sentinel (soft, magical) or Vanguard (bold, dynamic) faction!",
    "header.stats_label": "Your Collection",
    "header.total_cards": "Total Cards",
    "header.highest_lv": "Highest LV",

    // Virtual Camera
    "camera.title": "NEKOMON DETECTOR CAMERA",
    "camera.desc": "Point the camera at a real cat in your house or on the street, then tap the capture button to absorb its soul essence!",
    "camera.btn_capture": "CAPTURE CAT! 📸",
    "camera.scanning": "Scanning environment...",
    "camera.searching": "Searching for Nekomon life signs...",
    "camera.not_found": "No cat detected yet. Please upload a real cat photo or trigger a demo cat below!",
    "camera.found_title": "CAT DETECTED! 🐾",
    "camera.found_desc": "Tap capture to absorb Nekomon energy!",
    "camera.upload_btn": "Upload Your Own Cat Photo",
    "camera.demo_btn": "Attract Random Demo Cat 🐱",
    "camera.upload_success": "Cat photo uploaded successfully! Points added!",
    "camera.capture_success": "Successfully captured a cat! +10 Points!",
    "camera.cooldown": "Camera is cooling down. Please wait a moment.",

    // Forging Station
    "forge.modal_title": "FORGING STATION: CREATE NEKOMON CARD",
    "forge.select_material": "1. Select Raw Material Photo",
    "forge.select_element": "2. Select Elemental Power",
    "forge.select_style": "3. Select Anime Art Style",
    "forge.consume_core": "Consume 1 Nekomon Core (Epic/Legendary rate increases drastically!)",
    "forge.cost": "Forging Cost:",
    "forge.balance": "Your Balance:",
    "forge.btn_forge": "START CARD FORGING ⚔️",
    "forge.insufficient": "Your points are insufficient for Forging.",
    "forge.success_title": "FORGING SUCCESSFUL! 🎉",
    "forge.success_desc": "Anime illustration created and registered to your card album!",
    "forge.success_finish": "ADD TO ALBUM 🐾",
    "forge.preview_desc": "This photo will be dissolved into a Nekomon Card styled as",
    "forge.style_sentinel_desc": "Anime character with soft, magical composition, hand-drawn aesthetic, highly detailed, cozy, heartwarming, inspired by Ghibli, A-1 Pictures, Kyoto Animation, or Steampunk elements.",
    "forge.style_vanguard_desc": "Anime character with sharp, dynamic, cinematic composition, modern high-contrast action anime style, cinematic lighting, sleek and energetic, inspired by Mappa, Bones, Madhouse, or Cyberpunk elements.",

    // Gallery View
    "gallery.title": "YOUR NEKOMON CARD ALBUM",
    "gallery.desc": "Your collection of forged Nekomon Cards. Upgrade their level or evolve them to a higher stage!",
    "gallery.empty": "Your album is empty. Go capture cats and perform your first Forging!",
    "gallery.detail_title": "Nekomon Card Detail",
    "gallery.revert_confirm_title": "Cancel Nekomon Evolution",
    "gallery.revert_success_title": "Evolution Cancelled! 🔄",
    "gallery.revert_desc": "Cancellation requires an extra fee of 50% of the previous evolution cost. Original evolution cost is non-refundable.",
    "gallery.revert_cost_core": "Required Cores",
    "gallery.revert_cost_point": "Required Points",
    "gallery.revert_balance_core": "Your Cores",
    "gallery.revert_balance_point": "Your Points",
    "gallery.revert_btn": "CANCEL EVOLUTION",
    "gallery.revert_insufficient": "Your Nekomon Cores or Points balance is insufficient to cancel this evolution.",
    "gallery.destroy_btn": "DESTROY CARD",
    "gallery.destroy_confirm": "Are you sure you want to destroy this card? It will be gone forever and refund some materials.",
    "gallery.evolve_btn": "EVOLVE CARD",
    "gallery.evolve_confirm": "Nekomon Card Evolution",
    "gallery.evolve_success": "Evolution Successful! 🎉",
    "gallery.download_btn": "DOWNLOAD CARD IMAGE 📥",

    // Card Missions
    "missions.title": "TRAINER DAILY MISSIONS",
    "missions.desc": "Complete daily missions to earn valuable bonus Points and Nekomon Cores!",
    "missions.completed": "All missions completed today! Come back in:",
    "missions.claim": "CLAIM REWARD",
    "missions.claimed": "CLAIMED SUCCESSFULLY!",

    // Arena View
    "arena.title": "NEKOMON COMBAT ARENA",
    "arena.desc": "Test your best Nekomon cards against other players or practice bots live!",
    "arena.prep": "ARENA PREPARATION",
    "arena.battle": "LIVE BATTLE STADIUM",
    "arena.select_card": "CHOOSE COMBAT CARD",
    "arena.queue_btn": "START PVP ARENA ⚔",
    "arena.queue_cancel": "CANCEL QUEUE ❌",
    "arena.searching_opponent": "Searching for matching opponent...",
    "arena.global_chat": "ARENA GLOBAL CHAT",
    "arena.chat_placeholder": "Write arena message...",
    "arena.victory": "VICTORY! 🎉",
    "arena.defeat": "DEFEAT! 💔",

    // Leaderboard
    "leaderboard.title": "GLOBAL LEADERBOARD",
    "leaderboard.desc": "List of top Nekomon Trainers based on points accumulated from Arena matches!",

    // Card Trading
    "trading.title": "CARD TRADING FLOOR",
    "trading.desc": "Trade your Nekomon cards with other players in an open exchange market!",

    // Game Guide
    "guide.title": "NEKOMON GUIDE & TIPS",
    "guide.desc": "Learn how to play, element matchups, and secrets to becoming the best Nekomon Trainer!",
    "guide.tab_tutorial": "HOW TO PLAY",
    "guide.tab_elements": "ELEMENT TABLE",
    "guide.tab_tips": "PRO TIPS",

    // BGM Audio Controller
    "bgm.title": "BACKGROUND MUSIC 🎵",
    "bgm.subtitle": "Adjust game background music & volume",
    "bgm.active": "BGM: ON",
    "bgm.muted": "BGM: OFF",
    "bgm.volume_label": "BGM Volume",
    "bgm.theme_label": "Select Soundtrack Theme",
    "bgm.theme_cozy": "Nekomon Town (Cozy Lofi)",
    "bgm.theme_battle": "Battle Arena (RPG)",
    "bgm.theme_shrine": "Mystic Shrine (Anime)",
    "bgm.theme_vanguard": "Cyber Vanguard (Synth)",

    // Mail & Direct Messages
    "mail.title": "TRAINER MAILBOX & MESSAGES",
    "mail.desc": "Center for official announcements, game updates, reward gifts, and direct messages between players!",
    "mail.tab_official": "OFFICIAL MAIL & UPDATES",
    "mail.tab_direct": "DIRECT MESSAGES (DM)",
    "mail.broadcast_btn": "BROADCAST ANNOUNCEMENT",
    "mail.broadcast_title": "Broadcast Official Mail",
    "mail.broadcast_desc": "This mail will be broadcasted to all Nekomon Online players' inboxes from support@nekomon.online.",
    "mail.broadcast_dev_only": "Official Developer Accounts Only",
    "mail.broadcast_success": "Official announcement mail broadcasted to all players successfully!",
    "mail.filter_all": "All Mails",
    "mail.filter_welcome": "🎉 Welcome",
    "mail.filter_patch": "🚀 Patch Updates",
    "mail.filter_maintenance": "⚙️ Maintenance",
    "mail.filter_reward": "🎁 Special Rewards",
    "mail.filter_announcement": "📢 Announcements",
    "mail.new_chat": "NEW CHAT",
    "mail.claim_reward": "CLAIM REWARD",
    "mail.claimed": "CLAIMED",
    "mail.empty_official": "No official mail yet.",
    "mail.empty_messages": "No direct messages yet. Start chatting with other trainers!",
    "mail.official_sender": "Nekomon Studio (support@nekomon.online)",
    "mail.send_placeholder": "Type a message to trainer...",
    "mail.read_more": "READ MORE",
    "mail.reward_attached": "Official Reward Attached",
    "mail.sender_official": "Official Email: support@nekomon.online",
    "mail.chat_inbox": "Chat Inbox",
    "mail.select_chat": "Select a Conversation",
    "mail.select_chat_desc": "Choose a contact from the left list or start a new chat with another Nekomon Trainer.",
    "mail.search_trainer": "Message a Trainer",
    "mail.search_placeholder": "Search trainer username...",
    "mail.searching": "Searching trainers...",
    "mail.no_trainer_found": "No trainers found.",
    "mail.online_badge": "Online • Nekomon Trainer",
    "mail.no_message_partner": "No messages with @{username} yet. Say hi and start chatting!",
    "mail.send": "Send",
    "mail.sending": "Sending...",
    "mail.broadcast_title_field": "Mail / Announcement Title *",
    "mail.broadcast_summary_field": "Short Summary",
    "mail.broadcast_content_field": "Full Mail Content *",
    "mail.broadcast_reward_label": "Attached Reward Bonus (Optional)",
    "mail.broadcast_points_label": "Bonus Points",
    "mail.broadcast_cores_label": "Bonus Cores",
    "mail.broadcast_pin_label": "Pin at Top (Pinned)",
    "mail.broadcast_submit": "BROADCAST OFFICIAL MAIL NOW 📬",
    "mail.broadcasting": "BROADCASTING...",
  }
};

const LanguageContext = createContext<LanguageContextProps>({
  language: "id",
  setLanguage: () => {},
  t: (key: string) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("nekomon_language");
    return (saved === "en" || saved === "id") ? saved : "id";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("nekomon_language", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["id"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
