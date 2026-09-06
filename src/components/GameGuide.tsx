import React, { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Swords, 
  Camera, 
  Hammer, 
  ArrowLeftRight, 
  Gamepad2, 
  Award, 
  Flame, 
  Droplets, 
  Sprout, 
  Wind, 
  Zap, 
  Trophy,
  MapPin,
  Scan,
  Users,
  Target,
  ZoomIn,
  Mail,
  Smartphone,
  RotateCcw,
  Phone,
  Database,
  Cloud,
  Globe,
  CreditCard,
  Settings,
  Volume2
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

export const GameGuide: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<"tutorial" | "elements" | "tips">("tutorial");

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6 max-w-3xl mx-auto w-full font-mono">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yellow-500" />
          {t("guide.title")}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t("guide.desc")}
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1 select-none">
        {(
          [
            { id: "tutorial", label: t("guide.tab_tutorial"), icon: Gamepad2 },
            { id: "elements", label: t("guide.tab_elements"), icon: Flame },
            { id: "tips", label: t("guide.tab_tips"), icon: Sparkles }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg font-black text-[10px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeSection === tab.id
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-yellow-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      <div className="min-h-[300px]">
        {activeSection === "tutorial" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5 text-xs text-slate-300 font-sans"
          >
            {language === "id" ? (
              <>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">1. Kamera AR Scanner & Pinch-to-Zoom 🐾</h4>
                    <p className="leading-relaxed">
                      Gunakan fitur <span className="text-yellow-400 font-bold font-mono">KAMERA</span> yang kini dilengkapi dengan <span className="text-cyan-400 font-bold font-mono">AR NEKOMON SCANNER</span> real-time! Overlay scanner akan menampilkan telemetry HUD, bounding box pelacak sinyal kucing, dan persentase penguncian target.
                      Gunakan gestur <span className="text-yellow-400 font-bold font-mono">Pinch-to-Zoom</span> (cubit layar) atau tombol zoom <span className="text-yellow-400 font-bold font-mono">1.0x - 4.0x</span> untuk memperbesar foto kucing dari jarak jauh secara presisi. Setiap tangkapan foto memberikan <span className="text-yellow-400 font-bold font-mono">+10 Poin</span>!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">2. Peta Radar Spot & Quest Eksplorasi 🗺️</h4>
                    <p className="leading-relaxed">
                      Jelajahi lokasi sekitar menggunakan <span className="text-emerald-400 font-bold font-mono">PETA RADAR SPOT</span> (mendukung Real GPS & GPS Simulator). Temukan Spot Kucing Liar (Taman 🌳, Cat Cafe ☕, Stasiun 🚉, Lapangan ⚽) yang memberikan booster elemen khusus!
                      Selesaikan <span className="text-yellow-400 font-bold font-mono">Quest Eksplorasi Peta</span> seperti berjalan sejauh 1 km atau mendatangi spot khusus untuk mendapatkan hadiah gratis Poin, Nekomon Core, dan Kartu Pack!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">3. Spot Komunitas & Validasi Real-Time 👥</h4>
                    <p className="leading-relaxed">
                      Temukan kucing unik di area sekitar Anda? Daftarkan ke <span className="text-cyan-400 font-bold font-mono">SPOT KOMUNITAS</span> agar Trainer lain dapat berkunjung dan menangkapnya! Berikan dukungan ("Valid!") pada spot yang didaftarkan pemain lain untuk membangun reputasi komunitas Trainer terbaik.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Hammer className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">4. Tempa Menjadi Kartu Nekomon ⚔️</h4>
                    <p className="leading-relaxed">
                      Buka tab <span className="text-teal-400 font-bold font-mono">ALBUM KOLEKSI</span>, pilih foto kucing hasil tangkapan Anda, lalu klik tombol penempaan untuk membawanya ke <span className="text-teal-400 font-bold font-mono">FORGING STATION</span>. Kartu Nekomon baru akan ditempa secara instan menggunakan AI, lengkap dengan Elemen unik, Faksi (Faksi Sentinel/Faksi Vanguard), statistik acak (HP, ATK, DEF, SPD), serta tingkat kelangkaan (Rarity) dari Common hingga Legendary!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">5. Bertempur & Barter Kartu Online 🏆</h4>
                    <p className="leading-relaxed">
                      Uji kekuatan Dek Nekomon Anda di <span className="text-rose-400 font-bold font-mono">ARENA PVP</span> melawan pemain lain secara real-time atau lawan bot AI. Gunakan menu <span className="text-amber-500 font-bold font-mono">BARTER</span> untuk menukarkan kartu duplikat secara adil dengan sesama Trainer online untuk melengkapi koleksi Anda!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">6. Mode Dominasi Wilayah & Beacon War (16 Titik Strategis) 🏰</h4>
                    <p className="leading-relaxed">
                      Kuasai area strategis pada peta 16 Beacon berjenjang (Tier 1: 5 Cores, Tier 2: 7 Cores, Tier 3: 10 Cores/hari) dengan memasang kartu bertingkat kelangkaan <span className="text-amber-400 font-bold font-mono">MYTHIC</span> sebagai <span className="text-amber-300 font-bold font-mono">BEACON ANCHOR</span>!
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Sebaran 16 Beacon Merata:</span> Mencakup Markas Sentinel di barat, Markas Vanguard di timur, serta jalur sentral Monas dan koridor strategis lintas 5 elemen (Air, Api, Tanah, Angin, Petir).
                      <br/>
                      <span className="text-red-400 font-bold font-mono">• Supply Line Cut-off:</span> Jika jalur koneksi ke markas terputus, Beacon hilir berhenti menghasilkan Cores sampai jalur tersambung kembali!
                      <br/>
                      <span className="text-orange-400 font-bold font-mono">• Jeda Penaklukan & Pemangkasan Waktu Garnisun:</span> Standar jeda penaklukan adalah 2 jam. Level kartu Mythic Anchor memberikan bonus kecepatan (+8% speed/level). Ditambah lagi, menyiagakan kartu <span className="text-teal-400 font-bold font-mono">Garnisun Awal</span> langsung memangkas waktu jeda sebesar <span className="text-emerald-400 font-bold font-mono">-5 Menit per kartu</span> (maks 3 kartu = -15 Menit)!
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Filter Mythic & Pemindahan Anchor:</span> Anda dapat menyaring kartu <span className="text-cyan-300 font-mono font-bold">Mythic Idle</span> di Galeri untuk melihat kartu yang belum terpasang. Kartu yang sudah menjadi anchor dapat dipindahkan ke beacon lain melalui dialog konfirmasi aman.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-300 font-mono text-xs uppercase mb-1">7. Kotak Surat & Sistem Hadiah Pengembang 📬</h4>
                    <p className="leading-relaxed">
                      Akses menu <span className="text-purple-400 font-bold font-mono">KOTAK SURAT (MAILBOX)</span> untuk menerima pengumuman resmi dan pesan pribadi antar Trainer.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Hadiah Broadcast & Privat:</span> Pengembang resmi (<span className="text-amber-300 font-mono">verydiaz@gmail.com</span> & <span className="text-amber-300 font-mono">support@nekomon.online</span>) dapat menyiarkan surat resmi berisi bonus Poin & Nekomon Cores ke seluruh pemain atau memberikan hadiah apresiasi khusus langsung ke akun trainer pilihanmu!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-300 font-mono text-xs uppercase mb-1">8. Registrasi & Verifikasi Email Otentik 🔐</h4>
                    <p className="leading-relaxed">
                      Pendaftaran akun baru Nekomon dilindungi oleh verifikasi email resmi via SMTP Server <span className="text-cyan-400 font-mono font-bold">support@nekomon.online</span>.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Link & Kode OTP 6-Digit:</span> Saat mendaftar, sistem otomatis mengirim email berisi tombol verifikasi langsung dan kode OTP 6-digit. Anda dapat mengklik tombol di email atau mengetikkan kode OTP di layar untuk menyelesaikan pendaftaran akun Anda secara instan dan aman.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-yellow-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-300 font-mono text-xs uppercase mb-1">9. Animasi Transisi Tab Halus Native Mobile 📱</h4>
                    <p className="leading-relaxed">
                      Antarmuka game dilengkapi transisi animasi <span className="text-yellow-400 font-bold font-mono">Framer Motion</span> dengan kurva akselerasi pegas (*spring cubic-bezier*) dan indikator pil aktif bergerak (*layoutId morphing pill*). Memberikan respons sentuhan super halus layaknya aplikasi mobile Android/iOS native tanpa jeda muat ulang halaman!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 font-mono text-xs uppercase mb-1">10. Geolocation Foto Kucing & Berbagi di Chat 📍📸</h4>
                    <p className="leading-relaxed">
                      Setiap foto kucing yang Anda tangkap di kamera otomatis dilengkapi koordinat <span className="text-emerald-400 font-bold font-mono">Geolocation (GPS)</span> presisi tinggi serta nama spot tangkapan.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Bagikan ke Chat Trainer:</span> Anda dapat membagikan foto kucing favorit beserta koordinat lokasinya ke pesan privat (Direct Message) Trainer lain langsung dari Galeri atau tombol lampiran kamera di ruang chat!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">11. Event & Mitra Peduli Kucing (Social Quests & Sponsor) 🛍️🐾</h4>
                    <p className="leading-relaxed">
                      Jelajahi tab <span className="text-amber-400 font-bold font-mono">EVENT & MITRA</span> untuk mengakses program kolaborasi resmi Nekomon bersama Pet Shop lokal, Klinik Dokter Hewan (Vet), Merek Pakan Kucing, dan Shelter Penyelamatan Hewan Terlantar.
                      <br className="my-1"/>
                      <span className="text-emerald-400 font-bold font-mono">• Kode Voucher & Diskon Fisik:</span> Dapatkan kode promo untuk diskon konsultasi dokter hewan, sterilisasi, dan belanja pakan di toko mitra.
                      <br/>
                      <span className="text-rose-400 font-bold font-mono">• Misi Donasi Shelter Nyata:</span> Dukung kampanye donasi pakan untuk ratusan kucing terlantar di shelter resmi melalui transaksi mitra.
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Akses Pengembang:</span> Akun Developer (<span className="text-amber-300 font-mono">verydiaz@gmail.com</span>, <span className="text-amber-300 font-mono">nekomaster@nekomon.online</span>, <span className="text-amber-300 font-mono">support@nekomon.online</span>) dapat mempublikasikan dan mengelola banner event secara langsung melalui panel game!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-red-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-300 font-mono text-xs uppercase mb-1">12. Fitur Raid Boss Co-op & Mekanisme Pertempuran ⚔️🐾</h4>
                    <p className="leading-relaxed">
                      Hadapi Boss raksasa dari 3 spesies (<span className="text-amber-400 font-bold font-mono">Kucing, Tikus, dan Anjing</span>) dengan versi yang telah ditempa (<span className="text-cyan-300 font-bold font-mono">Forged</span>) dalam 5 elemen dasar (<span className="text-rose-400 font-mono">Api</span>, <span className="text-sky-400 font-mono">Air</span>, <span className="text-emerald-400 font-mono">Tanah</span>, <span className="text-teal-400 font-mono">Angin</span>, <span className="text-yellow-400 font-mono">Petir</span>) dengan sistem leveling dan aturan energi!
                      <br className="my-1"/>
                      <span className="text-emerald-400 font-bold font-mono">• Radius Spawning 50 KM:</span> Boss raid hanya akan muncul pada radar dan peta jika berada dalam radius maksimal 50 km dari koordinat GPS pemain berada.
                      <br/>
                      <span className="text-amber-400 font-bold font-mono">• Status Defeated & Respawn 10-15 Menit:</span> Boss raid yang telah berhasil dikalahkan pemain akan berstatus <span className="text-red-400 font-bold font-mono">Defeated</span> dan baru akan spawn kembali setelah jeda waktu pendinginan (cooldown) 10 hingga 15 menit.
                      <br/>
                      <span className="text-yellow-400 font-bold font-mono">• Syarat Energi (Minimal 2 Bar):</span> Untuk melakukan boss raid, masing-masing kartu Nekomon yang dipilih setidaknya memiliki 2 bar energi dan akan langsung terpakai saat eksekusi boss raid dimulai.
                      <br/>
                      <span className="text-rose-400 font-bold font-mono">• Penguncian Kartu (Lockout):</span> Kartu Nekomon yang sedang menjalankan eksekusi Boss Raid terkunci dan tidak bisa digunakan untuk aktivitas lain hingga eksekusi boss raid selesai. Saat eksekusi raid selesai (menang, kalah, atau keluar arena), seluruh kartu langsung dibuka kuncinya dan kembali tersedia (available) selama sisa energi bar mencukupi.
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Konfigurasi 3 Slot Pasukan:</span> Pertarungan Raid menyediakan minimal 3 slot kartu yang dapat diisi secara <span className="text-cyan-300 font-bold font-mono">Single Player</span> (memasang 3 kartu milikmu sendiri) atau <span className="text-indigo-300 font-bold font-mono">Multiplayer Co-op</span> (membuka room dan bertarung bersama 2 Trainer lain dari faksi Sentinel maupun Vanguard).
                      <br/>
                      <span className="text-purple-400 font-bold font-mono">• Hadiah Bersama (Shared Rewards):</span> Kemenangan Raid membagikan hadiah rata ke semua pemain yang berpartisipasi: <span className="text-amber-300 font-bold font-mono">Nekomon Cores</span>, <span className="text-indigo-300 font-bold font-mono">Poin</span>, <span className="text-yellow-300 font-bold font-mono">Pemulihan Energi</span>, dan <span className="text-rose-300 font-bold font-mono">Card XP</span>.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-yellow-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-300 font-mono text-xs uppercase mb-1">13. Kebijakan Refund & Transaksi Aman Payment Gateway 🛡️💳</h4>
                    <p className="leading-relaxed">
                      Nekomon Online menerapkan standar transparansi pembayaran resmi dengan gateway pembayaran terpercaya (iPaymu & Midtrans) dan perlindungan Google AdSense.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Perlindungan Pembayaran Ganda & Item Belum Masuk:</span> Jika terjadi kegagalan sistem atau kendala transfer, Trainer dapat mengajukan klaim pengembalian dana dalam waktu 7 hari ke email resmi pengembang: <span className="text-amber-300 font-mono">support@nekomon.online</span> atau Instagram <span className="text-amber-300 font-mono">@nekomontcg</span>.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Akses Legal Kapan Saja:</span> Baca ketentuan lengkap melalui tombol <span className="text-yellow-400 font-mono font-bold">Kebijakan Refund</span> pada footer landing page atau halaman Shop.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-300 font-mono text-xs uppercase mb-1">14. Ketahanan Data Cloud Firestore & Backup Database 1-Klik ☁️💾</h4>
                    <p className="leading-relaxed">
                      Histori akun, kartu tempaan, spot kucing komunitas, dan saldo Anda tersimpan aman dengan arsitektur <span className="text-cyan-400 font-bold font-mono">Google Cloud Firestore</span> yang otomatis memulihkan data setiap kali server di-deploy atau restart.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Tombol DB Backup Khusus Developer:</span> Akun Developer resmi (<span className="text-amber-300 font-mono">support@nekomon.online</span>) dapat mengunduh salinan cadangan lengkap format <span className="text-yellow-400 font-mono font-bold">.JSON</span>, memulihkan database secara instan (*1-Click Restore*), serta memaksa sinkronisasi real-time ke Cloud Firestore kapan saja dari bilah navigasi atas!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 font-mono text-xs uppercase mb-1">15. Virtual Routing & Standar Bot Crawler Google AdSense 🌐🤖</h4>
                    <p className="leading-relaxed">
                      Sistem routing server dan web app kini mendukung <span className="text-emerald-400 font-bold font-mono">Multi-Page Virtual Routing</span> penuh untuk memenuhi kepatuhan bot crawler Google AdSense dan Googlebot.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• URL Khusus Kebijakan & SEO:</span> Rute mandiri seperti <span className="text-amber-300 font-mono">/privacy-policy</span>, <span className="text-amber-300 font-mono">/terms-of-service</span>, <span className="text-amber-300 font-mono">/refund-policy</span>, <span className="text-amber-300 font-mono">/about</span>, <span className="text-amber-300 font-mono">/contact</span>, <span className="text-amber-300 font-mono">/disclaimer</span>, dan <span className="text-amber-300 font-mono">/guide</span> direspons dengan metadata title dinamis, Open Graph lengkap, serta konten teks kebijakan semantik yang langsung terbaca bot perayap maupun pengunjung web.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 font-mono text-xs uppercase mb-1">16. Integrasi Payment Gateway iPaymu (VA & QRIS Resmi) 💳⚡</h4>
                    <p className="leading-relaxed">
                      Nekomon Shop telah resmi terintegrasi dengan <span className="text-emerald-400 font-bold font-mono">iPaymu Payment Gateway</span> untuk pembelian Nekomon Points dan Booster Pack secara instan dan aman.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Virtual Account & Saluran Resmi:</span> Didukung saluran pembayaran QRIS Instan (GoPay, OVO, Dana, ShopeePay, LinkAja) serta Virtual Account Bank resmi (<span className="text-emerald-300 font-mono font-bold">No. VA iPaymu: 1179005624089327</span>). Pembayaran diverifikasi otomatis dan item langsung masuk ke akun Trainer dalam hitungan detik!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-300 font-mono text-xs uppercase mb-1">17. Spawn Raid Boss di Peta Spot GPS (Radius 50 KM) ⚔️📍</h4>
                    <p className="leading-relaxed">
                      Lokasi aktif spawn Raid Boss kini diproyeksikan langsung secara real-time pada <span className="text-amber-400 font-bold font-mono">Peta Spot Nekomon</span> khusus dalam radius 50 km dari posisi pemain.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Tombol Lacak Boss:</span> Klik tombol <span className="text-rose-400 font-mono font-bold">Boss</span> di bilah toolbar peta untuk secara instan mengarahkan kamera ke Raid Boss terdekat dari lokasi GPS Anda.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Radius 50 KM & Status Defeated:</span> Boss raid hanya muncul jika berjarak ≤ 50 km. Boss yang baru saja dikalahkan menampilkan status Defeated lengkap dengan timer mundur sebelum respawn kembali dalam 10-15 menit.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-300 font-mono text-xs uppercase mb-1">18. 5 Menu Utama & Mode Carousel Dinamis 📱⚡</h4>
                    <p className="leading-relaxed">
                      Antarmuka navigasi game kini mengusung arsitektur <span className="text-indigo-400 font-bold font-mono">Streamlined Dual-Tier</span> yang sangat rapi dan bebas redundansi:
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• 5 Menu Utama Terpadu:</span> Hanya menampilkan kategori utama: <span className="text-amber-300">Eksplorasi & Peta</span>, <span className="text-pink-300">Koleksi & Deteksi</span>, <span className="text-purple-300">Pertempuran & Misi</span>, <span className="text-teal-300">Komunitas & Toko</span>, serta <span className="text-blue-300">Akun & Bantuan</span>.
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Dynamic Sub-Menu Carousel:</span> Sub-menu hanya akan muncul saat kategori tersebut diakses atau diklik dalam mode pita carousel interaktif yang fleksibel digeser dengan tombol navigasi geser kiri-kanan.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Action Dock Bebas Redundan:</span> Action dock bawah (mobile/tablet) selaras menampilkan 5 kategori inti, tanpa menduplikasi tombol sub-menu individual sehingga kontrol tetap bersih dan intuitif.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-teal-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-300 font-mono text-xs uppercase mb-1">19. Status Aktivitas Pemain & Riwayat Terakhir Online 🟢⏱️</h4>
                    <p className="leading-relaxed">
                      Di menu <span className="text-teal-400 font-bold font-mono">Surat & Pesan (Mailbox)</span>, status pemain ditampilkan secara transparan dan akurat.
                      <br className="my-1"/>
                      <span className="text-emerald-400 font-bold font-mono">• Online & Terakhir Dilihat:</span> Titik hijau berdenyut menandakan Trainer sedang aktif bermain, sementara saat offline sistem menampilkan catatan waktu kapan terakhir kali pemain online (misal: "Terakhir online 15m lalu" atau "1 hari lalu").
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-red-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-300 font-mono text-xs uppercase mb-1">20. Raid Boss Lintas Kota & Sistem Pembukaan Bertingkat 📍⚔️</h4>
                    <p className="leading-relaxed">
                      Pertarungan <span className="text-red-400 font-bold font-mono">Raid Boss Co-op</span> kini hadir di setiap kota besar di Indonesia (Jakarta, Bandung, Surabaya, Yogyakarta, Medan, Denpasar, Semarang, Makassar, Palembang, Malang, dsb) tanpa batasan jarak!
                      <br className="my-1"/>
                      <span className="text-amber-400 font-bold font-mono">• Bos Siaga (Level 6, 7, 8):</span> Tiga tingkat bos awal selalu siaga (standby) di setiap kota.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Pembukaan 2 Tingkat Berikutnya:</span> Dua level berikutnya (misal Level 9 dan 10) baru akan spawn di spot map setelah bos level sebelumnya (Level 8) dikalahkan oleh pemain.
                      <br/>
                      <span className="text-yellow-400 font-bold font-mono">• Kontrol Developer Resmi:</span> Akun developer resmi (<span className="text-amber-300 font-mono">verydiaz@gmail.com</span> & <span className="text-amber-300 font-mono">support@nekomon.online</span>) dilengkapi panel kendali spawn boss manual serta backup dan restore database 1-klik untuk menjaga keutuhan data pemain.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">21. Menu Pengaturan Terpusat (Audio, Bahasa & PWA) ⚙️🎵</h4>
                    <p className="leading-relaxed">
                      Fitur preferensi sistem kini disatukan rapi ke dalam menu <span className="text-amber-400 font-bold font-mono">Pengaturan (Settings)</span> yang dapat diakses langsung dari Action Dock bawah (di sebelah menu Akun):
                      <br className="my-1"/>
                      <span className="text-cyan-400 font-bold font-mono">• Submenu Audio:</span> Mengatur pemutar soundtrack BGM (Petualangan, Arena PvP, dan Hening), volume musik, serta tombol mute/unmute SFX. Tombol mengambang sebelumnya telah dipindahkan sehingga layar utama lebih bersih.
                      <br/>
                      <span className="text-yellow-400 font-bold font-mono">• Submenu Bahasa:</span> Mengganti bahasa seluruh game secara instan antara Bahasa Indonesia (ID) dan English (EN).
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Submenu Install Aplikasi:</span> Memasang Nekomon sebagai aplikasi Android / Progressive Web App (PWA) lengkap dengan panduan instalasi di Chrome dan Safari.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">1. AR Scanner Camera & Pinch-to-Zoom 🐾</h4>
                    <p className="leading-relaxed">
                      Use the <span className="text-yellow-400 font-bold font-mono">CAMERA</span> equipped with real-time <span className="text-cyan-400 font-bold font-mono">AR NEKOMON SCANNER</span>! The AR overlay displays tactical telemetry, floating bounding boxes tracking cat signals, and lock confidence.
                      Use <span className="text-yellow-400 font-bold font-mono">Pinch-to-Zoom</span> gestures or <span className="text-yellow-400 font-bold font-mono">1.0x - 4.0x</span> zoom controls to capture distant cats precisely. Each capture awards <span className="text-yellow-400 font-bold font-mono">+10 Points</span>!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">2. Radar Spot Map & Map Quests 🗺️</h4>
                    <p className="leading-relaxed">
                      Explore surroundings using the <span className="text-emerald-400 font-bold font-mono">RADAR SPOT MAP</span> (supports Real GPS & GPS Simulator). Locate wild cat spots (Parks 🌳, Cat Cafes ☕, Stations 🚉) offering elemental boosts!
                      Complete <span className="text-yellow-400 font-bold font-mono">Map Exploration Quests</span> such as traveling 1 km or visiting specific spots to claim free Points, Nekomon Cores, and Booster Card Packs!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">3. Community Spots & Validation 👥</h4>
                    <p className="leading-relaxed">
                      Spotted a unique cat nearby? Register it on <span className="text-cyan-400 font-bold font-mono">COMMUNITY SPOTS</span> for other Trainers to discover and capture! Support ("Valid!") spots created by other players to boost community trust and standing.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Hammer className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">4. Forge into Nekomon Cards ⚔️</h4>
                    <p className="leading-relaxed">
                      Open the <span className="text-teal-400 font-bold font-mono">CARDS</span> tab, select your captured cat photo, then click forge to bring it to the <span className="text-teal-400 font-bold font-mono">FORGING STATION</span>. A brand new Nekomon Card will be forged instantly using AI, featuring unique Elements, Art Style (Sentinel/Vanguard), randomized stats (HP, ATK, DEF, SPD), and rarity from Common to Legendary!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">5. Battle & Trade Cards Online 🏆</h4>
                    <p className="leading-relaxed">
                      Test your deck strength on the <span className="text-rose-400 font-bold font-mono">PVP ARENA</span> against players live or against AI bots. Use the <span className="text-amber-500 font-bold font-mono">TRADING</span> floor to swap duplicate cards fairly with online Trainers to complete your collection!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">6. Territory Control & Beacon War (16 Strategic Nodes) 🏰</h4>
                    <p className="leading-relaxed">
                      Dominate map areas across 16 tiered Beacons (Tier 1: 5 Cores, Tier 2: 7 Cores, Tier 3: 10 Cores/day) by anchoring <span className="text-amber-400 font-bold font-mono">MYTHIC</span> rarity cards as <span className="text-amber-300 font-bold font-mono">BEACON ANCHORS</span>!
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• 16 Evenly Distributed Beacons:</span> Spans the Sentinel Base in the west, Vanguard Stronghold in the east, central Monas nexus, and all 5 elemental hubs (Water, Fire, Earth, Wind, Lightning).
                      <br/>
                      <span className="text-red-400 font-bold font-mono">• Supply Line Cut-off:</span> Severed supply lines disable downstream beacons and halt core generation until reconnected!
                      <br/>
                      <span className="text-orange-400 font-bold font-mono">• Capture Cooldown & Garrison Reductions:</span> Standard cooldown is 2 hours. Mythic Anchor card levels grant capture speed (+8% speed/level). Stationing <span className="text-teal-400 font-bold font-mono">Initial Garrison</span> cards shaves off <span className="text-emerald-400 font-bold font-mono">-5 Minutes cooldown per card</span> (up to 3 cards = -15 Mins)!
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Mythic Filter & Anchor Relocation:</span> Filter for <span className="text-cyan-300 font-mono font-bold">Mythic Idle</span> cards in Gallery to see available anchors. Anchored cards can be relocated to new beacons with a safe confirmation step.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-300 font-mono text-xs uppercase mb-1">7. Mailbox & Developer Gift System 📬</h4>
                    <p className="leading-relaxed">
                      Open the <span className="text-purple-400 font-bold font-mono">MAILBOX</span> tab for official announcements and player-to-player direct messages.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Broadcast & Private Gifts:</span> Official developers (<span className="text-amber-300 font-mono">verydiaz@gmail.com</span> & <span className="text-amber-300 font-mono">support@nekomon.online</span>) can broadcast system-wide reward letters or send direct Point & Nekomon Core gifts to chosen trainer accounts!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-300 font-mono text-xs uppercase mb-1">8. Authentic Email Verification 🔐</h4>
                    <p className="leading-relaxed">
                      New Nekomon account registrations are protected by official email verification via SMTP Server <span className="text-cyan-400 font-mono font-bold">support@nekomon.online</span>.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Link & 6-Digit OTP:</span> Upon registration, the system sends an email with a direct verification link and a 6-digit OTP code. You can click the email link or enter the OTP code on screen to complete your registration quickly and securely.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-yellow-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-300 font-mono text-xs uppercase mb-1">9. Native Mobile Smooth Tab Transitions 📱</h4>
                    <p className="leading-relaxed">
                      The game interface incorporates smooth <span className="text-yellow-400 font-bold font-mono">Framer Motion</span> view transitions with spring cubic-bezier easing and dynamic pill layout morphing (*layoutId morphing pill*). Delivers a fluid, native app-like experience on mobile and desktop without page reload flickers!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 font-mono text-xs uppercase mb-1">10. Cat Photo Geolocation & Chat Sharing 📍📸</h4>
                    <p className="leading-relaxed">
                      Every cat photo captured with your camera automatically embeds authentic <span className="text-emerald-400 font-bold font-mono">Geolocation (GPS)</span> coordinates and spot tags.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Share in Trainer Chat:</span> You can seamlessly share captured cat photos along with their location tags in Direct Messages with other Trainers directly from your Gallery or the chat camera attachment tool!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">11. Events & Cat Care Partners (Social Quests & Sponsors) 🛍️🐾</h4>
                    <p className="leading-relaxed">
                      Open the <span className="text-amber-400 font-bold font-mono">EVENTS & PARTNERS</span> tab to discover official collaborations with local Pet Shops, Veterinary Clinics, Cat Food Brands, and Rescue Shelters.
                      <br className="my-1"/>
                      <span className="text-emerald-400 font-bold font-mono">• Vouchers & Physical Discounts:</span> Unlock promo codes for discounts on vet checkups, neutering, and pet food purchases.
                      <br/>
                      <span className="text-rose-400 font-bold font-mono">• Real Shelter Food Drives:</span> Support shelter food campaigns providing meals for rescued stray cats through partner activities.
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Developer Access:</span> Verified Developer accounts (<span className="text-amber-300 font-mono">verydiaz@gmail.com</span>, <span className="text-amber-300 font-mono">nekomaster@nekomon.online</span>, <span className="text-amber-300 font-mono">support@nekomon.online</span>) can publish and manage events directly in-game without code editing!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-red-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-300 font-mono text-xs uppercase mb-1">12. Co-op Raid Boss Mechanics & Combat Requirements ⚔️🐾</h4>
                    <p className="leading-relaxed">
                      Encounter colossal Bosses from 3 species (<span className="text-amber-400 font-bold font-mono">Cat, Rat, and Dog</span>) forged across the 5 core elements (<span className="text-rose-400 font-mono">Fire</span>, <span className="text-sky-400 font-mono">Water</span>, <span className="text-emerald-400 font-mono">Earth</span>, <span className="text-teal-400 font-mono">Wind</span>, <span className="text-yellow-400 font-mono">Thunder</span>) with tactical energy rules!
                      <br className="my-1"/>
                      <span className="text-emerald-400 font-bold font-mono">• 50 KM Spawning Radius:</span> Raid Bosses only spawn and display on your radar and map if they are situated within a 50 km radius of your current player location.
                      <br/>
                      <span className="text-amber-400 font-bold font-mono">• Defeated Status & 10-15 Min Respawn:</span> Defeated bosses enter a <span className="text-red-400 font-bold font-mono">Defeated</span> cooldown state and will only respawn after a 10 to 15 minute interval.
                      <br/>
                      <span className="text-yellow-400 font-bold font-mono">• Energy Requirement (≥ 2 Bars):</span> Each participating Nekomon card must possess at least 2 energy bars. These 2 energy bars are deducted immediately upon launching the raid battle.
                      <br/>
                      <span className="text-rose-400 font-bold font-mono">• Card Lockout:</span> Any card actively assigned to an ongoing Raid Boss battle is temporarily locked and cannot be deployed in other activities (such as Beacon Territory wars) until the raid concludes. Once the raid concludes (victory, defeat, or exit), all cards are immediately unlocked and available again across all activities as long as their energy bars are sufficient.
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• 3-Slot Combat Squad:</span> Raid battles feature a 3-slot combat formation available in <span className="text-cyan-300 font-bold font-mono">Single Player</span> (equip 3 cards from your deck) or <span className="text-indigo-300 font-bold font-mono">Multiplayer Co-op</span> (create room and battle with 2 other trainers from Sentinel or Vanguard factions).
                      <br/>
                      <span className="text-purple-400 font-bold font-mono">• Shared Rewards:</span> Victorious Raids distribute shared rewards to all participating players: <span className="text-amber-300 font-bold font-mono">Nekomon Cores</span>, <span className="text-indigo-300 font-bold font-mono">Points</span>, <span className="text-yellow-300 font-bold font-mono">Energy Refill</span>, and <span className="text-rose-300 font-bold font-mono">Card XP</span>.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-yellow-500/30 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-300 font-mono text-xs uppercase mb-1">13. Refund Policy & Secure Payment Gateway Transactions 🛡️💳</h4>
                    <p className="leading-relaxed">
                      Nekomon Online maintains transparent consumer protection policies in compliance with official secure payment gateways (iPaymu & Midtrans) and Google AdSense guidelines.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Double Billing & Non-Delivery Protection:</span> In cases of verified payment anomalies or undelivered digital items, Trainers can submit a refund claim within 7 calendar days to: <span className="text-amber-300 font-mono">support@nekomon.online</span> or Instagram <span className="text-amber-300 font-mono">@nekomontcg</span>.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Instant Policy Access:</span> Review complete legal terms via the <span className="text-yellow-400 font-mono font-bold">Refund Policy</span> button in the landing page footer or Shop page.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-300 font-mono text-xs uppercase mb-1">14. Cloud Firestore Persistence & 1-Click Database Backup ☁️💾</h4>
                    <p className="leading-relaxed">
                      Your account history, forged cards, community spots, and balances are securely preserved with <span className="text-cyan-400 font-bold font-mono">Google Cloud Firestore</span> architecture that automatically synchronizes and reloads data upon every server deployment or restart.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Developer DB Backup Button:</span> Verified Developer accounts (<span className="text-amber-300 font-mono">support@nekomon.online</span>) can export full <span className="text-yellow-400 font-mono font-bold">.JSON</span> backups, perform 1-Click database restores, and trigger real-time Firestore sync anytime from the top navigation bar!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 font-mono text-xs uppercase mb-1">15. Virtual Routing & Google AdSense Bot Crawler Compliance 🌐🤖</h4>
                    <p className="leading-relaxed">
                      The application server and front-end now feature comprehensive <span className="text-emerald-400 font-bold font-mono">Multi-Page Virtual Routing</span> specifically designed to meet Google AdSense, Mediapartners-Google, and Googlebot crawler indexing standards.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Dedicated Policy & SEO Endpoints:</span> Standalone URLs including <span className="text-amber-300 font-mono">/privacy-policy</span>, <span className="text-amber-300 font-mono">/terms-of-service</span>, <span className="text-amber-300 font-mono">/refund-policy</span>, <span className="text-amber-300 font-mono">/about</span>, <span className="text-amber-300 font-mono">/contact</span>, <span className="text-amber-300 font-mono">/disclaimer</span>, and <span className="text-amber-300 font-mono">/guide</span> are served with dynamic meta titles, canonical links, Open Graph tags, and pre-rendered semantic HTML readable by web indexers and users alike.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 font-mono text-xs uppercase mb-1">16. iPaymu Payment Gateway Integration (Official VA & QRIS) 💳⚡</h4>
                    <p className="leading-relaxed">
                      Nekomon Shop is officially connected to <span className="text-emerald-400 font-bold font-mono">iPaymu Payment Gateway</span> for secure, seamless digital microtransactions (Nekomon Points & Booster Packs).
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Official Virtual Account & Channels:</span> Supports Instant QRIS (GoPay, OVO, Dana, ShopeePay, LinkAja) and Bank Virtual Accounts (<span className="text-emerald-300 font-mono font-bold">Official iPaymu VA: 1179005624089327</span>). Transactions are instantly verified, crediting purchased points and booster packs to your Trainer vault within seconds!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-300 font-mono text-xs uppercase mb-1">17. Raid Boss GPS Spot Map Spawns (50 KM Radius) ⚔️📍</h4>
                    <p className="leading-relaxed">
                      Active Raid Boss spawn points are rendered directly in real-time onto the <span className="text-amber-400 font-bold font-mono">Nekomon Spot Map</span> exclusively within a 50 km radius of your player coordinates.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Boss Focus Shortcut:</span> Click the <span className="text-rose-400 font-mono font-bold">Boss</span> quick button on the map toolbar to smoothly center the camera onto the nearest active Raid Boss.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• 50 KM Radar & Defeated Cooldown:</span> Only bosses within ≤ 50 km appear. Once defeated, bosses display a Defeated status and a countdown timer before respawning in 10-15 minutes.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-300 font-mono text-xs uppercase mb-1">18. 5 Main Menus & Dynamic Sub-Menu Carousel 📱⚡</h4>
                    <p className="leading-relaxed">
                      The game navigation now features a streamlined <span className="text-indigo-400 font-bold font-mono">Dual-Tier Carousel</span> design that eliminates clutter and redundancy:
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• 5 Unified Main Menus:</span> Displays only the five top categories: <span className="text-amber-300">Exploration & Maps</span>, <span className="text-pink-300">Collection & Dex</span>, <span className="text-purple-300">Battle & Quests</span>, <span className="text-teal-300">Community & Shop</span>, and <span className="text-blue-300">Account & Support</span>.
                      <br/>
                      <span className="text-cyan-400 font-bold font-mono">• Dynamic Sub-Menu Carousel:</span> Sub-menus only appear when a category is accessed or clicked, presented in a sleek horizontal carousel with smooth left/right navigation controls.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Non-Redundant Action Dock:</span> The bottom action dock on mobile and tablet cleanly reflects the 5 core categories without duplicating individual sub-items, keeping the interface uncluttered and ergonomic.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-teal-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-300 font-mono text-xs uppercase mb-1">19. Player Presence & Activity Status History 🟢⏱️</h4>
                    <p className="leading-relaxed">
                      In the <span className="text-teal-400 font-bold font-mono">Mailbox & Messaging Hub</span>, player presence is tracked accurately.
                      <br className="my-1"/>
                      <span className="text-emerald-400 font-bold font-mono">• Online & Last Seen:</span> A pulsing green indicator signals active trainers, while offline players display an exact timestamp of when they were last seen online (e.g. "Last seen 15m ago" or "Yesterday").
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-red-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-300 font-mono text-xs uppercase mb-1">20. Multi-City Raid Bosses & Progressive Tier Unlocks 📍⚔️</h4>
                    <p className="leading-relaxed">
                      Colossal <span className="text-red-400 font-bold font-mono">Co-op Raid Bosses</span> now spawn in major cities throughout Indonesia (Jakarta, Bandung, Surabaya, Yogyakarta, Medan, Denpasar, Semarang, Makassar, Palembang, Malang, etc.) without distance restrictions!
                      <br className="my-1"/>
                      <span className="text-amber-400 font-bold font-mono">• Standby Bosses (Levels 6, 7, 8):</span> The initial three tiers remain permanently active on standby across all cities.
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Sequential 2-Tier Progression:</span> Subsequent tiers (e.g. Levels 9 and 10) spawn on the spot map only after the preceding highest level (Level 8) is defeated.
                      <br/>
                      <span className="text-yellow-400 font-bold font-mono">• Official Developer Tools:</span> Authorized developer accounts (<span className="text-amber-300 font-mono">verydiaz@gmail.com</span> & <span className="text-amber-300 font-mono">support@nekomon.online</span>) have access to manual boss spawning tools and 1-click database backup/restore to safeguard player data.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/40 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">21. Centralized Settings Menu (Audio, Language & PWA) ⚙️🎵</h4>
                    <p className="leading-relaxed">
                      All system preferences are now unified into the <span className="text-amber-400 font-bold font-mono">Settings</span> menu, accessible directly from the bottom Action Dock (next to Account):
                      <br className="my-1"/>
                      <span className="text-cyan-400 font-bold font-mono">• Audio Submenu:</span> Control the BGM soundtrack player (Adventure, PvP Arena, and Ambient Silence), music volume, and mute/unmute SFX effects. The previous floating widget has been retired for a cleaner main screen.
                      <br/>
                      <span className="text-yellow-400 font-bold font-mono">• Language Submenu:</span> Switch the entire game language instantly between Indonesian (ID) and English (EN).
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Install App Submenu:</span> Install Nekomon as an Android / Progressive Web App (PWA) with step-by-step instructions for Chrome and Safari.
                    </p>
                  </div>
                </div>
              </>
            )
}
          </motion.div>
        )}

        {activeSection === "elements" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 font-mono text-xs"
          >
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <p className="text-slate-300 leading-relaxed font-sans mb-4">
                {language === "id"
                  ? "Pertempuran di Arena sangat dipengaruhi oleh kekuatan elemental. Menggunakan elemen yang unggul atas elemen musuh akan memberikan Bonus Damage yang signifikan saat menyerang!"
                  : "Arena combat is highly driven by elemental relationships. Attacking with an advantageous element grants a significant bonus damage modifier!"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {/* Air (Water) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <span className="font-bold text-blue-400">{language === "id" ? "AIR" : "WATER"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Unggul Atas (+40% PWR):" : "Advantage Vs (+40% PWR):"} <span className="text-red-400 font-bold">{language === "id" ? "Api" : "Fire"} 🔥</span> & <span className="text-amber-600 font-bold">{language === "id" ? "Tanah" : "Earth"} 🪵</span>
                  </div>
                </div>

                {/* Api (Fire) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-red-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="font-bold text-red-400">{language === "id" ? "API" : "FIRE"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Unggul Atas (+40% PWR):" : "Advantage Vs (+40% PWR):"} <span className="text-teal-400 font-bold">{language === "id" ? "Angin" : "Wind"} 🌪️</span> & <span className="text-yellow-400 font-bold">{language === "id" ? "Petir" : "Lightning"} ⚡</span>
                  </div>
                </div>

                {/* Angin (Wind) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-teal-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌪️</span>
                    <span className="font-bold text-teal-400">{language === "id" ? "ANGIN" : "WIND"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Unggul Atas (+40% PWR):" : "Advantage Vs (+40% PWR):"} <span className="text-amber-600 font-bold">{language === "id" ? "Tanah" : "Earth"} 🪵</span> & <span className="text-blue-400 font-bold">{language === "id" ? "Air" : "Water"} 💧</span>
                  </div>
                </div>

                {/* Tanah (Earth) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-amber-600/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪵</span>
                    <span className="font-bold text-amber-500">{language === "id" ? "TANAH" : "EARTH"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Unggul Atas (+40% PWR):" : "Advantage Vs (+40% PWR):"} <span className="text-yellow-400 font-bold">{language === "id" ? "Petir" : "Lightning"} ⚡</span> & <span className="text-red-400 font-bold">{language === "id" ? "Api" : "Fire"} 🔥</span>
                  </div>
                </div>

                {/* Petir (Lightning) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-yellow-500/20 flex items-center justify-between md:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-bold text-yellow-400">{language === "id" ? "PETIR" : "LIGHTNING"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Unggul Atas (+40% PWR):" : "Advantage Vs (+40% PWR):"} <span className="text-blue-400 font-bold">{language === "id" ? "Air" : "Water"} 💧</span> & <span className="text-teal-400 font-bold">{language === "id" ? "Angin" : "Wind"} 🌪️</span>
                  </div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-[11px] text-yellow-400 leading-relaxed font-sans">
                <span className="font-bold font-mono text-xs block mb-0.5">💡 {language === "id" ? "STRATEGI COMBAT:" : "COMBAT STRATEGY:"}</span>
                {language === "id" 
                  ? "Jika Nekomon Anda memiliki statistik SPD (Speed) yang lebih tinggi daripada lawan, Anda akan menyerang terlebih dahulu di setiap ronde pertempuran! Pastikan memilih kartu yang sesuai di menu taktis."
                  : "If your Nekomon's SPD (Speed) statistic is higher than your opponent's, you will strike first in every combat round! Choose your team tactically."}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "tips" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 font-sans text-xs text-slate-300 leading-relaxed"
          >
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-2 text-yellow-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> {language === "id" ? "Rahasia Nekomon Core 💎" : "Nekomon Core Secrets 💎"}
              </h4>
              <p>
                {language === "id"
                  ? "Nekomon Core adalah item ultra-langka yang bisa diperoleh sebagai hadiah dari misi harian kelas tinggi atau memenangkan pertempuran beruntun di Arena. Saat Anda melakukan penempaan kartu baru, Anda dapat mengonsumsi 1 Nekomon Core untuk secara drastis meningkatkan persentase peluang mendapatkan kartu dengan rarity Epic atau Legendary!"
                  : "Nekomon Cores are ultra-rare items obtained from high-tier daily missions or by maintaining win streaks in the Arena. Consuming 1 Nekomon Core during forging drastically increases your percentage chance of generating Epic or Legendary rarity cards!"}
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-2 text-teal-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> {language === "id" ? "Progres Trainer Level & EXP Bar 🎒" : "Trainer Level & EXP Bar Progression 🎒"}
              </h4>
              <p>
                {language === "id"
                  ? "Trainer Level kini memiliki sistem EXP Bar seimbang. Raih EXP dengan berburu foto kucing (+10 EXP), menuntaskan quest (+20 EXP), menempa kartu (+25 EXP), menang Arena (+30 EXP), dan menguasai Beacon (+50 EXP). Level yang lebih tinggi membuka batas potensi status penempaan kartu dan memperkuat wibawa Anda di papan peringkat!"
                  : "Trainer Level now features a balanced progressive EXP Bar. Earn EXP by capturing cat photos (+10 EXP), completing quests (+20 EXP), forging cards (+25 EXP), winning in Arena (+30 EXP), and capturing Beacons (+50 EXP). Higher levels increase forged card stat potentials and climb leaderboard ranks!"}
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-2 text-amber-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> {language === "id" ? "Batas Capture Spot Kucing (Maksimal 3x) 📍" : "Cat Spot Capture Limit (Max 3x) 📍"}
              </h4>
              <p>
                {language === "id"
                  ? "Aturan konservasi spot: Setiap titik spot peta memiliki kuota maksimal 3 kali penangkapan foto. Setelah 3 kali, kucing di spot tersebut akan beristirahat (Depleted), mendorong Trainer untuk menjelajahi spot baru di sekitar lingkungan Anda."
                  : "Spot conservation rule: Each map spot permits a maximum of 3 photo captures. After 3 captures, cats at that spot rest (Depleted), encouraging Trainers to explore new surrounding locations."}
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-2 text-rose-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> {language === "id" ? "Bonus Streak di Arena ⚔️" : "Arena Win Streak Bonus ⚔️"}
              </h4>
              <p>
                {language === "id"
                  ? "Mempertahankan kemenangan beruntun (Win Streak) di Arena akan melipatgandakan jumlah XP yang diperoleh kartu Anda setelah bertanding. Gunakan Nekomon terbaik Anda dengan elemen penangkal yang tepat untuk terus mendominasi pertempuran online."
                  : "Maintaining a continuous Win Streak in the Arena multiplies the XP awarded to your combat cards after every match. Utilize your best counters to dominate online!"}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Developer Credits & Official Business Info */}
      <div className="mt-6 pt-6 border-t border-slate-800 text-center flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full select-none">
          <span className="text-[10px] text-yellow-500 font-extrabold uppercase font-mono tracking-widest">
            {language === "id" ? "Pengembang & Kontak Usaha" : "Lead Developer & Business Contact"}
          </span>
        </div>
        <p className="text-sm font-black text-slate-100 tracking-wider">astronian22 • Nekomon Online Studio</p>
        
        {/* Contact Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
          <a 
            href="https://wa.me/6285624089327" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>085624089327</span>
          </a>

          <a 
            href="mailto:support@nekomon.online" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold hover:bg-yellow-500/20 transition-all cursor-pointer shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>support@nekomon.online</span>
          </a>

          <a 
            href="https://www.instagram.com/nekomontcg/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs font-bold hover:bg-pink-500/20 transition-all cursor-pointer shadow-sm"
          >
            <span>💬</span>
            <span>Instagram: @astronian22</span>
          </a>
        </div>

        {/* Business Address */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-center gap-2 max-w-md w-full">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>{language === "id" ? "Alamat Usaha:" : "Address:"}</strong> Pasir Putih Residence B7
          </span>
        </div>

        <p className="text-[11px] text-slate-400 font-mono max-w-md mx-auto">
          {language === "id"
            ? "Dibuat dengan dedikasi penuh untuk seluruh komunitas Trainer Nekomon di seluruh dunia. Selamat berburu kucing asli! 🐾"
            : "Developed with pure dedication for the global community of Nekomon Trainers. Happy real-life cat hunting! 🐾"}
        </p>
      </div>
    </div>
  );
};
