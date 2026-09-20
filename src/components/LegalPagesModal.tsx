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
                    {isEn ? "Last updated: September 2026 • Applies to https://nekomon.online" : "Terakhir diperbarui: September 2026 • Berlaku untuk domain https://nekomon.online"}
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
                    <ShieldCheck className="w-4 h-4" /> {isEn ? "1. Advertising, Cookies & Consent" : "1. Iklan, Cookie & Persetujuan"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
                    {isEn ? (
                      <>
                        <li>Third-party vendors, including Google, may use advertising cookies to serve and measure ads based on visits to this site and other sites.</li>
                        <li>Ad requests stay disabled until our production advertising configuration and consent-management requirements are ready. In regions where consent is required, a Google-certified consent management platform must collect the applicable choice before ad requests are made.</li>
                        <li>
                          Users can review how Google uses data and manage personalized advertising at:{" "}
                          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300 font-mono">
                            Google Partner Sites
                          </a>
                          {" / "}
                          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300 font-mono">Ads Settings</a>.
                        </li>
                      </>
                    ) : (
                      <>
                        <li>Vendor pihak ketiga, termasuk Google, dapat menggunakan cookie iklan untuk menayangkan dan mengukur iklan berdasarkan kunjungan ke situs ini dan situs lain.</li>
                        <li>Permintaan iklan dinonaktifkan sampai konfigurasi iklan produksi dan persyaratan pengelolaan persetujuan siap. Di wilayah yang mewajibkan persetujuan, CMP tersertifikasi Google harus merekam pilihan yang berlaku sebelum permintaan iklan dilakukan.</li>
                        <li>
                          Pengguna dapat mempelajari penggunaan data oleh Google dan mengatur iklan yang dipersonalisasi di:{" "}
                          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300 font-mono">
                            Google Partner Sites
                          </a>
                          {" / "}
                          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300 font-mono">Ads Settings</a>.
                        </li>
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
                        <li>Optional device location used for nearby community spots and raids, only after browser permission.</li>
                        <li>In-game telemetry including player level, forged cards, and match score points.</li>
                        <li>A timestamp recording confirmation that a newly registered player meets the minimum age requirement; date of birth is not collected.</li>
                      </>
                    ) : (
                      <>
                        <li>Alamat email dan nama akun (username) untuk otentikasi akun trainer.</li>
                        <li>Foto kucing yang Anda unggah secara sukarela untuk dianalisis oleh AI dan ditempa menjadi kartu digital.</li>
                        <li>Lokasi perangkat yang bersifat opsional untuk spot komunitas dan raid terdekat, hanya setelah izin browser diberikan.</li>
                        <li>Data telemetry permainan seperti skor poin, level kartu, dan riwayat aktivitas internal.</li>
                        <li>Waktu konfirmasi bahwa pemain baru memenuhi usia minimum; tanggal lahir tidak dikumpulkan.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "3. Data Protection & Security" : "3. Keamanan Data Pengguna"}
                  </h4>
                  <p>
                    {isEn ? "Passwords are stored as one-way hashes. Game records are stored on the application server and may be synchronized to configured Google Cloud Firestore infrastructure. Google Firebase supports Google sign-in. We do not sell or rent personal information." : "Kata sandi disimpan sebagai hash satu arah. Data game disimpan pada server aplikasi dan dapat disinkronkan ke infrastruktur Google Cloud Firestore yang dikonfigurasi. Google Firebase mendukung login Google. Kami tidak menjual atau menyewakan data pribadi."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "4. Data Retention & Service Providers" : "4. Retensi Data & Penyedia Layanan"}
                  </h4>
                  <p>
                    {isEn ? "Account and gameplay data are retained while an account is active and as reasonably needed for security, dispute handling, and legal obligations. Verification and reset tokens expire automatically. We use service providers for hosting, email delivery, authentication, cloud storage, AI processing, and—when enabled—advertising." : "Data akun dan gameplay disimpan selama akun aktif dan sepanjang diperlukan secara wajar untuk keamanan, penanganan sengketa, serta kewajiban hukum. Token verifikasi dan reset kedaluwarsa otomatis. Kami menggunakan penyedia layanan untuk hosting, pengiriman email, autentikasi, penyimpanan cloud, pemrosesan AI, dan—jika diaktifkan—periklanan."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "5. Children & Minimum Age" : "5. Anak dan Usia Minimum"}
                  </h4>
                  <p>
                    {isEn ? "Nekomon Online is intended for users aged 13 and older and is not directed to children under 13. New registrations require an age confirmation. If we learn that a child under 13 submitted personal data, a parent or guardian may contact support to request deletion." : "Nekomon Online ditujukan bagi pengguna berusia 13 tahun ke atas dan tidak ditujukan untuk anak di bawah 13 tahun. Pendaftaran baru mewajibkan konfirmasi usia. Jika kami mengetahui anak di bawah 13 tahun telah menyerahkan data pribadi, orang tua atau wali dapat menghubungi dukungan untuk meminta penghapusan."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "6. User Rights & Contact" : "6. Hak Pengguna & Kontak"}
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
                    {isEn ? "Minimum Age" : "Usia Minimum"}
                  </h4>
                  <p>
                    {isEn ? "You must be at least 13 years old to create an account. Nekomon Online is not directed to children under 13. A parent or guardian who believes a child has registered may contact support to request account and data deletion." : "Anda harus berusia minimal 13 tahun untuk membuat akun. Nekomon Online tidak ditujukan bagi anak di bawah 13 tahun. Orang tua atau wali yang meyakini seorang anak telah mendaftar dapat menghubungi dukungan untuk meminta penghapusan akun dan data."}
                  </p>
                </div>

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
                    {isEn ? "Real-money purchases are currently unavailable" : "Pembelian dengan uang nyata saat ini tidak tersedia"}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-yellow-500/30 space-y-3">
                  <h4 className="font-bold text-yellow-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                    {isEn ? "General Principle for Digital Goods" : "Prinsip Umum Produk Digital"}
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {isEn ? (
                      <>Nekomon Online currently does not offer real-money purchases. Items available in the Shop are obtained with in-game currency or gameplay rewards, so no payment-gateway refund process applies.</>
                    ) : (
                      <>Nekomon Online saat ini tidak menyediakan pembelian dengan uang nyata. Item Shop diperoleh menggunakan mata uang dalam game atau hadiah gameplay, sehingga proses refund payment gateway tidak berlaku.</>
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    {isEn ? "1. Eligible In-game Balance Corrections" : "1. Koreksi Saldo Dalam Game"}
                  </h4>
                  <p>
                    {isEn 
                      ? "Because no real-money payment is accepted, support requests are limited to in-game balance corrections in these circumstances:"
                      : "Karena tidak ada pembayaran uang nyata, permintaan dukungan terbatas pada koreksi saldo dalam game untuk situasi berikut:"}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pl-2">
                    {isEn ? (
                      <>
                        <li><strong>Incorrect In-game Deduction:</strong> In-game currency was deducted more than once for a single action.</li>
                        <li><strong>Item Delivery:</strong> Report missing gameplay rewards or incorrectly deducted in-game currency to support.</li>
                        <li><strong>Technical System Glitch:</strong> A confirmed server-side error prevented normal delivery of an earned reward.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Pemotongan Mata Uang Game:</strong> Mata uang dalam game terpotong lebih dari satu kali untuk satu tindakan.</li>
                        <li><strong>Item Tidak Diterima:</strong> Laporkan hadiah gameplay yang tidak masuk atau mata uang dalam game yang terpotong keliru kepada tim bantuan.</li>
                        <li><strong>Gangguan Teknis Server:</strong> Terjadi error sistem yang menyebabkan hadiah gameplay tidak tercatat pada akun.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {isEn ? "2. Corrections Not Available" : "2. Kondisi yang Tidak Dapat Dikoreksi"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pl-2">
                    {isEn ? (
                      <>
                        <li>Points, cores, or energy legitimately spent on forging, energy refills, or card trading actions.</li>
                        <li>Dissatisfaction with a valid randomized gameplay result.</li>
                        <li>Account suspension or banning resulting from violations of Terms of Service, cheating, botting, or game exploit abuse.</li>
                        <li>Player actions performed intentionally or accidentally when no server error occurred.</li>
                      </>
                    ) : (
                      <>
                        <li>Poin, core, atau energi yang digunakan secara sah untuk forging, isi ulang energi, atau pertukaran kartu.</li>
                        <li>Ketidakpuasan terhadap hasil gameplay acak yang tercatat valid.</li>
                        <li>Akun yang dibekukan atau diblokir akibat pelanggaran Syarat & Ketentuan (penggunaan bot, kecurangan battle, atau eksploitasi bug).</li>
                        <li>Tindakan pemain yang dilakukan sengaja maupun tidak sengaja ketika tidak terjadi kesalahan server.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-100 text-xs uppercase font-mono tracking-wider">
                    {isEn ? "3. How to Request a Balance Review" : "3. Cara Meminta Pemeriksaan Saldo"}
                  </h4>
                  <p>
                    {isEn ? (
                      <>To request an in-game balance review, contact support within <strong className="text-yellow-400 font-mono">7 days</strong> of the affected gameplay action with these details:</>
                    ) : (
                      <>Untuk meminta pemeriksaan saldo dalam game, hubungi tim dukungan selambat-lambatnya <strong className="text-yellow-400 font-mono">7 hari kalender</strong> sejak aktivitas terkait dengan menyertakan:</>
                    )}
                  </p>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
                    <p>• {isEn ? "Player Username & Registered Email" : "Username Pemain & Email Terdaftar"}</p>
                    <p>• {isEn ? "Approximate action date and relevant card or feature" : "Perkiraan waktu aktivitas serta kartu atau fitur terkait"}</p>
                    <p>• {isEn ? "Screenshot or battle/transaction history, if available" : "Tangkapan layar atau riwayat battle/transaksi jika tersedia"}</p>
                    <p>• {isEn ? "Clear description of the issue" : "Deskripsi kendala yang dialami"}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isEn ? (
                      <>Send the request to <span className="text-yellow-400 font-mono">support@nekomon.online</span>. Confirmed server errors will be corrected in the in-game balance; no bank or payment-source refund applies.</>
                    ) : (
                      <>Kirimkan permintaan ke <span className="text-yellow-400 font-mono">support@nekomon.online</span>. Kesalahan server yang terkonfirmasi akan dikoreksi pada saldo dalam game; tidak ada pengembalian ke bank atau metode pembayaran.</>
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
                      <>This website may display Google AdSense banners on suitable publisher-content pages. Ad serving remains disabled until production approval and consent-management requirements are configured.</>
                    ) : (
                      <>Situs web ini dapat menampilkan banner Google AdSense pada halaman konten yang sesuai. Penayangan iklan tetap dinonaktifkan sampai persetujuan produksi dan persyaratan pengelolaan consent dikonfigurasi.</>
                    )}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {isEn ? (
                      <>Ads are not placed on active gameplay, navigation, alert, login, or error screens. Players must never click an ad to continue or receive an in-game benefit.</>
                    ) : (
                      <>Iklan tidak ditempatkan pada layar gameplay aktif, navigasi, peringatan, login, atau error. Pemain tidak pernah diwajibkan mengeklik iklan untuk melanjutkan atau memperoleh keuntungan dalam game.</>
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
