import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  FileText, 
  Info, 
  Mail, 
  X, 
  Lock, 
  Eye, 
  HelpCircle,
  Gamepad2,
  Instagram,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Phone,
  MapPin,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { navigateToRoute, LegalTabType } from "../utils/routes";

export type { LegalTabType };

interface LegalPagesModalProps {
  isOpen: boolean;
  initialTab?: LegalTabType;
  onClose: () => void;
}

export const LegalPagesModal: React.FC<LegalPagesModalProps> = ({
  isOpen,
  initialTab = "privacy",
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const { language } = useLanguage();
  const isEn = language === "en";

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  const handleTabChange = (tabId: LegalTabType) => {
    setActiveTab(tabId);
    const routeMap: Record<LegalTabType, string> = {
      privacy: "/privacy-policy",
      terms: "/terms-of-service",
      refund: "/refund-policy",
      about: "/about",
      contact: "/contact",
      disclaimer: "/disclaimer"
    };
    navigateToRoute(routeMap[tabId] || "/privacy-policy");
  };

  const handleClose = () => {
    onClose();
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      navigateToRoute("/");
    }
  };

  if (!isOpen) return null;

  const tabLabels: Record<LegalTabType, { label: string; icon: any }> = {
    privacy: { label: isEn ? "Privacy Policy" : "Kebijakan Privasi", icon: Lock },
    terms: { label: isEn ? "Terms of Service" : "Syarat & Ketentuan", icon: FileText },
    refund: { label: isEn ? "Refund Policy" : "Kebijakan Refund", icon: RotateCcw },
    about: { label: isEn ? "About Nekomon" : "Tentang Nekomon", icon: Info },
    contact: { label: isEn ? "Contact Us" : "Hubungi Kami", icon: Mail },
    disclaimer: { label: isEn ? "Disclaimer & Ads" : "Penafian & AdSense", icon: Eye },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] text-slate-100 font-sans"
        >
          {/* Header */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-100 font-mono tracking-tight flex items-center gap-2">
                  <span>Nekomon Online</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold">
                    {isEn ? "Information & Legal Center" : "Pusat Informasi & Legal"}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {isEn 
                    ? "Privacy Policy, Terms of Service, About & Player Support" 
                    : "Kebijakan Privasi, Syarat Layanan, Profil & Dukungan Bantuan"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation Bar */}
          <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 font-mono">
            {(Object.keys(tabLabels) as LegalTabType[]).map((tabId) => {
              const tab = tabLabels[tabId];
              const Icon = tab.icon;
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => handleTabChange(tabId)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-yellow-500/10 font-extrabold"
                      : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            
            {/* PRIVACY POLICY TAB */}
            {activeTab === "privacy" && (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-500" />
                    {isEn ? "Privacy Policy" : "Kebijakan Privasi (Privacy Policy)"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEn ? "Last updated: August 2026 • Applies to https://nekomon.online" : "Terakhir diperbarui: Agustus 2026 • Berlaku untuk domain https://nekomon.online"}
                  </p>
                </div>

                <p>
                  {isEn ? (
                    <>At <strong className="text-slate-100">Nekomon Online</strong>, the privacy of our visitors and players is one of our top priorities. This Privacy Policy document describes the types of information collected and recorded by Nekomon Online and how we utilize it.</>
                  ) : (
                    <>Di <strong className="text-slate-100">Nekomon Online</strong>, privasi pengunjung dan pengguna kami adalah prioritas utama. Dokumen Kebijakan Privasi ini berisi jenis informasi yang dikumpulkan dan dicatat oleh Nekomon Online serta bagaimana kami menggunakannya.</>
                  )}
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-yellow-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> {isEn ? "1. Google AdSense Advertising & DART Cookie Disclosure" : "1. Pengungkapan Iklan Google AdSense & Cookie DART"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
                    {isEn ? (
                      <>
                        <li>Google is a third-party vendor on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our website and other sites across the internet.</li>
                        <li>
                          Visitors may choose to decline the use of DART cookies by visiting the Google Ad and Content Network Privacy Policy at:{" "}
                          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300 font-mono">
                            https://policies.google.com/technologies/ads
                          </a>
                        </li>
                        <li>Third-party ad servers or networks use technologies like cookies, JavaScript, or Web Beacons in their respective advertisements displayed on Nekomon Online.</li>
                      </>
                    ) : (
                      <>
                        <li>Google adalah salah satu vendor pihak ketiga di situs kami. Google menggunakan cookie (DART cookie) untuk menayangkan iklan kepada pengunjung situs kami berdasarkan kunjungan ke <span className="text-yellow-400 font-mono">https://nekomon.online</span> dan situs lain di internet.</li>
                        <li>
                          Pengunjung dapat memilih untuk menolak penggunaan cookie DART dengan mengunjungi Kebijakan Privasi jaringan iklan Google di:{" "}
                          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300 font-mono">
                            https://policies.google.com/technologies/ads
                          </a>
                        </li>
                        <li>Server iklan pihak ketiga menggunakan teknologi standar seperti cookie, JavaScript, atau Web Beacon untuk mengukur efektivitas kampanye iklan.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "2. Information We Collect" : "2. Informasi Yang Kami Kumpulkan"}
                  </h4>
                  <p>
                    {isEn ? "When you register or play Nekomon Online, we may collect limited information including:" : "Saat Anda mendaftar atau berinteraksi di aplikasi Nekomon Online, kami dapat mengumpulkan data terbatas berupa:"}
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                    {isEn ? (
                      <>
                        <li>Email address and unique username for player account authentication.</li>
                        <li>Cat photos voluntarily uploaded for AI vision detection and digital card forging.</li>
                        <li>In-game telemetry including player level, forged cards, and match score points.</li>
                      </>
                    ) : (
                      <>
                        <li>Alamat email dan nama akun (username) untuk otentikasi akun trainer.</li>
                        <li>Foto kucing yang Anda unggah secara sukarela untuk dianalisis oleh AI dan ditempa menjadi kartu digital.</li>
                        <li>Data telemetry permainan seperti skor poin, level kartu, dan riwayat aktivitas internal.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "3. Data Protection & Security" : "3. Keamanan Data Pengguna"}
                  </h4>
                  <p>
                    {isEn ? "All user credentials and game records are stored using secure encrypted infrastructure. We never sell, rent, or distribute personal information to unauthorized third parties." : "Semua otentikasi dan data pengguna disimpan menggunakan infrastruktur enkripsi aman Firebase Authentication dan Cloud Firestore. Kami tidak pernah menjual, menyewakan, atau membagikan data pribadi pengguna kepada pihak ketiga yang tidak berwenang."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "4. User Rights (GDPR & CCPA Compliance)" : "4. Hak-Hak Pengguna (GDPR & CCPA Compliance)"}
                  </h4>
                  <p>
                    {isEn ? (
                      <>Players have the full right to request account deletion, username modification, or data copy requests at any time by contacting our support team at <span className="text-yellow-400 font-mono">support@nekomon.online</span> or Instagram <a href="https://www.instagram.com/nekomontcg/" target="_blank" rel="noopener noreferrer" className="text-pink-400 font-mono hover:underline">@nekomontcg</a>.</>
                    ) : (
                      <>Pengguna memiliki hak penuh untuk meminta penghapusan akun, pengeditan username, atau permintaan salinan data aktivitas akun kapan saja dengan menghubungi tim kami melalui <span className="text-yellow-400 font-mono">support@nekomon.online</span> atau Instagram <a href="https://www.instagram.com/nekomontcg/" target="_blank" rel="noopener noreferrer" className="text-pink-400 font-mono hover:underline">@nekomontcg</a>.</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TERMS OF SERVICE TAB */}
            {activeTab === "terms" && (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-500" />
                    {isEn ? "Terms of Service" : "Syarat & Ketentuan Layanan (Terms of Service)"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEn ? "Application Usage Rules & Game Community Guidelines" : "Aturan Penggunaan Aplikasi & Komunitas Game Nekomon Online"}
                  </p>
                </div>

                <p>
                  {isEn ? (
                    <>By accessing and playing <strong className="text-slate-100">Nekomon Online</strong>, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using the platform.</>
                  ) : (
                    <>Dengan mengakses dan menggunakan platform <strong className="text-slate-100">Nekomon Online</strong>, Anda setuju untuk terikat oleh Syarat dan Ketentuan berikut. Jika Anda tidak menyetujui salah satu ketentuan ini, Anda dilarang menggunakan platform ini.</>
                  )}
                </p>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "1. Account Responsibility & Fair Play" : "1. Akun dan Keamanan"}
                  </h4>
                  <p>
                    {isEn ? "Users are solely responsible for maintaining the confidentiality of their login credentials. The use of automated bots, scripts, point manipulation exploits, or unfair Arena combat cheating is strictly prohibited and subject to permanent account termination." : "Pengguna bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan kredensial login. Penggunaan bot, script otomatis, manipulasi data poin, atau tindakan kecurangan dalam Arena PvP dilarang keras dan dapat mengakibatkan pemblokiran akun permanen."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "2. Cat Photo Submissions & Content Guidelines" : "2. Unggahan Foto Kucing & Hak Cipta"}
                  </h4>
                  <p>
                    {isEn ? "When submitting images to the Nekomon camera detector, please ensure the photos depict real live cats. Uploading unlawful, violent, sexually explicit, or infringing content is strictly prohibited." : "Saat mengunggah foto ke sistem scanner kamera Nekomon, pastikan foto merupakan gambar kucing asli. Dilarang mengunggah konten yang melanggar hukum, konten bertema kekerasan, pornografi, atau konten yang melanggar hak cipta pihak lain."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "3. Virtual Currency & Digital Collectibles" : "3. Mata Uang Game & Item Digital"}
                  </h4>
                  <p>
                    {isEn ? "In-game Points, Nekomon Cores, Energy, and Anime Cards are purely digital entertainment goods. These virtual items hold no monetary cash value and cannot be redeemed for fiat currency." : "Poin game, Nekomon Cores, Energi, dan Kartu Anime Nekomon adalah item hiburan digital dalam aplikasi. Item ini tidak memiliki nilai mata uang tunai di dunia nyata dan tidak dapat ditukarkan kembali menjadi uang tunai."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "4. Service Adjustments & Game Balance" : "4. Penyesuaian Layanan & Perubahan Aturan"}
                  </h4>
                  <p>
                    {isEn ? "Nekomon Studio reserves the right to balance card stats, adjust game mechanics, or update terms to maintain healthy competitive gameplay for all players." : "Nekomon Studio berhak memperbarui fitur, statistik kartu, atau syarat layanan ini dari waktu ke waktu demi menjaga keseimbangan permainan (game balance) dan kenyamanan seluruh pemain."}
                  </p>
                </div>
              </div>
            )}

            {/* REFUND POLICY TAB */}
            {activeTab === "refund" && (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-yellow-500" />
                    {isEn ? "Cancellation & Refund Policy" : "Kebijakan Pembatalan & Pengembalian Dana (Refund Policy)"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEn ? "Clear & Transparent Refund Standards for Digital Goods & Midtrans Transactions" : "Standar Pengembalian Dana Transparan untuk Produk Digital & Pembayaran Midtrans"}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-yellow-500/30 space-y-3">
                  <h4 className="font-bold text-yellow-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                    {isEn ? "General Principle for Digital Goods" : "Prinsip Umum Produk Digital"}
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {isEn ? (
                      <>All purchases made on Nekomon Online (including In-game Points, Nekomon Cores, Booster Packs, and Energy Potions) are digital in nature and delivered instantly upon payment confirmation. Consequently, digital items that have been delivered and partially or fully consumed are generally non-refundable.</>
                    ) : (
                      <>Semua transaksi pembelian di Nekomon Online (termasuk Poin Game, Nekomon Cores, Booster Pack Kartu, dan Ramuan Energi) merupakan produk digital yang dikirimkan seketika setelah pembayaran terverifikasi. Oleh karena itu, produk digital yang telah diterima dan digunakan/dikonsumsi pada prinsipnya bersifat final dan tidak dapat dibatalkan.</>
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    {isEn ? "1. Eligible Refund Circumstances" : "1. Syarat dan Kondisi Pengembalian Dana yang Berhak (Eligible)"}
                  </h4>
                  <p>
                    {isEn 
                      ? "You may request a full refund or system balance correction under the following specific circumstances:" 
                      : "Pengguna berhak mengajukan permohonan refund penuh atau penyesuaian saldo sistem dalam situasi berikut:"}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pl-2">
                    {isEn ? (
                      <>
                        <li><strong>Duplicate Payment / Double Charge:</strong> Multiple charges deducted from your payment method for a single order ID due to network glitches or gateway lag.</li>
                        <li><strong>Item Non-Delivery:</strong> The payment was successfully captured and settled via Midtrans, but the digital points/cores/packs failed to credit to your player account within 24 hours after contacting support.</li>
                        <li><strong>Technical System Glitch:</strong> A confirmed server-side error occurred during payment processing that prevented normal delivery of purchased assets.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Pembayaran Ganda (Double Billing):</strong> Terjadi pemotongan saldo lebih dari satu kali untuk ID pesanan yang sama akibat gangguan jaringan gateway perbankan.</li>
                        <li><strong>Item Tidak Diterima (Non-Delivery):</strong> Pembayaran telah terpotong dan berstatus <em>Settlement / Success</em> di Midtrans, namun item poin/cores/kartu belum masuk ke akun pemain dalam waktu 1x24 jam setelah melapor ke bantuan.</li>
                        <li><strong>Gangguan Teknis Server:</strong> Terjadi error sistem internal yang menyebabkan kegagalan pencatatan item secara permanen pada database akun.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {isEn ? "2. Non-Refundable Situations" : "2. Kondisi yang Tidak Memenuhi Syarat Refund"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pl-2">
                    {isEn ? (
                      <>
                        <li>Purchased digital points or cores that have already been partially or fully spent on card forging, gacha booster packs, or marketplace trading.</li>
                        <li>Dissatisfaction with randomized gacha card draw results (rarity drop rates are publicly specified in the Game Guide).</li>
                        <li>Account suspension or banning resulting from violations of Terms of Service, cheating, botting, or game exploit abuse.</li>
                        <li>Accidental purchases made due to user error without unauthorized access proof.</li>
                      </>
                    ) : (
                      <>
                        <li>Poin atau Nekomon Cores yang telah digunakan/dibelanjakan untuk penempaan kartu anime, membuka booster gacha, atau jual beli pasar P2P.</li>
                        <li>Ketidakpuasan terhadap hasil gacha kartu acak (probabilitas rarity telah dicantumkan secara transparan di Buku Panduan).</li>
                        <li>Akun yang dibekukan atau diblokir akibat pelanggaran Syarat & Ketentuan (penggunaan bot, kecurangan battle, atau eksploitasi bug).</li>
                        <li>Kekeliruan pembelian yang disebabkan oleh kelalaian pengguna sendiri tanpa bukti adanya akses tidak sah.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "3. How to Submit a Refund Claim" : "3. Prosedur & Tata Cara Pengajuan Refund"}
                  </h4>
                  <p>
                    {isEn ? (
                      <>To request a refund review, please contact our official developer support team within <strong className="text-yellow-400 font-mono">7 days</strong> of the transaction date with the following details:</>
                    ) : (
                      <>Untuk mengajukan klaim pengembalian dana, hubungi tim pengembang resmi kami selambat-lambatnya dalam waktu <strong className="text-yellow-400 font-mono">7 hari kalender</strong> sejak transaksi dilakukan dengan menyertakan:</>
                    )}
                  </p>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
                    <p>• {isEn ? "Player Username & Registered Email" : "Username Pemain & Email Terdaftar"}</p>
                    <p>• {isEn ? "Transaction / Order ID (e.g. NEKO-ORDER-...)" : "ID Transaksi / Order ID (contoh: NEKO-ORDER-...)"}</p>
                    <p>• {isEn ? "Proof of Payment / Bank Transfer Slip" : "Bukti Pembayaran / Mutasi Bank / Struk E-Wallet"}</p>
                    <p>• {isEn ? "Clear description of the issue" : "Deskripsi kendala yang dialami"}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isEn ? (
                      <>Send your claim to: <span className="text-yellow-400 font-mono">support@nekomon.online</span> or <span className="text-yellow-400 font-mono">verydiaz@gmail.com</span>. Valid refund requests will be processed within 3-5 business days back to the original payment source or via bank transfer.</>
                    ) : (
                      <>Kirimkan klaim Anda ke: <span className="text-yellow-400 font-mono">support@nekomon.online</span> atau <span className="text-yellow-400 font-mono">verydiaz@gmail.com</span>. Permintaan refund yang valid akan diproses dalam waktu 3-5 hari kerja melalui pengembalian metode bayar asal atau transfer bank resmi.</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* ABOUT US TAB */}
            {activeTab === "about" && (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Info className="w-4 h-4 text-yellow-500" />
                    {isEn ? "About Nekomon Online" : "Tentang Nekomon Online"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEn ? "Real-world Cat Photo Augmented Reality Trading Card Game" : "Game Kartu Augmented Reality Berbasis Foto Kucing Asli Pertama di Indonesia"}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 via-slate-900 to-amber-500/10 p-4 rounded-xl border border-yellow-500/30 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-400 flex items-center justify-center shrink-0 text-yellow-400">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-100 text-sm font-mono">
                      {isEn ? "Real-World Cat Photo × Anime TCG Innovation" : "Inovasi Foto Kucing Real-World × Anime TCG"}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {isEn 
                        ? "Transform everyday stray or pet cats into legendary anime card heroes powered by Sentinel or Vanguard factions!" 
                        : "Ubah setiap kucing liar atau kucing peliharaan yang Anda temui menjadi pahlawan kartu anime legendaris berdaya bertarung tinggi!"}
                    </p>
                  </div>
                </div>

                <p>
                  {isEn ? (
                    <><strong className="text-slate-100">Nekomon Online</strong> is crafted as a fusion of computer vision AI technology, Augmented Reality (AR), and strategic Trading Card Game (TCG) mechanics.</>
                  ) : (
                    <><strong className="text-slate-100">Nekomon Online</strong> diciptakan sebagai perpaduan unik antara teknologi analisis visi komputer AI, Augmented Reality (AR), dan permainan kartu koleksi TCG (Trading Card Game).</>
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <h5 className="font-bold text-yellow-400 text-xs font-mono mb-1">🐾 {isEn ? "Detection AI Camera" : "Detection AI Camera"}</h5>
                    <p className="text-xs text-slate-400">
                      {isEn 
                        ? "Real-time AR camera with precision HUD telemetry to detect cat life signs and verify photo authenticity." 
                        : "Kamera AR dengan HUD telemetri canggih yang mendeteksi keberadaan kucing dan menguji keaslian foto secara real-time."}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <h5 className="font-bold text-yellow-400 text-xs font-mono mb-1">🔥 {isEn ? "Forging Station" : "Forging Station"}</h5>
                    <p className="text-xs text-slate-400">
                      {isEn 
                        ? "Forge cat photos into anime cards in Sentinel or Vanguard factions with 5 elemental powers (Aqua, Fire, Earth, Wind, Thunder)." 
                        : "Tempa foto kucing menjadi kartu anime eksklusif pilihan Faksi Sentinel atau Vanguard dengan 5 elemen kekuatan (Air, Api, Tanah, Angin, Petir)."}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <h5 className="font-bold text-yellow-400 text-xs font-mono mb-1">⚔️ {isEn ? "Real-time PvP Arena" : "Real-time Arena PvP"}</h5>
                    <p className="text-xs text-slate-400">
                      {isEn 
                        ? "Engage in live multiplayer tactical card battles with competitive global ranking leaderboards." 
                        : "Adu ketangkasan strategi kartu dalam arena pertarungan multiplayer real-time dengan sistem peringkat global."}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <h5 className="font-bold text-yellow-400 text-xs font-mono mb-1">🗺️ {isEn ? "Radar Spot GPS" : "Radar Spot GPS"}</h5>
                    <p className="text-xs text-slate-400">
                      {isEn 
                        ? "Discover nearby wild cat hotspots on the map to collect point boosters and rare forging cores." 
                        : "Temukan titik spot kucing liar di lokasi sekitar Anda untuk mendapatkan booster poin dan item langka."}
                    </p>
                  </div>
                </div>

                {/* Studio & Address Info Box */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="text-yellow-400 font-bold block mb-0.5">
                      {isEn ? "🏢 Developer Studio & Operations" : "🏢 Studio Pengembang & Operasional"}
                    </span>
                    <span className="text-slate-300">
                      Nekomon Studio • Indonesia
                    </span>
                  </div>
                  <div className="text-right sm:text-right w-full sm:w-auto">
                    <span className="text-[10px] text-slate-500 block uppercase">
                      {isEn ? "Official Support" : "Layanan Resmi"}
                    </span>
                    <a href="mailto:support@nekomon.online" className="text-yellow-400 font-bold hover:underline">
                      support@nekomon.online
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACT US TAB */}
            {activeTab === "contact" && (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-yellow-500" />
                    {isEn ? "Contact Us & Player Support" : "Hubungi Kami & Layanan Dukungan"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEn ? "Nekomon Support Team is Ready to Assist You" : "Tim Bantuan Nekomon Siap Membantu Anda 24/7"}
                  </p>
                </div>

                <p>
                  {isEn 
                    ? "Have questions about the game, account assistance, payment queries, or partnership and monetization inquiries? Contact the Nekomon Online developer team via the following official channels:" 
                    : "Punya pertanyaan tentang game, masalah akun, kendala pembayaran shop, atau penawaran kerjasama monetisasi dan iklan? Hubungi tim pengembang Nekomon Online melalui saluran resmi berikut:"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                        {isEn ? "Official Support Email" : "Email Dukungan Resmi"}
                      </span>
                      <a href="mailto:support@nekomon.online" className="font-bold text-yellow-400 hover:underline font-mono text-xs sm:text-sm block">
                        support@nekomon.online
                      </a>
                      <span className="text-[10px] text-slate-400 font-mono">24/7 Player Helpdesk</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                        Official Instagram
                      </span>
                      <a 
                        href="https://www.instagram.com/nekomontcg/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-bold text-pink-400 hover:underline font-mono text-xs sm:text-sm flex items-center gap-1"
                      >
                        <span>@nekomontcg</span>
                      </a>
                      <span className="text-[10px] text-slate-400 font-mono">https://www.instagram.com/nekomontcg/</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-slate-200 font-mono flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-yellow-500" />
                    {isEn ? "Official Communication Channels:" : "Saluran Komunikasi Resmi:"}
                  </h4>
                  <div className="text-xs text-slate-300 font-mono space-y-1">
                    <p>
                      <strong className="text-yellow-400">{isEn ? "Official Email:" : "Email Resmi:"}</strong>{" "}
                      <a href="mailto:support@nekomon.online" className="hover:underline text-slate-200">support@nekomon.online</a>
                    </p>
                    <p>
                      <strong className="text-pink-400">Instagram:</strong>{" "}
                      <a href="https://www.instagram.com/nekomontcg/" target="_blank" rel="noopener noreferrer" className="hover:underline text-slate-200">
                        https://www.instagram.com/nekomontcg/ (@nekomontcg)
                      </a>
                    </p>
                    <p className="text-slate-400">
                      {isEn 
                        ? "Support Hours: Monday - Friday, 08:00 - 18:00 WIB (UTC+7). Average response time: 1-24 hours." 
                        : "Jam Layanan: Senin - Jumat, 08:00 - 18:00 WIB. Waktu respon rata-rata: 1-24 jam."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DISCLAIMER & ADSENSE TAB */}
            {activeTab === "disclaimer" && (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-yellow-500" />
                    {isEn ? "Copyright Disclaimer & Advertising Policy" : "Penafian Hak Cipta & Kebijakan Iklan (Disclaimer)"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEn ? "AdSense Advertising Monetization Transparency Disclosure" : "Pengungkapan Transparansi Monetisasi Iklan AdSense"}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-yellow-400 text-xs font-mono uppercase tracking-wider">
                    {isEn ? "AdSense Advertising Transparency" : "Transparansi Layanan Iklan AdSense"}
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {isEn ? (
                      <>This website displays advertisements served by Google AdSense to help fund server operations, AI vision processing systems, and continuous feature development freely for all players.</>
                    ) : (
                      <>Situs web ini menampilkan iklan yang disajikan oleh Google AdSense untuk membantu membiayai operasional server, pemeliharaan sistem AI, dan pengembangan fitur game secara gratis kepada pengguna.</>
                    )}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {isEn ? (
                      <>All ads adhere to Google AdSense Program Policies and Community Guidelines, placed in distinct areas without disrupting gameplay or primary interactive controls.</>
                    ) : (
                      <>Iklan yang ditayangkan mematuhi Pedoman Komunitas dan Kebijakan Program Google AdSense. Kami memastikan bahwa iklan diletakkan di tempat yang jelas dan tidak mengganggu gameplay atau tombol interaktif utama permainan.</>
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "Trademark & Original Artwork Disclaimer" : "Penafian Merek Dagang & Karya Seni"}
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {isEn ? (
                      <>All anime artwork, character names, and lore elements in Nekomon Online are original creations produced for digital entertainment purposes and are not affiliated with other commercial TCG franchises.</>
                    ) : (
                      <>Seluruh ilustrasi anime, nama karakter, dan elemen dalam game Nekomon Online adalah karya asli yang diproduksi untuk tujuan hiburan. Karakter Nekomon tidak terafiliasi secara langsung dengan waralaba TCG lainnya.</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Close Action */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
            <span className="text-slate-500">© 2026 Nekomon Online. All rights reserved.</span>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer"
            >
              {isEn ? "Close Modal" : "Tutup Modal"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
