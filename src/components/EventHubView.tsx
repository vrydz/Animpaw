import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Tag, 
  Gift, 
  Plus, 
  Edit3, 
  Trash2, 
  HeartHandshake, 
  Store, 
  Stethoscope, 
  ShoppingBag, 
  Compass, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Eye, 
  ShieldCheck,
  Award,
  ChevronRight,
  Flame
} from "lucide-react";
import { SponsorshipEvent, SponsorEventType, User } from "../types";

interface EventHubViewProps {
  user: User | null;
  language: "id" | "en";
  onOpenMapLocation?: (lat: number, lng: number, name: string) => void;
}

const DEVELOPER_EMAILS = [
  "verydiaz@gmail.com",
  "nekomaster@nekomon.online",
  "support@nekomon.online"
];

export const EventHubView: React.FC<EventHubViewProps> = ({
  user,
  language,
  onOpenMapLocation
}) => {
  const [events, setEvents] = useState<SponsorshipEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<SponsorshipEvent | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | SponsorEventType>("all");

  // Developer Admin Modals & Form States
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [type, setType] = useState<SponsorEventType>("pet_shop");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [rewardPoints, setRewardPoints] = useState<number>(50);
  const [rewardCores, setRewardCores] = useState<number>(1);
  const [hasPhysicalLocation, setHasPhysicalLocation] = useState<boolean>(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [radiusMeters, setRadiusMeters] = useState<number>(250);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [socialQuestGoal, setSocialQuestGoal] = useState("");
  const [socialQuestGoalEn, setSocialQuestGoalEn] = useState("");
  const [socialImpactDescription, setSocialImpactDescription] = useState("");
  const [socialImpactDescriptionEn, setSocialImpactDescriptionEn] = useState("");

  const userEmailClean = user?.email?.toLowerCase().trim() || "";
  const isDeveloper = !!(
    user &&
    (user.role === "developer" || DEVELOPER_EMAILS.includes(userEmailClean))
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch sponsor events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setEditingEventId(null);
    setTitle("");
    setTitleEn("");
    setSponsorName("");
    setType("pet_shop");
    setBannerUrl("");
    setLogoUrl("");
    setTagline("");
    setTaglineEn("");
    setDescription("");
    setDescriptionEn("");
    setPromoCode("");
    setPromoDiscount("");
    setTargetLink("");
    setRewardPoints(50);
    setRewardCores(1);
    setHasPhysicalLocation(false);
    setLocationName("");
    setLatitude("");
    setLongitude("");
    setRadiusMeters(250);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setSocialQuestGoal("");
    setSocialQuestGoalEn("");
    setSocialImpactDescription("");
    setSocialImpactDescriptionEn("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowAdminModal(true);
  };

  const handleOpenEdit = (ev: SponsorshipEvent) => {
    setEditingEventId(ev.id);
    setTitle(ev.title || "");
    setTitleEn(ev.titleEn || "");
    setSponsorName(ev.sponsorName || "");
    setType(ev.type || "pet_shop");
    setBannerUrl(ev.bannerUrl || "");
    setLogoUrl(ev.logoUrl || "");
    setTagline(ev.tagline || "");
    setTaglineEn(ev.taglineEn || "");
    setDescription(ev.description || "");
    setDescriptionEn(ev.descriptionEn || "");
    setPromoCode(ev.promoCode || "");
    setPromoDiscount(ev.promoDiscount || "");
    setTargetLink(ev.targetLink || "");
    setRewardPoints(ev.rewardPoints ?? 50);
    setRewardCores(ev.rewardCores ?? 1);
    setHasPhysicalLocation(!!ev.hasPhysicalLocation);
    setLocationName(ev.locationName || "");
    setLatitude(ev.latitude !== undefined ? String(ev.latitude) : "");
    setLongitude(ev.longitude !== undefined ? String(ev.longitude) : "");
    setRadiusMeters(ev.radiusMeters || 250);
    setStartDate(ev.startDate ? ev.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setEndDate(ev.endDate ? ev.endDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setSocialQuestGoal(ev.socialQuestGoal || "");
    setSocialQuestGoalEn(ev.socialQuestGoalEn || "");
    setSocialImpactDescription(ev.socialImpactDescription || "");
    setSocialImpactDescriptionEn(ev.socialImpactDescriptionEn || "");
    setShowAdminModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sponsorName || !bannerUrl || !targetLink) {
      setActionNotice({
        type: "error",
        text: language === "id" 
          ? "Harap isi Judul, Nama Sponsor, Banner URL, dan Link Tautan!" 
          : "Please complete Title, Sponsor Name, Banner URL, and Target Link!"
      });
      return;
    }

    try {
      setFormSubmitting(true);
      const token = btoa(`${user?.id}:${user?.username}`);
      const payload = {
        title,
        titleEn,
        sponsorName,
        type,
        bannerUrl,
        logoUrl,
        tagline,
        taglineEn,
        description,
        descriptionEn,
        promoCode,
        promoDiscount,
        targetLink,
        rewardPoints: Number(rewardPoints) || 0,
        rewardCores: Number(rewardCores) || 0,
        hasPhysicalLocation,
        locationName,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        radiusMeters: Number(radiusMeters) || 250,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + "T23:59:59").toISOString(),
        socialQuestGoal,
        socialQuestGoalEn,
        socialImpactDescription,
        socialImpactDescriptionEn
      };

      const url = editingEventId 
        ? `/api/developer/events/${editingEventId}` 
        : "/api/developer/events";
      const method = editingEventId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan event sponsor.");

      setActionNotice({
        type: "success",
        text: language === "id" ? "Event Sponsor berhasil disimpan!" : "Sponsor Event successfully saved!"
      });
      setShowAdminModal(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || "Terjadi kesalahan sistem saat menyimpan event."
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(language === "id" ? `Hapus event sponsor "${name}"?` : `Delete sponsor event "${name}"?`)) return;

    try {
      const token = btoa(`${user?.id}:${user?.username}`);
      const res = await fetch(`/api/developer/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setActionNotice({
          type: "success",
          text: language === "id" ? "Event berhasil dihapus." : "Event successfully deleted."
        });
        if (selectedEvent?.id === id) setSelectedEvent(null);
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const getEventIcon = (eventType: SponsorEventType) => {
    switch (eventType) {
      case "pet_shop":
        return <Store className="w-4 h-4 text-emerald-400" />;
      case "vet_clinic":
        return <Stethoscope className="w-4 h-4 text-cyan-400" />;
      case "pet_food_brand":
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case "shelter_rescue":
        return <HeartHandshake className="w-4 h-4 text-rose-400" />;
      default:
        return <Flame className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getEventBadge = (eventType: SponsorEventType) => {
    switch (eventType) {
      case "pet_shop":
        return { label: language === "id" ? "Pet Shop Mitra" : "Partner Pet Shop", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" };
      case "vet_clinic":
        return { label: language === "id" ? "Klinik Hewan Resmi" : "Official Vet Clinic", color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" };
      case "pet_food_brand":
        return { label: language === "id" ? "Merek Pakan Kucing" : "Pet Food Brand", color: "bg-amber-500/10 border-amber-500/30 text-amber-400" };
      case "shelter_rescue":
        return { label: language === "id" ? "Donasi Shelter Nyata" : "Real Shelter Drive", color: "bg-rose-500/10 border-rose-500/30 text-rose-400" };
      default:
        return { label: language === "id" ? "Event Komunitas" : "Community Event", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" };
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (activeFilter === "all") return true;
    return ev.type === activeFilter;
  });

  return (
    <div className="w-full flex flex-col gap-6 p-3 sm:p-6 max-w-7xl mx-auto pb-24 text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === "id" ? "SPONSORSHIP & SOCIAL QUESTS" : "SPONSORSHIP & SOCIAL QUESTS"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              {language === "id" ? "Event & Mitra Peduli Kucing" : "Events & Cat Care Partners"}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              {language === "id"
                ? "Dukung Pet Shop, Dokter Hewan, Merek Pakan Lokal, dan Program Donasi Pakan Shelter Kucing di sekitarmu! Dapatkan diskon belanja fisik serta bonus Poin & Cores eksklusif."
                : "Support local Pet Shops, Vet Clinics, Pet Food Brands, and Shelter Rescue Food Drives! Unlock in-store physical discounts and exclusive in-game Point & Core bonuses."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isDeveloper && (
              <button
                onClick={handleOpenCreate}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === "id" ? "+ Buat Event Sponsor" : "+ Create Sponsor Event"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Developer Badge Notice */}
        {isDeveloper && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 text-xs font-mono text-amber-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {language === "id"
                  ? `Mode Developer Aktif (${userEmailClean}). Anda memiliki akses penuh untuk input banner, logo, diskon, dan link sponsor tanpa edit kode.`
                  : `Developer Mode Active (${userEmailClean}). You have full access to manage banners, logos, discounts, and links without code modification.`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm transition-all ${
            actionNotice.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs opacity-70 hover:opacity-100 font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", labelId: "Semua Event", labelEn: "All Events" },
          { id: "pet_shop", labelId: "Pet Shop Mitra", labelEn: "Pet Shops" },
          { id: "vet_clinic", labelId: "Klinik Hewan (Vet)", labelEn: "Vet Clinics" },
          { id: "pet_food_brand", labelId: "Merek Pakan", labelEn: "Food Brands" },
          { id: "shelter_rescue", labelId: "Donasi Shelter", labelEn: "Shelter Drives" }
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {tab.id !== "all" && getEventIcon(tab.id as SponsorEventType)}
              <span>{language === "id" ? tab.labelId : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm">{language === "id" ? "Memuat data event & sponsor..." : "Loading sponsor events..."}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl text-center flex flex-col items-center justify-center gap-4">
          <Store className="w-16 h-16 text-slate-600" />
          <h3 className="text-xl font-bold text-slate-300">
            {language === "id" ? "Belum Ada Event Aktif" : "No Active Events Yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            {language === "id"
              ? "Nantikan event kolaborasi menarik dengan toko pakan, klinik hewan, dan shelter kucing lokal segera!"
              : "Stay tuned for exciting collaboration events with local pet stores, vet clinics, and cat shelters!"}
          </p>
          {isDeveloper && (
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              + Tambah Event Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const badge = getEventBadge(ev.type);
            const isExpired = new Date(ev.endDate).getTime() < Date.now();
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(ev.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={ev.id}
                className="group bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-500/5"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={ev.bannerUrl}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Badge on Top Left */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${badge.color}`}>
                        {badge.label}
                      </span>
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/80 text-white font-mono text-[10px] font-bold">
                          {language === "id" ? "Berakhir" : "Expired"}
                        </span>
                      )}
                    </div>

                    {/* Logo on Top Right if present */}
                    {ev.logoUrl && (
                      <div className="absolute top-3 right-3 p-1 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-md">
                        <img
                          src={ev.logoUrl}
                          alt={ev.sponsorName}
                          className="w-8 h-8 rounded-xl object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Countdown Pill on Bottom */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>
                        {isExpired
                          ? language === "id" ? "Periode Telah Usai" : "Event Ended"
                          : language === "id" ? `${daysLeft} Hari Tersisa` : `${daysLeft} Days Left`}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        {ev.sponsorName}
                      </span>
                      {ev.promoDiscount && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-black">
                          {ev.promoDiscount}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {language === "en" && ev.titleEn ? ev.titleEn : ev.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {language === "en" && ev.descriptionEn ? ev.descriptionEn : ev.description}
                    </p>

                    {/* Social Quest Impact if available */}
                    {ev.socialQuestGoal && (
                      <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>{language === "id" ? "Dampak Nyata Shelter" : "Real Shelter Impact"}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {language === "en" && ev.socialQuestGoalEn ? ev.socialQuestGoalEn : ev.socialQuestGoal}
                        </p>
                      </div>
                    )}

                    {/* Promo Code Box */}
                    {ev.promoCode && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 mt-1">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono text-xs font-black text-amber-300 tracking-wider">
                            {ev.promoCode}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyPromo(ev.promoCode!)}
                          className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCode === ev.promoCode ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                    )}

                    {/* Physical Location Marker */}
                    {ev.hasPhysicalLocation && ev.latitude && ev.longitude && (
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{ev.locationName || "Sponsored Landmark"}</span>
                        </span>
                        {onOpenMapLocation && (
                          <button
                            onClick={() => onOpenMapLocation(ev.latitude!, ev.longitude!, ev.locationName || ev.sponsorName)}
                            className="text-cyan-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{language === "id" ? "Lihat di Peta" : "View on Map"}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 pt-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={ev.targetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 hover:opacity-95 active:scale-98 transition-all"
                    >
                      <span>{language === "id" ? "Kunjungi Mitra / Promo" : "Visit Partner / Promo"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setSelectedEvent(ev)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title={language === "id" ? "Detail Lengkap" : "Full Details"}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Developer Action Buttons */}
                  {isDeveloper && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold hover:bg-cyan-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Banner */}
            <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={selectedEvent.bannerUrl}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    {selectedEvent.sponsorName}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {language === "en" && selectedEvent.titleEn ? selectedEvent.titleEn : selectedEvent.title}
                  </h2>
                </div>
                {selectedEvent.logoUrl && (
                  <img
                    src={selectedEvent.logoUrl}
                    alt={selectedEvent.sponsorName}
                    className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700 p-1 object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-4 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              <p>{language === "en" && selectedEvent.descriptionEn ? selectedEvent.descriptionEn : selectedEvent.description}</p>
            </div>

            {/* Social Impact / Rescue Information */}
            {selectedEvent.socialImpactDescription && (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                  <HeartHandshake className="w-4 h-4" />
                  <span>{language === "id" ? "Misi Kemanusiaan & Penyelamatan Kucing" : "Humanitarian & Cat Rescue Mission"}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {language === "en" && selectedEvent.socialImpactDescriptionEn ? selectedEvent.socialImpactDescriptionEn : selectedEvent.socialImpactDescription}
                </p>
              </div>
            )}

            {/* Promo Voucher */}
            {selectedEvent.promoCode && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">
                    {language === "id" ? "Kode Promo / Voucher Toko" : "Promo Code / Store Voucher"}
                  </span>
                  <span className="text-xl font-mono font-black text-white tracking-wider">
                    {selectedEvent.promoCode}
                  </span>
                  {selectedEvent.promoDiscount && (
                    <span className="text-xs text-emerald-400 font-bold">{selectedEvent.promoDiscount}</span>
                  )}
                </div>
                <button
                  onClick={() => handleCopyPromo(selectedEvent.promoCode!)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-amber-400 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode === selectedEvent.promoCode ? "Tersalin!" : "Salin Kode"}</span>
                </button>
              </div>
            )}

            {/* CTA Link */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={selectedEvent.targetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>{language === "id" ? "Buka Link Sponsor Resmi" : "Open Official Sponsor Link"}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Developer Create / Edit Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {editingEventId ? "Edit Event Sponsor" : "Buat Event Sponsor Baru"}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Hanya Akun Developer (verydiaz@gmail.com / support@nekomon.online)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex flex-col gap-5 text-xs">
              {/* Row 1: Title & Sponsor Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Judul Event (ID) *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Diskon 20% Whiskas & Pakan Shelter"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Judul Event (EN - Opsional)</label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Example: 20% Off Cat Food & Shelter Drive"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Sponsor Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Nama Sponsor / Brand / Klinik *</label>
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="Contoh: Royal Canin / Pet Care Vet Clinic"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Kategori Sponsor *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SponsorEventType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  >
                    <option value="pet_shop">Pet Shop Lokal / Mitra</option>
                    <option value="vet_clinic">Klinik Dokter Hewan (Vet)</option>
                    <option value="pet_food_brand">Merek Pakan Kucing (Food Brand)</option>
                    <option value="shelter_rescue">Misi Penyelamatan & Donasi Shelter</option>
                    <option value="community_event">Event Komunitas</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Banner URL & Logo URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Banner Image URL *</label>
                  <input
                    type="url"
                    required
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://.../banner.jpg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Logo Sponsor URL (Opsional)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Description ID & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Deskripsi Lengkap (ID) *</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan detail promo, syarat & ketentuan diskon di pet shop / klinik..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Deskripsi (EN - Opsional)</label>
                  <textarea
                    rows={3}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Provide English details for international players..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Promo Voucher & Target Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Kode Promo (Opsional)</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="NEKOPET20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Besar Diskon</label>
                  <input
                    type="text"
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(e.target.value)}
                    placeholder="Diskon 20% / Buy 1 Get 1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Link Tautan Sponsor *</label>
                  <input
                    type="url"
                    required
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    placeholder="https://shopee.co.id/... atau https://vetclinic.id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Physical Location (Sponsored Landmark on Map) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasPhysicalLoc"
                    checked={hasPhysicalLocation}
                    onChange={(e) => setHasPhysicalLocation(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="hasPhysicalLoc" className="font-bold text-slate-200 cursor-pointer">
                    Pasang sebagai Sponsored Landmark di Peta Game (AR & Territory)
                  </label>
                </div>

                {hasPhysicalLocation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400">Nama Lokasi Toko / Klinik</label>
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Pet Shop Senopati Jakarta"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="-6.2088"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="106.8456"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 7: Social Impact / Shelter Quest */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col gap-3">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <HeartHandshake className="w-4 h-4" />
                  <span>Program Donasi Shelter Kucing (Pet Food Brand Campaign)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">Target Dampak Sosial (ID)</label>
                    <input
                      type="text"
                      value={socialQuestGoal}
                      onChange={(e) => setSocialQuestGoal(e.target.value)}
                      placeholder="Setiap 100 kaleng terjual, sponsor mendonasikan 20kg pakan ke Shelter"
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">Target Dampak Sosial (EN)</label>
                    <input
                      type="text"
                      value={socialQuestGoalEn}
                      onChange={(e) => setSocialQuestGoalEn(e.target.value)}
                      placeholder="For every 100 cans bought, sponsor donates 20kg food to Rescue Shelter"
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 8: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Tanggal Mulai Tayang *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">Batas Waktu Berakhir (Expired) *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black tracking-wide shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? "Menyimpan..." : editingEventId ? "Simpan Perubahan" : "Publikasikan Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
