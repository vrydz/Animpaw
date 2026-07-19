import React, { useState } from "react";
import { BookOpen, Sparkles, Swords, Camera, Hammer, ArrowLeftRight, Gamepad2, Award, Flame, Droplets, Sprout, Wind, Zap, Trophy } from "lucide-react";
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
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">1. Buru & Potret Kucing Asli</h4>
                    <p className="leading-relaxed">
                      Gunakan fitur <span className="text-yellow-400 font-bold font-mono">KAMERA</span> untuk memfoto kucing nyata secara langsung di lingkungan Anda. Setiap foto kucing yang berhasil ditangkap memberikan <span className="text-yellow-400 font-bold font-mono">+10 Poin</span> dan disimpan ke dalam Album Koleksi Anda. 
                      <span className="block mt-1 text-slate-400 italic">*Catatan: Untuk keadilan bermain, fitur unggah foto dari galeri dan penggunaan gambar contoh telah dinonaktifkan sepenuhnya. Anda harus benar-benar berburu kucing asli menggunakan kamera perangkat!*</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Hammer className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">2. Tempa Menjadi Kartu Nekomon</h4>
                    <p className="leading-relaxed">
                      Buka tab <span className="text-teal-400 font-bold font-mono">ALBUM KOLEKSI</span>, pilih foto kucing hasil tangkapan Anda, lalu klik tombol penempaan untuk membawanya ke <span className="text-teal-400 font-bold font-mono">FORGING STATION</span>. Kartu Nekomon baru akan ditempa secara instan menggunakan AI, lengkap dengan Elemen unik, Gaya Seni (Sentinel/Scourge), statistik acak (HP, ATK, DEF, SPD), serta tingkat kelangkaan (Rarity) dari Common hingga Legendary!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">3. Selesaikan Misi Harian</h4>
                    <p className="leading-relaxed">
                      Setiap hari, ada berbagai tantangan di tab <span className="text-indigo-400 font-bold font-mono">MISI</span>. Kirimkan Nekomon Anda yang memenuhi syarat elemen atau stats tertentu untuk menyelesaikan ekspedisi. Menyelesaikan misi akan melatih kartu Anda (+XP), serta memberikan hadiah berharga seperti <span className="text-teal-400 font-bold font-mono">Nekomon Core</span> dan Poin bonus!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">4. Bertempur di Arena Online</h4>
                    <p className="leading-relaxed">
                      Uji kekuatan Nekomon Anda di tab <span className="text-rose-400 font-bold font-mono">ARENA</span>. Cari lawan secara real-time untuk bertanding melawan Dek milik pemain lain, atau pilih mode latih tanding melawan AI. Kelola giliran Anda untuk meluncurkan serangan elemental yang taktis, kalahkan lawan, dapatkan Poin, dan panjat papan peringkat setinggi-tingginya!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">5. Sistem Barter Kartu</h4>
                    <p className="leading-relaxed">
                      Apakah Anda memiliki banyak kartu Nekomon duplikat? Buka menu <span className="text-amber-500 font-bold font-mono">BARTER</span> untuk mengajukan penukaran kartu secara adil dengan pemain lain yang sedang online. Tukarkan kartu Anda dengan kartu impian yang memiliki tingkat kelangkaan (rarity) setara untuk melengkapi koleksi album Anda!
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
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">1. Hunt & Photo Real Cats</h4>
                    <p className="leading-relaxed">
                      Use the <span className="text-yellow-400 font-bold font-mono">CAMERA</span> feature to take photos of real cats directly in your environment. Every successfully captured cat photo awards you <span className="text-yellow-400 font-bold font-mono">+10 Points</span> and is saved in your Collection Album.
                      <span className="block mt-1 text-slate-400 italic">*Note: For fair play, uploading from gallery and mock placeholders are fully disabled. You must actually hunt real cats using your device camera!*</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Hammer className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">2. Forge into Nekomon Cards</h4>
                    <p className="leading-relaxed">
                      Open the <span className="text-teal-400 font-bold font-mono">CARDS</span> tab, select your captured cat photo, then click forge to bring it to the <span className="text-teal-400 font-bold font-mono">FORGING STATION</span>. A brand new Nekomon Card will be forged instantly using AI, featuring unique Elements, Art Style (Sentinel/Scourge), randomized stats (HP, ATK, DEF, SPD), and rarity from Common to Legendary!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">3. Complete Daily Missions</h4>
                    <p className="leading-relaxed">
                      Every day, various challenges are available on the <span className="text-indigo-400 font-bold font-mono">MISSIONS</span> tab. Dispatch your qualified Nekomon on expeditions. Completing missions gains card level (+XP) and awards valuable items like <span className="text-teal-400 font-bold font-mono">Nekomon Cores</span> and bonus Points!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Swords className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">4. Fight in Online Arena</h4>
                    <p className="leading-relaxed">
                      Test your Nekomon strength on the <span className="text-rose-400 font-bold font-mono">ARENA</span> tab. Search for real-time combat against other players' decks or practice offline against AI bots. Coordinate tactful elemental strikes, defeat opponents, earn Points, and climb the leaderboard!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono text-xs uppercase mb-1">5. Card Trading Floor</h4>
                    <p className="leading-relaxed">
                      Do you have too many duplicate cards? Open the <span className="text-amber-500 font-bold font-mono">TRADING</span> floor to swap duplicate cards fairly with other online players. Trade your cards for your dream Nekomon with equal rarity to complete your album!
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
                {/* Api */}
                <div className="bg-slate-950 p-3 rounded-lg border border-red-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="font-bold text-red-400">{language === "id" ? "API" : "FIRE"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Sangat Kuat Melawan:" : "Extremely Effective Vs:"} <span className="text-emerald-400 font-bold">{language === "id" ? "Tanah" : "Earth"} 🌿</span>
                  </div>
                </div>

                {/* Air */}
                <div className="bg-slate-950 p-3 rounded-lg border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <span className="font-bold text-blue-400">{language === "id" ? "AIR" : "WATER"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Sangat Kuat Melawan:" : "Extremely Effective Vs:"} <span className="text-red-400 font-bold">{language === "id" ? "Api" : "Fire"} 🔥</span>
                  </div>
                </div>

                {/* Tanah */}
                <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌿</span>
                    <span className="font-bold text-emerald-400">{language === "id" ? "TANAH" : "EARTH"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Sangat Kuat Melawan:" : "Extremely Effective Vs:"} <span className="text-yellow-400 font-bold">{language === "id" ? "Petir" : "Lightning"} ⚡</span>
                  </div>
                </div>

                {/* Angin */}
                <div className="bg-slate-950 p-3 rounded-lg border border-teal-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌪️</span>
                    <span className="font-bold text-teal-400">{language === "id" ? "ANGIN" : "WIND"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Sangat Kuat Melawan:" : "Extremely Effective Vs:"} <span className="text-blue-400 font-bold">{language === "id" ? "Air" : "Water"} 💧</span> & <span className="text-emerald-400 font-bold">{language === "id" ? "Tanah" : "Earth"} 🌿</span>
                  </div>
                </div>

                {/* Petir */}
                <div className="bg-slate-950 p-3 rounded-lg border border-yellow-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-bold text-yellow-400">{language === "id" ? "PETIR" : "LIGHTNING"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === "id" ? "Sangat Kuat Melawan:" : "Extremely Effective Vs:"} <span className="text-blue-400 font-bold">{language === "id" ? "Air" : "Water"} 💧</span> & <span className="text-teal-400 font-bold">{language === "id" ? "Angin" : "Wind"} 🌪️</span>
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
        <p className="text-[11px] text-slate-400 font-mono max-w-md mx-auto">
          {language === "id"
            ? "Dibuat dengan dedikasi penuh untuk seluruh komunitas Trainer Nekomon di seluruh dunia. Selamat berburu kucing asli! 🐾"
            : "Developed with pure dedication for the global community of Nekomon Trainers. Happy real-life cat hunting! 🐾"}
        </p>
      </div>
    </div>
  );
};
