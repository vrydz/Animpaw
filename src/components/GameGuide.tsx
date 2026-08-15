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
  Mail
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
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">6. Mode Dominasi Wilayah & Beacon War (5 Cores/Hari) 🏰</h4>
                    <p className="leading-relaxed">
                      Kuasai area strategis pada peta dengan memasang kartu bertingkat kelangkaan <span className="text-amber-400 font-bold font-mono">MYTHIC</span> sebagai <span className="text-amber-300 font-bold font-mono">BEACON ANCHOR</span>! Setiap Beacon yang aktif menghasilkan <span className="text-cyan-400 font-bold font-mono">5 Nekomon Core points per hari</span>.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Aturan Koneksi:</span> Beacon baru harus terhubung langsung dengan wilayah milikmu atau Markas Faksimu (Sentinel / Vanguard).
                      <br/>
                      <span className="text-red-400 font-bold font-mono">• Supply Line Cut-off:</span> Jika jalur koneksi ke markas terputus, Beacon hilir berhenti menghasilkan Cores sampai jalur tersambung kembali!
                      <br/>
                      <span className="text-orange-400 font-bold font-mono">• Jeda Penaklukan (Cooldown 2 Jam):</span> Setelah berhasil merebut sebuah Beacon, penyerangan ke node di sekitarnya dijeda selama 2 jam dengan timer visual langsung untuk menyeimbangkan taktik permainan dan mencegah ekspansi kilat!
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Peran Semua Pemain:</span> Pemain tanpa kartu Mythic tetap dapat berpartisipasi dengan memperkuat pertahanan garnisun faksi (+HP & +Poin) atau menyerang garnisun musuh!
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
                    <h4 className="font-bold text-amber-300 font-mono text-xs uppercase mb-1">6. Territory Control & Beacon War (5 Cores/Day) 🏰</h4>
                    <p className="leading-relaxed">
                      Dominate map areas by anchoring <span className="text-amber-400 font-bold font-mono">MYTHIC</span> rarity cards as <span className="text-amber-300 font-bold font-mono">BEACON ANCHORS</span>! Each active Beacon node generates <span className="text-cyan-400 font-bold font-mono">5 Nekomon Core points per day</span>.
                      <br className="my-1"/>
                      <span className="text-yellow-400 font-bold font-mono">• Connection Rule:</span> New captures must be directly connected to an existing owned node or your Faction Base (Sentinel / Vanguard).
                      <br/>
                      <span className="text-red-400 font-bold font-mono">• Supply Line Cut-off:</span> Severed supply lines disable downstream beacons and halt core generation until reconnected!
                      <br/>
                      <span className="text-orange-400 font-bold font-mono">• Capture Cooldown (2 Hours):</span> After capturing a Beacon, attacks on adjacent nodes are paused for 2 hours with a live visual timer to balance territorial gameplay and prevent rapid expansion!
                      <br/>
                      <span className="text-emerald-400 font-bold font-mono">• Accessibility:</span> Non-mythic players can reinforce friendly garrisons (+HP & +Points) or assault enemy defenses!
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
              </>
            )}
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
                <Award className="w-4 h-4" /> {language === "id" ? "Tingkatkan Level Trainer Anda 🎒" : "Upgrade Your Trainer Level 🎒"}
              </h4>
              <p>
                {language === "id"
                  ? "Tingkat Level Trainer Anda dihitung secara dinamis berdasarkan jumlah total koleksi kartu Nekomon unik yang Anda miliki. Semakin tinggi Level Trainer Anda, semakin tinggi batasan HP maksimum kartu baru yang dapat ditempa secara acak!"
                  : "Your Trainer Level is computed dynamically based on the total number of unique Nekomon cards you own. A higher Trainer Level unlocks a higher cap for randomized HP metrics on newly forged cards!"}
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

      {/* Developer Credits - AS REQUESTED */}
      <div className="mt-6 pt-6 border-t border-slate-800 text-center flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full select-none">
          <span className="text-[10px] text-yellow-500 font-extrabold uppercase font-mono tracking-widest">Lead Developer</span>
        </div>
        <p className="text-sm font-black text-slate-100 tracking-wider">astronian22</p>
        <a 
          href="https://wa.me/6285624089327" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
        >
          <span className="text-sm">💬</span> WhatsApp: 085624089327
        </a>
        <p className="text-[11px] text-slate-400 font-mono max-w-md mx-auto">
          {language === "id"
            ? "Dibuat dengan dedikasi penuh untuk seluruh komunitas Trainer Nekomon di seluruh dunia. Selamat berburu kucing asli! 🐾"
            : "Developed with pure dedication for the global community of Nekomon Trainers. Happy real-life cat hunting! 🐾"}
        </p>
      </div>
    </div>
  );
};
