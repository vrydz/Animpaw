import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, MessageSquare, Send, Gift, Sparkles, CheckCircle2, ShieldCheck, 
  Clock, AlertCircle, Search, UserPlus, RefreshCw, Trash2, Pin, 
  ChevronRight, Volume2, PlusCircle, X, ExternalLink, Flame, Droplets, 
  Zap, Wind, Mountain, MapPin, Camera, Image as ImageIcon, Share2, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, OfficialMail, DirectMessage, ConversationThread, OfficialMailCategory, Capture } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { audio } from "../lib/audio";
import { formatPlayerActivity } from "../utils/timeAgo";

interface MailboxViewProps {
  user: User;
  token: string;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  initialTab?: "official" | "direct";
  initialPartnerId?: string | null;
  onClearInitialPartner?: () => void;
  captures?: Capture[];
  pendingSharedCapture?: Capture | null;
  onClearPendingSharedCapture?: () => void;
}

export const MailboxView: React.FC<MailboxViewProps> = ({
  user,
  token,
  onUpdateUser,
  initialTab = "official",
  initialPartnerId = null,
  onClearInitialPartner,
  captures = [],
  pendingSharedCapture = null,
  onClearPendingSharedCapture
}) => {
  const { language, t } = useLanguage();

  // Strict check: Only verydiaz@gmail.com or support@nekomon.online can broadcast
  const isDeveloper = !!(
    user &&
    user.email &&
    ["verydiaz@gmail.com", "support@nekomon.online"].includes(user.email.toLowerCase().trim())
  );

  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<"official" | "direct">(initialTab);

  // --- OFFICIAL MAIL STATES ---
  const [officialMails, setOfficialMails] = useState<OfficialMail[]>([]);
  const [loadingOfficial, setLoadingOfficial] = useState<boolean>(true);
  const [selectedMail, setSelectedMail] = useState<OfficialMail | null>(null);
  const [claimingMailId, setClaimingMailId] = useState<string | null>(null);
  const [officialFilter, setOfficialFilter] = useState<"all" | OfficialMailCategory>("all");
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastCategory, setBroadcastCategory] = useState<OfficialMailCategory>("patch_update");
  const [broadcastSummary, setBroadcastSummary] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastPoints, setBroadcastPoints] = useState<number>(0);
  const [broadcastCores, setBroadcastCores] = useState<number>(0);
  const [broadcastPinned, setBroadcastPinned] = useState<boolean>(false);
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- DEVELOPER GIFT STATES (Developer accounts: verydiaz@gmail.com / support@nekomon.online) ---
  const [showDevGiftModal, setShowDevGiftModal] = useState<boolean>(false);
  const [devGiftTab, setDevGiftTab] = useState<"private" | "broadcast">("private");

  // Private Gift Form
  const [devGiftTargetUsername, setDevGiftTargetUsername] = useState<string>("");
  const [devGiftTargetUser, setDevGiftTargetUser] = useState<any | null>(null);
  const [devGiftPoints, setDevGiftPoints] = useState<number>(500);
  const [devGiftCores, setDevGiftCores] = useState<number>(10);
  const [devGiftNote, setDevGiftNote] = useState<string>("");
  const [devGiftSubmitting, setDevGiftSubmitting] = useState<boolean>(false);
  const [devGiftMsg, setDevGiftMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Broadcast Gift Form
  const [devBroadTitle, setDevBroadTitle] = useState<string>("");
  const [devBroadContent, setDevBroadContent] = useState<string>("");
  const [devBroadSummary, setDevBroadSummary] = useState<string>("");
  const [devBroadPoints, setDevBroadPoints] = useState<number>(1000);
  const [devBroadCores, setDevBroadCores] = useState<number>(20);
  const [devBroadCategory, setDevBroadCategory] = useState<OfficialMailCategory>("system_reward");
  const [devBroadDistMode, setDevBroadDistMode] = useState<"instant_all" | "claimable_mail">("instant_all");
  const [devBroadPinned, setDevBroadPinned] = useState<boolean>(true);
  const [devBroadSubmitting, setDevBroadSubmitting] = useState<boolean>(false);
  const [devBroadMsg, setDevBroadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- DIRECT MESSAGES STATES ---
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId);
  const [activePartnerData, setActivePartnerData] = useState<{
    id: string;
    username: string;
    avatar?: string;
    isBot?: boolean;
    isOnline?: boolean;
    lastSeen?: string;
    faction?: string;
  } | null>(null);
  const [threadMessages, setThreadMessages] = useState<DirectMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState<boolean>(false);
  const [messageInput, setMessageInput] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingPlayers, setSearchingPlayers] = useState<boolean>(false);

  // Unread counts
  const [unreadStats, setUnreadStats] = useState<{ official: number; direct: number }>({ official: 0, direct: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch Official Mails
  const fetchOfficialMails = async () => {
    setLoadingOfficial(true);
    try {
      const res = await fetch("/api/mail/official", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfficialMails(data.mails || []);
        const unread = (data.mails || []).filter((m: any) => !m.isRead).length;
        setUnreadStats(prev => ({ ...prev, official: unread }));
      }
    } catch (err) {
      console.error("Failed to load official mails:", err);
    } finally {
      setLoadingOfficial(false);
    }
  };

  // 2. Fetch Conversations
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.threads || []);
        const unread = (data.threads || []).reduce((acc: number, t: any) => acc + (t.unreadCount || 0), 0);
        setUnreadStats(prev => ({ ...prev, direct: unread }));
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // 3. Fetch Message Thread with partner
  const fetchThreadMessages = async (partnerId: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/messages/thread/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages || []);
        if (data.partner) {
          setActivePartnerData(data.partner);
        }
        // Update unread stats & conversations list
        setConversations(prev => prev.map(c => c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c));
        setUnreadStats(prev => {
          const threadUnread = conversations.find(c => c.partnerId === partnerId)?.unreadCount || 0;
          return { ...prev, direct: Math.max(0, prev.direct - threadUnread) };
        });
      }
    } catch (err) {
      console.error("Failed to load thread messages:", err);
    } finally {
      setLoadingThread(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOfficialMails();
    fetchConversations();
  }, [token]);

  // If initialPartnerId provided, switch to direct tab and open thread
  useEffect(() => {
    if (initialPartnerId) {
      setActiveSubTab("direct");
      setActivePartnerId(initialPartnerId);
      fetchThreadMessages(initialPartnerId);
      if (onClearInitialPartner) {
        onClearInitialPartner();
      }
    }
  }, [initialPartnerId]);

  // Scroll on thread messages update
  useEffect(() => {
    if (threadMessages.length > 0) {
      scrollToBottom();
    }
  }, [threadMessages]);

  // Auto-refresh thread every 5 seconds if active
  useEffect(() => {
    if (activeSubTab === "direct" && activePartnerId) {
      const interval = setInterval(() => {
        fetch(`/api/messages/thread/${activePartnerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.messages) {
              setThreadMessages(data.messages);
            }
          })
          .catch(() => {});
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, activePartnerId, token]);

  // Mark Official Mail as Read
  const handleOpenMail = async (mail: OfficialMail) => {
    setSelectedMail(mail);
    try {
      audio.playCardSelectSound();
    } catch (_) {}

    if (!mail.readUserIds?.includes(user.id)) {
      try {
        await fetch(`/api/mail/official/${mail.id}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        setOfficialMails(prev =>
          prev.map(m => (m.id === mail.id ? { ...m, isRead: true, readUserIds: [...(m.readUserIds || []), user.id] } : m))
        );
        setUnreadStats(prev => ({ ...prev, official: Math.max(0, prev.official - 1) }));
      } catch (err) {
        console.error("Failed to mark mail as read:", err);
      }
    }
  };

  // Claim Mail Reward
  const handleClaimReward = async (mailId: string) => {
    setClaimingMailId(mailId);
    try {
      const res = await fetch(`/api/mail/official/${mailId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          audio.playVictorySound();
        } catch (_) {}

        if (data.user) {
          onUpdateUser({ points: data.user.points, cores: data.user.cores });
        }

        // Update local state
        setOfficialMails(prev =>
          prev.map(m => (m.id === mailId ? { ...m, isClaimed: true, claimedUserIds: [...(m.claimedUserIds || []), user.id] } : m))
        );
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail(prev => prev ? { ...prev, isClaimed: true } as any : null);
        }
      } else {
        alert(data.error || "Gagal mengklaim hadiah.");
      }
    } catch (err) {
      console.error("Claim error:", err);
      alert(language === "id" ? "Kesalahan koneksi saat mengklaim hadiah." : "Connection error while claiming reward.");
    } finally {
      setClaimingMailId(null);
    }
  };

  // Direct Message Selected Photo to Share
  const [selectedPhotoToShare, setSelectedPhotoToShare] = useState<Capture | null>(pendingSharedCapture);
  const [showPhotoSelectModal, setShowPhotoSelectModal] = useState<boolean>(false);

  useEffect(() => {
    if (pendingSharedCapture) {
      setSelectedPhotoToShare(pendingSharedCapture);
      setActiveSubTab("direct");
    }
  }, [pendingSharedCapture]);

  // Send Direct Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && !selectedPhotoToShare) || !activePartnerId || sendingMessage) return;

    const content = messageInput.trim() || (language === "id" ? "📸 Berbagi Foto Kucing & Lokasi Geolocation" : "📸 Shared Cat Photo & Geolocation");
    const photoToAttach = selectedPhotoToShare;
    
    setMessageInput("");
    setSelectedPhotoToShare(null);
    if (onClearPendingSharedCapture) onClearPendingSharedCapture();
    setSendingMessage(true);

    try {
      audio.playCardSelectSound();
    } catch (_) {}

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: activePartnerId,
          content,
          sharedPhotoUrl: photoToAttach?.photoUrl,
          sharedSpotName: photoToAttach?.spotName || photoToAttach?.locationName,
          sharedLocation: (photoToAttach?.lat !== undefined && photoToAttach?.lng !== undefined && photoToAttach?.lat !== null && photoToAttach?.lng !== null)
            ? {
                lat: photoToAttach.lat,
                lng: photoToAttach.lng,
                locationName: photoToAttach.locationName || photoToAttach.spotName
              }
            : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh thread
        fetchThreadMessages(activePartnerId);
        fetchConversations();
      } else {
        alert(data.error || "Gagal mengirim pesan.");
      }
    } catch (err) {
      console.error("Send message error:", err);
      alert(language === "id" ? "Gagal mengirim pesan." : "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Search Players
  const handleSearchPlayers = async (query: string) => {
    setPlayerSearchQuery(query);
    setSearchingPlayers(true);
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.players || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchingPlayers(false);
    }
  };

  // Start chat with player from search
  const handleStartChatWithPlayer = (player: any) => {
    setActivePartnerId(player.id);
    setActivePartnerData(player);
    setShowNewChatModal(false);
    fetchThreadMessages(player.id);
    try {
      audio.playCardSelectSound();
    } catch (_) {}
  };

  // Send Broadcast Submission (Developer Only)
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      setBroadcastMsg({
        type: "error",
        text: language === "id"
          ? "Akses ditolak. Hanya akun developer resmi (verydiaz@gmail.com / support@nekomon.online) yang dapat menyiarkan surat."
          : "Access denied. Only official developer accounts (verydiaz@gmail.com / support@nekomon.online) can broadcast mail."
      });
      return;
    }

    setBroadcastSubmitting(true);
    setBroadcastMsg(null);

    try {
      const res = await fetch("/api/mail/official/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: broadcastTitle,
          category: broadcastCategory,
          summary: broadcastSummary,
          content: broadcastContent,
          rewardPoints: Number(broadcastPoints) || 0,
          rewardCores: Number(broadcastCores) || 0,
          pinned: broadcastPinned
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastMsg({
          type: "success",
          text: language === "id"
            ? "Surat resmi berhasil disiarkan ke seluruh pemain!"
            : "Official announcement broadcasted to all players successfully!"
        });
        try {
          audio.playVictorySound();
        } catch (_) {}
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastTitle("");
          setBroadcastSummary("");
          setBroadcastContent("");
          setBroadcastPoints(0);
          setBroadcastCores(0);
          setBroadcastMsg(null);
          fetchOfficialMails();
        }, 1200);
      } else {
        setBroadcastMsg({
          type: "error",
          text: data.error || (language === "id" ? "Gagal menyiarkan surat resmi." : "Failed to broadcast official mail.")
        });
      }
    } catch (err) {
      setBroadcastMsg({
        type: "error",
        text: language === "id" ? "Kesalahan jaringan saat menyiarkan surat." : "Network error while broadcasting mail."
      });
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  // Helper to trigger Quick Gift Modal for a specific trainer
  const openGiftForTrainer = (trainer: { id: string; username: string; avatar?: string; points?: number; cores?: number }) => {
    setDevGiftTargetUser(trainer);
    setDevGiftTargetUsername(trainer.username);
    setDevGiftTab("private");
    setDevGiftMsg(null);
    setShowDevGiftModal(true);
    try {
      audio.playCardSelectSound();
    } catch (_) {}
  };

  // Send Private Gift Submission (Developer Only)
  const handleSendPrivateDevGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      setDevGiftMsg({
        type: "error",
        text: language === "id"
          ? "Akses ditolak. Fitur ini khusus akun Developer (verydiaz@gmail.com / support@nekomon.online)."
          : "Access denied. Feature restricted to Developer accounts."
      });
      return;
    }

    const usernameToSend = devGiftTargetUser ? devGiftTargetUser.username : devGiftTargetUsername.trim();
    if (!usernameToSend) {
      setDevGiftMsg({
        type: "error",
        text: language === "id" ? "Pilih atau masukkan username trainer tujuan." : "Please specify target trainer username."
      });
      return;
    }

    if (devGiftPoints <= 0 && devGiftCores <= 0) {
      setDevGiftMsg({
        type: "error",
        text: language === "id" ? "Tentukan jumlah Poin atau Cores (> 0)." : "Specify Points or Cores (> 0)."
      });
      return;
    }

    setDevGiftSubmitting(true);
    setDevGiftMsg(null);

    try {
      const res = await fetch("/api/developer/gift-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId: devGiftTargetUser ? devGiftTargetUser.id : undefined,
          targetUsername: usernameToSend,
          points: devGiftPoints,
          cores: devGiftCores,
          note: devGiftNote
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevGiftMsg({
          type: "success",
          text: data.message || (language === "id" ? "Hadiah berhasil dikirim!" : "Gift sent successfully!")
        });
        try {
          audio.playVictorySound();
        } catch (_) {}

        // If target was current user, update state
        if (data.recipient && data.recipient.id === user.id) {
          onUpdateUser({ points: data.recipient.points, cores: data.recipient.cores });
        }

        // If active chat is with target, refresh thread
        if (activePartnerId && data.recipient && activePartnerId === data.recipient.id) {
          fetchThreadMessages(data.recipient.id);
        }

        // Refresh conversation list to show new DM
        fetchConversations();

        setTimeout(() => {
          setDevGiftNote("");
        }, 2000);
      } else {
        setDevGiftMsg({
          type: "error",
          text: data.error || (language === "id" ? "Gagal mengirim hadiah." : "Failed to send gift.")
        });
      }
    } catch (err) {
      setDevGiftMsg({
        type: "error",
        text: language === "id" ? "Kesalahan koneksi saat mengirim hadiah." : "Connection error while sending gift."
      });
    } finally {
      setDevGiftSubmitting(false);
    }
  };

  // Send Broadcast Gift Submission (Developer Only)
  const handleSendBroadcastDevGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      setDevBroadMsg({
        type: "error",
        text: language === "id" ? "Akses ditolak. Khusus akun Developer." : "Access denied. Developer only."
      });
      return;
    }

    if (!devBroadTitle.trim() || !devBroadContent.trim()) {
      setDevBroadMsg({
        type: "error",
        text: language === "id" ? "Judul dan isi pengumuman surat wajib diisi." : "Title and content are required."
      });
      return;
    }

    if (devBroadPoints <= 0 && devBroadCores <= 0) {
      setDevBroadMsg({
        type: "error",
        text: language === "id" ? "Tentukan bonus Poin atau Cores (> 0)." : "Specify Points or Cores (> 0)."
      });
      return;
    }

    setDevBroadSubmitting(true);
    setDevBroadMsg(null);

    try {
      const res = await fetch("/api/developer/gift-broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: devBroadTitle,
          content: devBroadContent,
          summary: devBroadSummary,
          rewardPoints: devBroadPoints,
          rewardCores: devBroadCores,
          category: devBroadCategory,
          distributionMode: devBroadDistMode,
          pinned: devBroadPinned
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevBroadMsg({
          type: "success",
          text: data.message || (language === "id" ? "Hadiah broadcast berhasil disiarkan!" : "Broadcast gift sent!")
        });
        try {
          audio.playVictorySound();
        } catch (_) {}

        if (devBroadDistMode === "instant_all") {
          // Add to current user if instant
          onUpdateUser({
            points: (user.points || 0) + Number(devBroadPoints),
            cores: (user.cores || 0) + Number(devBroadCores)
          });
        }

        fetchOfficialMails();
        setTimeout(() => {
          setDevBroadTitle("");
          setDevBroadContent("");
          setDevBroadSummary("");
          setDevBroadMsg(null);
          setShowDevGiftModal(false);
        }, 2000);
      } else {
        setDevBroadMsg({
          type: "error",
          text: data.error || (language === "id" ? "Gagal menyiarkan hadiah." : "Failed to broadcast gift.")
        });
      }
    } catch (err) {
      setDevBroadMsg({
        type: "error",
        text: language === "id" ? "Kesalahan koneksi saat menyiarkan hadiah." : "Connection error while broadcasting gift."
      });
    } finally {
      setDevBroadSubmitting(false);
    }
  };

  // Helper for Category Badges
  const getCategoryBadge = (category: OfficialMailCategory) => {
    switch (category) {
      case "welcome":
        return {
          label: language === "id" ? "Sambutan 🎉" : "Welcome 🎉",
          classes: "bg-emerald-950/70 border-emerald-700/50 text-emerald-300"
        };
      case "patch_update":
        return {
          label: language === "id" ? "Patch Update 🚀" : "Patch Update 🚀",
          classes: "bg-sky-950/70 border-sky-700/50 text-sky-300"
        };
      case "maintenance":
        return {
          label: language === "id" ? "Pemeliharaan ⚙️" : "Maintenance ⚙️",
          classes: "bg-amber-950/70 border-amber-700/50 text-amber-300"
        };
      case "system_reward":
        return {
          label: language === "id" ? "Hadiah Spesial 🎁" : "Special Gift 🎁",
          classes: "bg-purple-950/70 border-purple-700/50 text-purple-300"
        };
      default:
        return {
          label: language === "id" ? "Pengumuman 📢" : "Announcement 📢",
          classes: "bg-slate-900 border-slate-700 text-slate-300"
        };
    }
  };

  // Filtered official mails
  const filteredMails = officialMails.filter(m => {
    if (officialFilter === "all") return true;
    return m.category === officialFilter;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Mail className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide">
                {t("mail.title")}
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                support@nekomon.online
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {t("mail.desc")}
            </p>
          </div>
        </div>

        {/* Action Buttons - Only visible to authorized developers */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {isDeveloper ? (
            <>
              <button
                onClick={() => {
                  try { audio.playCardSelectSound(); } catch (_) {}
                  setDevGiftTab("private");
                  setShowDevGiftModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-500/50 hover:border-purple-400 rounded-xl text-purple-200 text-xs font-black transition-all shadow-md cursor-pointer group"
                title={language === "id" ? "Panel Kirim Hadiah Poin & Cores (Khusus Dev)" : "Developer Gift Panel (Points & Cores)"}
              >
                <Gift className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>{t("mail.dev_gift_btn")}</span>
              </button>

              <button
                onClick={() => {
                  try { audio.playCardSelectSound(); } catch (_) {}
                  setShowBroadcastModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/50 hover:border-amber-400 rounded-xl text-amber-300 text-xs font-black transition-all shadow-md cursor-pointer group"
                title={language === "id" ? "Panel Siaran Pengumuman Developer" : "Developer Broadcast Announcement Panel"}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>{language === "id" ? "Siarkan Pengumuman (Dev)" : "Broadcast Mail (Dev)"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === "id" ? "Kotak Masuk Terverifikasi" : "Verified Inboxes"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between bg-slate-950/80 p-1.5 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveSubTab("official");
              try { audio.playCardSelectSound(); } catch (_) {}
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeSubTab === "official"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{t("mail.tab_official")}</span>
            {unreadStats.official > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === "official" ? "bg-slate-950 text-amber-400" : "bg-red-500 text-white animate-pulse"
              }`}>
                {unreadStats.official}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab("direct");
              try { audio.playCardSelectSound(); } catch (_) {}
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeSubTab === "direct"
                ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-yellow-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t("mail.tab_direct")}</span>
            {unreadStats.direct > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === "direct" ? "bg-slate-950 text-amber-400" : "bg-red-500 text-white animate-pulse"
              }`}>
                {unreadStats.direct}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => {
            if (activeSubTab === "official") fetchOfficialMails();
            else {
              fetchConversations();
              if (activePartnerId) fetchThreadMessages(activePartnerId);
            }
            try { audio.playCardSelectSound(); } catch (_) {}
          }}
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl transition-all cursor-pointer mr-1"
          title="Segarkan data pesan"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICIAL MAIL & SYSTEM NOTICES                                    */}
      {/* ========================================================================= */}
      {activeSubTab === "official" && (
        <motion.div
          key="official-mail-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col gap-5"
        >
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: language === "id" ? "Semua Surat" : "All Mail" },
              { id: "welcome", label: language === "id" ? "🎉 Sambutan" : "🎉 Welcome" },
              { id: "patch_update", label: language === "id" ? "🚀 Patch Update" : "🚀 Patch Updates" },
              { id: "maintenance", label: language === "id" ? "⚙️ Pemeliharaan" : "⚙️ Maintenance" },
              { id: "system_reward", label: language === "id" ? "🎁 Hadiah Kompensasi" : "🎁 Rewards" },
              { id: "announcement", label: language === "id" ? "📢 Pengumuman" : "📢 Announcements" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setOfficialFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  officialFilter === f.id
                    ? "bg-slate-800 text-amber-400 border-amber-500/50 shadow-xs"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Mail List */}
          {loadingOfficial ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-mono">{language === "id" ? "Memuat kotak surat resmi..." : "Loading official mail..."}</span>
            </div>
          ) : filteredMails.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
              <Mail className="w-10 h-10 text-slate-600" />
              <h3 className="font-extrabold text-slate-300 text-sm">{t("mail.empty_official")}</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {language === "id"
                  ? "Semua informasi resmi dan hadiah kompensasi dari support@nekomon.online akan muncul di sini."
                  : "All official notices and reward compensations from support@nekomon.online will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMails.map(mail => {
                const badge = getCategoryBadge(mail.category);
                const hasReward = mail.reward && ((mail.reward.points || 0) > 0 || (mail.reward.cores || 0) > 0);
                const isClaimed = (mail as any).isClaimed || mail.claimedUserIds?.includes(user.id);
                const isRead = (mail as any).isRead || mail.readUserIds?.includes(user.id);

                return (
                  <div
                    key={mail.id}
                    onClick={() => handleOpenMail(mail)}
                    className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                      !isRead
                        ? "bg-gradient-to-b from-slate-900 via-slate-900/90 to-purple-950/20 border-amber-500/50 shadow-lg shadow-amber-500/5"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Top Row: Category + Pinned + Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${badge.classes}`}>
                          {badge.label}
                        </span>
                        {mail.pinned && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                            <Pin className="w-2.5 h-2.5 text-amber-400" />
                            <span>PINNED</span>
                          </span>
                        )}
                        {!isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" title="Surat Baru" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 shrink-0">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(mail.createdAt).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>

                    {/* Mail Title & Summary */}
                    <div className="flex flex-col gap-1.5">
                      <h3 className={`font-extrabold text-sm sm:text-base leading-snug group-hover:text-amber-400 transition-colors ${
                        !isRead ? "text-slate-100 font-black" : "text-slate-300"
                      }`}>
                        {mail.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {mail.summary || mail.content}
                      </p>
                    </div>

                    {/* Sender & Reward Bar */}
                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-none">{mail.sender}</span>
                      </div>

                      {hasReward ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border ${
                            isClaimed
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                          }`}>
                            <Gift className="w-3 h-3" />
                            <span>
                              {mail.reward?.points ? `+${mail.reward.points} PTS` : ""}
                              {mail.reward?.cores ? ` +${mail.reward.cores} CORE` : ""}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-amber-400/80 font-bold group-hover:translate-x-1 transition-transform">
                          <span>{language === "id" ? "BACA DETAIL" : "READ MORE"}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Official Mail Detail Modal */}
          <AnimatePresence>
            {selectedMail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
                >
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase ${getCategoryBadge(selectedMail.category).classes}`}>
                          {getCategoryBadge(selectedMail.category).label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(selectedMail.createdAt).toLocaleString(language === "id" ? "id-ID" : "en-US")}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-100">
                        {selectedMail.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => setSelectedMail(null)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sender Official Seal */}
                  <div className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-200">{selectedMail.sender}</span>
                      <span className="text-[10px] font-mono text-amber-400">Email Resmi: {selectedMail.senderEmail || "support@nekomon.online"}</span>
                    </div>
                  </div>

                  {/* Mail Body Content */}
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40 font-sans">
                    {selectedMail.content}
                  </div>

                  {/* Reward Claim Section */}
                  {selectedMail.reward && ((selectedMail.reward.points || 0) > 0 || (selectedMail.reward.cores || 0) > 0) && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-amber-300">
                            {language === "id" ? "Lampiran Hadiah Resmi" : "Official Reward Attached"}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs font-mono font-black">
                            {selectedMail.reward.points && (
                              <span className="text-yellow-400">+{selectedMail.reward.points} Poin</span>
                            )}
                            {selectedMail.reward.cores && (
                              <span className="text-teal-400">+{selectedMail.reward.cores} Cores</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedMail.claimedUserIds?.includes(user.id) ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl border border-slate-700 select-none">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{t("mail.claimed")}</span>
                        </div>
                      ) : (
                        <button
                          disabled={claimingMailId === selectedMail.id}
                          onClick={() => handleClaimReward(selectedMail.id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                        >
                          {claimingMailId === selectedMail.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{language === "id" ? "MENGKLAIM..." : "CLAIMING..."}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{t("mail.claim_reward")}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedMail(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      {language === "id" ? "Tutup" : "Close"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIRECT MESSAGES (P2P CHAT)                                        */}
      {/* ========================================================================= */}
      {activeSubTab === "direct" && (
        <motion.div
          key="direct-messages-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* Left / Top Panel: Conversation List (4 columns) */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-3xl p-4 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>{language === "id" ? "Kotak Masuk Chat" : "Chat Inbox"}</span>
              </h3>
              <button
                onClick={() => {
                  setShowNewChatModal(true);
                  handleSearchPlayers("");
                  try { audio.playCardSelectSound(); } catch (_) {}
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md hover:brightness-110"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t("mail.new_chat")}</span>
              </button>
            </div>

            {/* Conversation List Items */}
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                <span className="text-xs font-mono">{language === "id" ? "Memuat percakapan..." : "Loading chats..."}</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                <span className="text-xs text-slate-400 leading-relaxed">
                  {t("mail.empty_messages")}
                </span>
                <button
                  onClick={() => {
                    setShowNewChatModal(true);
                    handleSearchPlayers("");
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer mt-1"
                >
                  {language === "id" ? "Cari & Kirim Pesan" : "Search & Message"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                {conversations.map(conv => {
                  const isActive = activePartnerId === conv.partnerId;
                  const activity = formatPlayerActivity(conv.lastSeen, conv.isOnline, language, conv.isBot);
                  return (
                    <div
                      key={conv.partnerId}
                      onClick={() => {
                        setActivePartnerId(conv.partnerId);
                        setActivePartnerData({
                          id: conv.partnerId,
                          username: conv.partnerUsername,
                          avatar: conv.partnerAvatar,
                          isBot: conv.isBot,
                          isOnline: conv.isOnline,
                          lastSeen: conv.lastSeen,
                          faction: conv.faction
                        });
                        fetchThreadMessages(conv.partnerId);
                        try { audio.playCardSelectSound(); } catch (_) {}
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5"
                          : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0 relative">
                          {conv.partnerAvatar || (conv.isBot ? "🤖" : "🐱")}
                          <div 
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${activity.dotClass} ${activity.isOnline ? "animate-pulse" : ""}`}
                            title={activity.statusText}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-200 truncate">
                              @{conv.partnerUsername}
                            </span>
                            {conv.isBot && (
                              <span className="text-[8px] bg-amber-950/60 text-amber-400 border border-amber-800/40 px-1 rounded font-black font-mono">
                                BOT
                              </span>
                            )}
                            {conv.faction && (
                              <span className={`text-[7px] px-1 rounded font-black uppercase ${
                                conv.faction === "Sentinel" ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40" : "bg-red-950 text-red-400 border border-red-800/40"
                              }`}>
                                {conv.faction}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {activity.statusText}
                          </span>
                          <span className="text-[11px] text-slate-300 truncate mt-0.5">
                            {conv.lastMessage}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center animate-pulse">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Active Chat Room (8 columns) */}
          <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-3xl p-5 flex flex-col h-[560px] shadow-xl">
            {activePartnerId ? (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const partnerAct = formatPlayerActivity(activePartnerData?.lastSeen, activePartnerData?.isOnline, language, activePartnerData?.isBot);
                      return (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg relative">
                            {activePartnerData?.avatar || (activePartnerData?.isBot ? "🤖" : "🐱")}
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${partnerAct.dotClass} ${partnerAct.isOnline ? "animate-pulse" : ""}`} />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-sm text-slate-100">
                                @{activePartnerData?.username || "Trainer"}
                              </h4>
                              {activePartnerData?.isBot && (
                                <span className="text-[8px] bg-amber-950/60 text-amber-400 border border-amber-800/40 px-1 rounded font-black font-mono">
                                  AI TRAINER
                                </span>
                              )}
                              {activePartnerData?.faction && (
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                  activePartnerData.faction === "Sentinel" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/40" : "bg-red-950 text-red-300 border border-red-800/40"
                                }`}>
                                  {activePartnerData.faction}
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-mono flex items-center gap-1 ${partnerAct.isOnline ? "text-emerald-400" : "text-slate-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${partnerAct.dotClass} ${partnerAct.isOnline ? "animate-pulse" : ""}`} />
                              <span>{partnerAct.statusText}</span>
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    {isDeveloper && activePartnerData && (
                      <button
                        type="button"
                        onClick={() => openGiftForTrainer(activePartnerData)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-500/50 hover:border-purple-400 rounded-xl text-purple-200 text-xs font-black transition-all shadow-md cursor-pointer"
                        title={language === "id" ? `Kirim Hadiah Developer ke @${activePartnerData.username}` : `Send Developer Gift to @${activePartnerData.username}`}
                      >
                        <Gift className="w-3.5 h-3.5 text-pink-400" />
                        <span className="hidden sm:inline">{t("mail.quick_gift_dm")}</span>
                      </button>
                    )}

                    <button
                      onClick={() => fetchThreadMessages(activePartnerId)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                      title="Segarkan percakapan"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingThread ? "animate-spin text-amber-400" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 pr-1">
                  {loadingThread ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-400 mr-2" />
                      <span>{language === "id" ? "Memuat pesan..." : "Loading messages..."}</span>
                    </div>
                  ) : threadMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-slate-500 p-6">
                      <MessageSquare className="w-8 h-8 text-slate-600" />
                      <span className="text-xs text-slate-400">
                        {language === "id"
                          ? `Belum ada pesan dengan @${activePartnerData?.username}. Sapa dan mulailah berteman!`
                          : `No messages with @${activePartnerData?.username} yet. Say hi and start chatting!`}
                      </span>
                    </div>
                  ) : (
                    threadMessages.map(msg => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                            isMe ? "self-end items-end" : "self-start items-start"
                          }`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed flex flex-col gap-2 ${
                              isMe
                                ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-medium rounded-tr-xs shadow-md shadow-amber-500/10"
                                : "bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-xs shadow-md"
                            }`}
                          >
                            {/* Attached Cat Photo if any */}
                            {msg.sharedPhotoUrl && (
                              <div className="overflow-hidden rounded-xl border border-black/20 shadow-md bg-black max-w-[240px]">
                                <img
                                  src={msg.sharedPhotoUrl}
                                  alt="Shared Cat Capture"
                                  className="w-full h-36 sm:h-44 object-cover"
                                />
                                {(msg.sharedLocation || msg.sharedSpotName) && (
                                  <div className={`p-2 flex flex-col gap-0.5 text-[10px] font-mono ${isMe ? "bg-amber-600 text-slate-950" : "bg-slate-900 text-slate-300"}`}>
                                    <div className="flex items-center gap-1 font-bold">
                                      <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                                      <span className="truncate">
                                        {msg.sharedSpotName || (msg.sharedLocation?.lat ? `Lat: ${msg.sharedLocation.lat.toFixed(4)}, Lng: ${msg.sharedLocation.lng.toFixed(4)}` : "Lokasi Nekomon")}
                                      </span>
                                    </div>
                                    {msg.sharedLocation?.lat && (
                                      <span className="text-[9px] opacity-85">
                                        GPS: {msg.sharedLocation.lat.toFixed(5)}, {msg.sharedLocation.lng.toFixed(5)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Text Content */}
                            {msg.content && (
                              <div>{msg.content}</div>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Cat Emojis & Photo Attach Toolbar */}
                <div className="flex items-center justify-between gap-2 pb-2 select-none border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {["🐾", "🐱", "✨", "🔥", "💧", "⚡", "🏆", "⚔️"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessageInput(prev => prev + emoji)}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Button to attach photo from gallery */}
                  <button
                    type="button"
                    onClick={() => setShowPhotoSelectModal(true)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-mono flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                      selectedPhotoToShare
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700"
                    }`}
                    title={language === "id" ? "Bagikan foto kucing & lokasi" : "Share cat photo & location"}
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] hidden sm:inline">
                      {selectedPhotoToShare ? (language === "id" ? "Foto Terpilih" : "Photo Selected") : (language === "id" ? "Share Foto" : "Share Photo")}
                    </span>
                  </button>
                </div>

                {/* Attached Photo Preview Pill if selected */}
                {selectedPhotoToShare && (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl mt-1 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <img
                        src={selectedPhotoToShare.photoUrl}
                        alt="Preview attach"
                        className="w-8 h-8 rounded-lg object-cover border border-amber-500/50 shrink-0"
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-amber-300 truncate text-[11px]">
                          {selectedPhotoToShare.spotName || (language === "id" ? "Foto Kucing Liar" : "Wild Cat Photo")}
                        </span>
                        {(selectedPhotoToShare.lat !== undefined && selectedPhotoToShare.lng !== undefined) && (
                          <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            GPS: {selectedPhotoToShare.lat.toFixed(4)}, {selectedPhotoToShare.lng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhotoToShare(null);
                        if (onClearPendingSharedCapture) onClearPendingSharedCapture();
                      }}
                      className="p-1 text-slate-400 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder={selectedPhotoToShare ? (language === "id" ? "Tambahkan caption untuk foto kucing..." : "Add a caption for cat photo...") : t("mail.send_placeholder")}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    disabled={(!messageInput.trim() && !selectedPhotoToShare) || sendingMessage}
                    className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    {sendingMessage ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{language === "id" ? "Kirim" : "Send"}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl">
                  📬
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h4 className="font-black text-base text-slate-200">
                    {language === "id" ? "Pilih Percakapan" : "Select a Conversation"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {language === "id"
                      ? "Pilih kontak dari daftar di sebelah kiri atau mulai chat baru dengan Trainer Nekomon lain."
                      : "Choose a contact from the left list or start a new chat with another Nekomon Trainer."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowNewChatModal(true);
                    handleSearchPlayers("");
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:brightness-110"
                >
                  {t("mail.new_chat")}
                </button>
              </div>
            )}
          </div>

          {/* New Chat / Player Search Modal */}
          <AnimatePresence>
            {showNewChatModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>{language === "id" ? "Kirim Pesan ke Trainer" : "Message a Trainer"}</span>
                    </h3>
                    <button
                      onClick={() => setShowNewChatModal(false)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={playerSearchQuery}
                      onChange={e => handleSearchPlayers(e.target.value)}
                      placeholder={language === "id" ? "Cari username trainer..." : "Search trainer username..."}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Search Results */}
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {searchingPlayers ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400 mx-auto mb-1" />
                        <span>{language === "id" ? "Mencari trainer..." : "Searching trainers..."}</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        {language === "id" ? "Tidak ada trainer ditemukan." : "No trainers found."}
                      </div>
                    ) : (
                      searchResults.map(p => {
                        const pAct = formatPlayerActivity(p.lastSeen, p.isOnline, language, p.isBot);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleStartChatWithPlayer(p)}
                            className="p-3 bg-slate-950/60 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm relative">
                                {p.avatar || (p.isBot ? "🤖" : "🐱")}
                                <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${pAct.dotClass} ${pAct.isOnline ? "animate-pulse" : ""}`} />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-xs text-slate-200">@{p.username}</span>
                                  {p.isBot && (
                                    <span className="text-[8px] bg-amber-950 text-amber-400 px-1 rounded font-mono font-bold">
                                      BOT
                                    </span>
                                  )}
                                  {p.faction && (
                                    <span className={`text-[7px] px-1 rounded font-black uppercase ${
                                      p.faction === "Sentinel" ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40" : "bg-red-950 text-red-400 border border-red-800/40"
                                    }`}>
                                      {p.faction}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  {pAct.statusText} • {p.points} Pts
                                </span>
                              </div>
                            </div>

                          <div className="flex items-center gap-2">
                            {isDeveloper && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNewChatModal(false);
                                  openGiftForTrainer(p);
                                }}
                                className="text-xs font-bold text-purple-300 hover:text-purple-100 bg-purple-950/60 hover:bg-purple-900/80 px-2.5 py-1 rounded-xl border border-purple-700/50 transition-all flex items-center gap-1 cursor-pointer"
                                title="Beri Hadiah Developer"
                              >
                                <Gift className="w-3.5 h-3.5 text-pink-400" />
                                <span>Gift</span>
                              </button>
                            )}
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                              Chat 💬
                            </span>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN / DEVELOPER OFFICIAL BROADCAST MODAL                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span>{t("mail.broadcast_title")}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("mail.broadcast_desc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Developer Verified Account Notice */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">{language === "id" ? "Otorisasi Akun Pengembang Terverifikasi:" : "Verified Developer Account Authorized:"}</span>
                  <span className="font-mono text-[11px] text-amber-400 font-bold">{user?.email || "verydiaz@gmail.com"}</span>
                </div>
              </div>

              {broadcastMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${
                  broadcastMsg.type === "success" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700" : "bg-red-950/80 text-red-300 border border-red-700"
                }`}>
                  {broadcastMsg.text}
                </div>
              )}

              <form onSubmit={handleBroadcastSubmit} className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    {t("mail.broadcast_title_field")}
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    placeholder={language === "id" ? "e.g. 🚀 Patch Update v2.6.0: Fitur Baru & Event Spesial" : "e.g. 🚀 Patch Update v2.6.0: New Features & Special Event"}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-100"
                  />
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "patch_update", label: language === "id" ? "🚀 Patch Update" : "🚀 Patch Update" },
                    { id: "maintenance", label: language === "id" ? "⚙️ Pemeliharaan" : "⚙️ Maintenance" },
                    { id: "welcome", label: language === "id" ? "🎉 Sambutan" : "🎉 Welcome" },
                    { id: "system_reward", label: language === "id" ? "🎁 Hadiah" : "🎁 Special Gift" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBroadcastCategory(cat.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        broadcastCategory === cat.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    {t("mail.broadcast_summary_field")}
                  </label>
                  <input
                    type="text"
                    value={broadcastSummary}
                    onChange={e => setBroadcastSummary(e.target.value)}
                    placeholder={language === "id" ? "Ringkasan 1 kalimat yang tampil pada kartu inbox" : "1-sentence summary shown on inbox preview cards"}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-100"
                  />
                </div>

                {/* Full Content */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    {t("mail.broadcast_content_field")}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastContent}
                    onChange={e => setBroadcastContent(e.target.value)}
                    placeholder={language === "id" ? "Tuliskan catatan update, penjelasan maintenance, atau pesan selamat datang secara rinci..." : "Write detailed update notes, maintenance schedule, or welcome message..."}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl p-3 text-xs text-slate-100 leading-relaxed"
                  />
                </div>

                {/* Optional Attached Rewards */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Gift className="w-4 h-4" />
                    <span>{t("mail.broadcast_reward_label")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-mono">{t("mail.broadcast_points_label")}</span>
                      <input
                        type="number"
                        min="0"
                        value={broadcastPoints}
                        onChange={e => setBroadcastPoints(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-yellow-400 font-mono font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-mono">{t("mail.broadcast_cores_label")}</span>
                      <input
                        type="number"
                        min="0"
                        value={broadcastCores}
                        onChange={e => setBroadcastCores(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-teal-400 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Pinned Setting */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={broadcastPinned}
                      onChange={e => setBroadcastPinned(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>{t("mail.broadcast_pin_label")}</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={broadcastSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {broadcastSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t("mail.broadcasting")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t("mail.broadcast_submit")}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DEVELOPER GIFT CENTER MODAL (PRIVATE & BROADCAST GIFTS)                  */}
      {/* Restricted to verydiaz@gmail.com & support@nekomon.online               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDevGiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-purple-500/40 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl shadow-purple-950/50 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <Gift className="w-5 h-5 text-pink-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
                      <span>{t("mail.dev_gift_title")}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                      {t("mail.dev_gift_desc")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDevGiftModal(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Developer Verified Notice */}
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-center justify-between text-xs text-purple-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="font-bold">{language === "id" ? "Otorisasi Akun Pengembang:" : "Authorized Developer Account:"}</span>
                </div>
                <span className="font-mono text-[11px] bg-purple-900/60 text-pink-300 font-bold px-2 py-0.5 rounded-lg border border-purple-700/50">
                  {user?.email || "verydiaz@gmail.com"}
                </span>
              </div>

              {/* Mode Tabs (Private vs Broadcast) */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDevGiftTab("private");
                    setDevGiftMsg(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    devGiftTab === "private"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{t("mail.dev_gift_tab_private")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDevGiftTab("broadcast");
                    setDevBroadMsg(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    devGiftTab === "broadcast"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{t("mail.dev_gift_tab_broadcast")}</span>
                </button>
              </div>

              {/* TAB 1: PRIVATE GIFT FORM */}
              {devGiftTab === "private" && (
                <form onSubmit={handleSendPrivateDevGift} className="flex flex-col gap-4">
                  {devGiftMsg && (
                    <div className={`p-3 rounded-2xl text-xs font-bold ${
                      devGiftMsg.type === "success"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700"
                        : "bg-red-950/80 text-red-300 border border-red-700"
                    }`}>
                      {devGiftMsg.text}
                    </div>
                  )}

                  {/* Target Trainer Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {t("mail.dev_target_user")}
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={devGiftTargetUsername}
                        onChange={e => {
                          setDevGiftTargetUsername(e.target.value);
                          setDevGiftTargetUser(null);
                        }}
                        placeholder={t("mail.dev_target_placeholder")}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    {devGiftTargetUser && (
                      <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{devGiftTargetUser.avatar || "🐱"}</span>
                          <span className="font-bold text-purple-200">@{devGiftTargetUser.username}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDevGiftTargetUser(null);
                            setDevGiftTargetUsername("");
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-400"
                        >
                          Ganti Trainer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gift Rewards Input (Points & Cores) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    {/* Points Input */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t("mail.dev_points_grant")}</span>
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={devGiftPoints}
                        onChange={e => setDevGiftPoints(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 focus:border-yellow-500 focus:outline-none rounded-xl px-3 py-2 text-sm text-yellow-400 font-mono font-bold"
                      />
                      {/* Quick Presets for Points */}
                      <div className="flex flex-wrap gap-1">
                        {[100, 500, 1000, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDevGiftPoints(amt)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-yellow-500/20 text-yellow-400/90 text-[10px] font-mono rounded-lg border border-slate-700 hover:border-yellow-500/50 cursor-pointer"
                          >
                            +{amt >= 1000 ? `${amt / 1000}k` : amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cores Input */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{t("mail.dev_cores_grant")}</span>
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={devGiftCores}
                        onChange={e => setDevGiftCores(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 focus:border-teal-500 focus:outline-none rounded-xl px-3 py-2 text-sm text-teal-400 font-mono font-bold"
                      />
                      {/* Quick Presets for Cores */}
                      <div className="flex flex-wrap gap-1">
                        {[5, 10, 25, 50, 100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDevGiftCores(amt)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-teal-500/20 text-teal-400/90 text-[10px] font-mono rounded-lg border border-slate-700 hover:border-teal-500/50 cursor-pointer"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Note / Reason Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">
                      {t("mail.dev_note_label")}
                    </label>
                    <textarea
                      rows={2}
                      value={devGiftNote}
                      onChange={e => setDevGiftNote(e.target.value)}
                      placeholder={t("mail.dev_note_placeholder")}
                      className="bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none rounded-xl p-3 text-xs text-slate-100 leading-relaxed"
                    />
                  </div>

                  {/* Info Notice */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                    💡 <span className="text-slate-300 font-bold">{language === "id" ? "Catatan Sistem:" : "System Note:"}</span>{" "}
                    {language === "id"
                      ? "Poin dan Cores akan langsung ditambahkan ke saldo akun pemain. Pesan konfirmasi resmi dari Developer akan otomatis masuk ke Kotak Pesan (DM) penerima."
                      : "Points and Cores are directly added to the player's account balance. An official notification will be sent to the recipient's Direct Message inbox."}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={devGiftSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:brightness-110 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
                  >
                    {devGiftSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t("mail.dev_sending")}</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        <span>{t("mail.dev_send_gift_btn")}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: BROADCAST GIFT FORM */}
              {devGiftTab === "broadcast" && (
                <form onSubmit={handleSendBroadcastDevGift} className="flex flex-col gap-4">
                  {devBroadMsg && (
                    <div className={`p-3 rounded-2xl text-xs font-bold ${
                      devBroadMsg.type === "success"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700"
                        : "bg-red-950/80 text-red-300 border border-red-700"
                    }`}>
                      {devBroadMsg.text}
                    </div>
                  )}

                  {/* Distribution Mode Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {t("mail.dev_dist_mode")}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDevBroadDistMode("instant_all")}
                        className={`p-3 rounded-xl border text-xs text-left font-bold transition-all cursor-pointer flex flex-col gap-1 ${
                          devBroadDistMode === "instant_all"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Zap className="w-4 h-4" />
                          <span>{language === "id" ? "⚡ Kredit Instan Semua Akun" : "⚡ Instant Direct Credit"}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {language === "id" ? "Saldo Poin & Cores langsung bertambah ke seluruh trainer saat ini." : "Points & Cores credited immediately to all trainers."}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDevBroadDistMode("claimable_mail")}
                        className={`p-3 rounded-xl border text-xs text-left font-bold transition-all cursor-pointer flex flex-col gap-1 ${
                          devBroadDistMode === "claimable_mail"
                            ? "bg-purple-500/20 border-purple-500 text-purple-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-purple-400">
                          <Mail className="w-4 h-4" />
                          <span>{language === "id" ? "📬 Surat Hadiah (Klaim Inbox)" : "📬 Claimable Mail Gift"}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {language === "id" ? "Pemain harus membuka kotak surat lalu menekan tombol Klaim Hadiah." : "Players open mailbox and tap Claim Reward button."}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">
                      {t("mail.broadcast_title_field")}
                    </label>
                    <input
                      type="text"
                      required
                      value={devBroadTitle}
                      onChange={e => setDevBroadTitle(e.target.value)}
                      placeholder={language === "id" ? "e.g. 🎁 Hadiah Spesial Kompensasi & Bonus Akhir Pekan!" : "e.g. 🎁 Special Weekend Bonus & Appreciation Gift!"}
                      className="bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-100"
                    />
                  </div>

                  {/* Summary */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">
                      {t("mail.broadcast_summary_field")}
                    </label>
                    <input
                      type="text"
                      value={devBroadSummary}
                      onChange={e => setDevBroadSummary(e.target.value)}
                      placeholder={language === "id" ? "Ringkasan 1 kalimat yang tampil di kartu inbox" : "1-sentence summary shown on inbox preview"}
                      className="bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-100"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">
                      {t("mail.broadcast_content_field")}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={devBroadContent}
                      onChange={e => setDevBroadContent(e.target.value)}
                      placeholder={language === "id" ? "Tulis isi pengumuman surat resmi hadiah..." : "Write official broadcast reward announcement notes..."}
                      className="bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl p-3 text-xs text-slate-100 leading-relaxed"
                    />
                  </div>

                  {/* Broadcast Rewards (Points & Cores) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t("mail.broadcast_points_label")}</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={devBroadPoints}
                        onChange={e => setDevBroadPoints(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 focus:border-yellow-500 focus:outline-none rounded-xl px-3 py-2 text-sm text-yellow-400 font-mono font-bold"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[500, 1000, 2500, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDevBroadPoints(amt)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-yellow-500/20 text-yellow-400/90 text-[10px] font-mono rounded-lg border border-slate-700 cursor-pointer"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{t("mail.broadcast_cores_label")}</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={devBroadCores}
                        onChange={e => setDevBroadCores(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 focus:border-teal-500 focus:outline-none rounded-xl px-3 py-2 text-sm text-teal-400 font-mono font-bold"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[10, 20, 50, 100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDevBroadCores(amt)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-teal-500/20 text-teal-400/90 text-[10px] font-mono rounded-lg border border-slate-700 cursor-pointer"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pinned Checkbox */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={devBroadPinned}
                        onChange={e => setDevBroadPinned(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>{t("mail.broadcast_pin_label")}</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={devBroadSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
                  >
                    {devBroadSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t("mail.broadcasting")}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{language === "id" ? "SIARKAN HADIAH KE SELURUH TRAINER 📬" : "BROADCAST GIFT TO ALL TRAINERS 📬"}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Select Cat Photo to Share in Direct Message Modal */}
      <AnimatePresence>
        {showPhotoSelectModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm text-slate-100">
                    {language === "id" ? "Pilih Foto Kucing & Lokasi untuk Dibagikan" : "Select Cat Photo & Location to Share"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPhotoSelectModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                {captures.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                    <Camera className="w-10 h-10 text-slate-600" />
                    <p className="text-xs">
                      {language === "id"
                        ? "Anda belum memiliki foto kucing di Galeri. Tangkap kucing di kamera terlebih dahulu!"
                        : "You haven't captured any cat photos yet. Use the camera to capture cats first!"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {captures.map((cap) => (
                      <div
                        key={cap.id}
                        onClick={() => {
                          setSelectedPhotoToShare(cap);
                          setShowPhotoSelectModal(false);
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-700/80 hover:border-amber-400 cursor-pointer transition-all hover:scale-[1.02] shadow-md bg-black"
                      >
                        <img
                          src={cap.photoUrl}
                          alt="Cat capture"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 p-2 flex flex-col justify-end text-[10px]">
                          <span className="font-bold text-amber-300 truncate">
                            {cap.spotName || (language === "id" ? "Kucing Liar" : "Wild Cat")}
                          </span>
                          {(cap.lat !== undefined && cap.lng !== undefined && cap.lat !== null && cap.lng !== null) && (
                            <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              {cap.locationName || `${cap.lat.toFixed(2)}, ${cap.lng.toFixed(2)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
