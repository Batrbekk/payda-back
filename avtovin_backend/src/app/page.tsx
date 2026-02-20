"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  Download,
  Phone,
  Mail,
  MapPin,
  Coins,
  Globe,
  Smartphone,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

/* ─── types ─── */
interface Partner {
  id: string;
  name: string;
  type: string;
  city: string;
  rating: number;
  logo_url: string | null;
  addresses: string[];
  services: string[];
}

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── constants ─── */
const FEATURES = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-[#4F56D3]" />,
    iconBg: "#EEF0FC",
    title: "Надёжная защита",
    desc: "Полное КАСКО покрытие через проверенных страховых партнёров",
  },
  {
    icon: <Coins className="w-6 h-6 text-[#E27109]" />,
    iconBg: "#FDE5CE",
    title: "Кешбэк 500₸ от Payda",
    desc: "Наш партнёр Payda начисляет 500₸ за каждое обслуживание",
  },
  {
    icon: <Globe className="w-6 h-6 text-[#4F56D3]" />,
    iconBg: "#EEF0FC",
    title: "По всему Казахстану",
    desc: "Сеть партнёрских СЦ в Алматы, Таразе, Астане и других городах",
  },
  {
    icon: <Smartphone className="w-6 h-6 text-[#4F56D3]" />,
    iconBg: "#EEF0FC",
    title: "Приложение Payda",
    desc: "QR-код, история обслуживания и кешбэк — всё в приложении Payda",
  },
];

const STEPS = [
  { num: "1", title: "Скачайте Payda", desc: "Установите приложение нашего партнёра Payda и добавьте данные авто", color: "#4F56D3" },
  { num: "2", title: "Посетите сервис-центр", desc: "Покажите QR-код из приложения Payda", color: "#4F56D3" },
  { num: "3", title: "Получите кешбэк от Payda", desc: "500₸ от Payda автоматически зачисляется на ваш счёт", color: "#E27109" },
];

const STATS = [
  { num: "50+", label: "Сервисных центров", color: "#FFFFFF" },
  { num: "10+", label: "Городов Казахстана", color: "#FFFFFF" },
  { num: "500₸", label: "Кешбэк за визит", color: "#E27109" },
  { num: "2000₸", label: "Доход для СЦ за визит", color: "#4F56D3" },
];

const AVATAR_COLORS = ["#4F56D3", "#E27109", "#005D4A", "#CA1F1F", "#1976D2", "#7B1FA2"];

/* ─── main component ─── */
export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cities, setCities] = useState<{ name: string; count: number }[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/landing/cities")
      .then((r) => r.json())
      .then((data) => {
        setCities(data);
        if (data.length > 0) setActiveCity(data[0].name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeCity) return;
    fetch(`/api/landing/partners?city=${encodeURIComponent(activeCity)}`)
      .then((r) => r.json())
      .then(setPartners)
      .catch(() => {});
  }, [activeCity]);

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="font-[family-name:var(--font-inter)] overflow-x-hidden">
      {/* ═══════════ HEADER ═══════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[1200px]"
      >
        <nav className="flex items-center justify-between px-6 lg:px-8 h-14 rounded-full bg-white/[0.07] backdrop-blur-xl border border-white/[0.13] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <span className="text-white font-bold text-lg tracking-tight">
            casco<span className="text-[#4F56D3]">.</span>kz
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Преимущества", id: "features" },
              { label: "Как это работает", id: "how" },
              { label: "Партнёры", id: "partners" },
              { label: "Контакты", id: "contacts" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="text-[13px] font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo("cta")}
              className="hidden md:flex items-center bg-[#4F56D3] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#3D43A8] transition-colors cursor-pointer"
            >
              Скачать приложение
            </button>
            <button
              className="md:hidden text-white/80"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 rounded-2xl bg-[#14181F]/95 backdrop-blur-xl border border-white/10 p-4 flex flex-col gap-3"
          >
            {[
              { label: "Преимущества", id: "features" },
              { label: "Как это работает", id: "how" },
              { label: "Партнёры", id: "partners" },
              { label: "Контакты", id: "contacts" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="text-sm text-white/80 hover:text-white py-2 text-left cursor-pointer"
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo("cta")}
              className="bg-[#4F56D3] text-white text-sm font-semibold py-3 rounded-xl mt-1 cursor-pointer"
            >
              Скачать приложение
            </button>
          </motion.div>
        )}
      </motion.header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen bg-gradient-to-b from-[#0A0B2B] via-[#1a1b4b] to-[#2a1b5b] overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -left-24 w-[500px] h-[500px] bg-[#4F56D3]/50 rounded-full blur-[120px]" />
        <div className="absolute top-24 right-[-50px] w-[400px] h-[400px] bg-[#7B61FF]/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-32 left-1/3 w-[350px] h-[350px] bg-[#E27109]/30 rounded-full blur-[90px]" />

        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-[120px] pt-[140px] pb-0 flex flex-col items-center text-center gap-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2 bg-white/[0.08] border border-white/[0.13] rounded-full px-5 py-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#4F56D3]" />
            <span className="text-[#B8C2F3] text-sm font-medium">casco.kz × Payda</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-3xl md:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] max-w-[800px]"
          >
            Автострахование{"\n"}с выгодой от Payda.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[#8592AD] text-base lg:text-lg leading-relaxed max-w-[700px]"
          >
            Оформляйте КАСКО через наши партнёрские сервисные центры по всему Казахстану.
            С приложением Payda получайте 500₸ кешбэк за каждое обслуживание.
          </motion.p>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            onClick={() => scrollTo("cta")}
            className="flex items-center gap-2.5 bg-gradient-to-br from-[#4F56D3] to-[#3D43A8] text-white text-base font-semibold px-10 py-4 rounded-[14px] hover:from-[#3D43A8] hover:to-[#2D3398] transition-all cursor-pointer shadow-lg shadow-[#4F56D3]/25"
          >
            Скачать Payda
            <Download className="w-[18px] h-[18px]" />
          </motion.button>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-wrap justify-center gap-8 lg:gap-20 py-4 w-full"
          >
            {STATS.map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} custom={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl lg:text-4xl font-bold" style={{ color: s.color }}>{s.num}</span>
                <span className="text-[#B8C2F3] text-xs lg:text-sm">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Phone mockups */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="relative flex justify-center items-end gap-[-20px] h-[280px] md:h-[440px] w-full max-w-[900px] overflow-hidden"
          >
            {/* Left phone */}
            <div className="absolute left-[calc(50%-310px)] md:left-[calc(50%-340px)] bottom-0 w-[180px] md:w-[260px] h-[320px] md:h-[520px] bg-[#14181F] rounded-[28px] md:rounded-[36px] border-[3px] border-[#29303D] rotate-6 shadow-[0_20px_60px_rgba(79,86,211,0.25)] hidden sm:block">
              <div className="m-2 md:m-2.5 h-[calc(100%-16px)] md:h-[calc(100%-20px)] bg-white rounded-[22px] md:rounded-[26px]" />
            </div>
            {/* Center phone */}
            <div className="relative w-[220px] md:w-[280px] h-[360px] md:h-[560px] bg-[#14181F] rounded-[32px] md:rounded-[40px] border-[4px] border-[#29303D] shadow-[0_24px_80px_rgba(79,86,211,0.37)] z-10">
              <div className="m-2.5 md:m-3 h-[calc(100%-20px)] md:h-[calc(100%-24px)] bg-white rounded-[24px] md:rounded-[28px]" />
            </div>
            {/* Right phone */}
            <div className="absolute right-[calc(50%-310px)] md:right-[calc(50%-340px)] bottom-0 w-[180px] md:w-[260px] h-[320px] md:h-[520px] bg-[#14181F] rounded-[28px] md:rounded-[36px] border-[3px] border-[#29303D] -rotate-6 shadow-[0_20px_60px_rgba(79,86,211,0.25)] hidden sm:block">
              <div className="m-2 md:m-2.5 h-[calc(100%-16px)] md:h-[calc(100%-20px)] bg-white rounded-[22px] md:rounded-[26px]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <Section id="features" className="bg-white py-16 lg:py-20 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-12 lg:gap-16">
          <div className="flex flex-col items-center gap-4 max-w-[700px] text-center">
            <motion.span variants={fadeUp} custom={0} className="text-[#4F56D3] text-xs font-bold tracking-[2px]">ПРЕИМУЩЕСТВА</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl lg:text-[40px] font-bold text-[#14181F]">Почему выбирают casco.kz?</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#8592AD] text-base lg:text-lg leading-relaxed">
              Мы сотрудничаем с Payda, чтобы автовладельцы и сервисные центры получали максимум выгоды
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="bg-[#F6F7F9] rounded-[20px] p-8 flex flex-col gap-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: f.iconBg }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-[#14181F]">{f.title}</h3>
                <p className="text-sm text-[#8592AD] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <Section id="how" className="bg-[#F6F7F9] py-16 lg:py-20 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-12 lg:gap-16">
          <div className="flex flex-col items-center gap-4 max-w-[700px] text-center">
            <motion.span variants={fadeUp} custom={0} className="text-[#4F56D3] text-xs font-bold tracking-[2px]">КАК ЭТО РАБОТАЕТ</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl lg:text-[40px] font-bold text-[#14181F]">Три простых шага</motion.h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center gap-5 text-center"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: s.color }}
                >
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-[#14181F]">{s.title}</h3>
                <p className="text-sm text-[#8592AD] leading-relaxed max-w-[320px]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ PARTNERS ═══════════ */}
      <Section id="partners" className="bg-white py-16 lg:py-20 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-10 lg:gap-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.span variants={fadeUp} custom={0} className="text-[#4F56D3] text-xs font-bold tracking-[2px]">НАШИ ПАРТНЁРЫ</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl lg:text-[40px] font-bold text-[#14181F]">
              Сервисные центры по всему Казахстану
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#8592AD] text-base lg:text-lg">
              Выберите город, чтобы увидеть список партнёрских сервисных центров
            </motion.p>
          </div>

          {/* City filter */}
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
            {cities.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveCity(c.name)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeCity === c.name
                    ? "bg-[#4F56D3] text-white"
                    : "bg-[#F6F7F9] text-[#14181F] hover:bg-[#ECEDF5]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </motion.div>

          {/* Partner cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {partners.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white rounded-2xl p-7 border border-[#CCD0D8] flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Top row */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-base font-bold text-[#14181F] truncate">{p.name}</span>
                    <span className="text-[13px] text-[#8592AD] truncate">
                      {p.addresses[0] || p.city}
                    </span>
                  </div>
                </div>
                {/* Tags */}
                {p.services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.services.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs font-medium text-[#4F56D3] bg-[#EEF0FC] rounded-md px-3 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {partners.length === 0 && (
              <p className="text-[#8592AD] text-center col-span-full py-8">
                {cities.length === 0 ? "Загрузка..." : "Нет партнёров в этом городе"}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ═══════════ CTA ═══════════ */}
      <Section id="cta" className="bg-gradient-to-br from-[#4F56D3] to-[#212464] py-16 lg:py-20 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-8 text-center">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl lg:text-[40px] font-bold text-white">
            Готовы экономить на обслуживании?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-[#B8C2F3] text-base lg:text-lg max-w-[600px]">
            Скачайте приложение Payda и получайте кешбэк за каждый визит в наши сервисные центры
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4">
            <a
              href="#"
              className="flex items-center justify-center gap-2.5 bg-white text-[#4F56D3] font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Скачать Payda
            </a>
            <a
              href="#partners"
              className="flex items-center justify-center gap-2.5 text-white font-semibold px-8 py-4 rounded-xl border-2 border-white hover:bg-white/10 transition-colors"
            >
              Наши партнёры
              <ChevronRight className="w-5 h-5" />
            </a>
          </motion.div>
          <motion.p variants={fadeUp} custom={3} className="text-[#9BA8EC] text-sm">
            Бесплатно для автовладельцев · Кешбэк от Payda · Поддержка 24/7
          </motion.p>
        </div>
      </Section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="contacts" className="bg-[#14181F] py-12 lg:py-16 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-12">
          {/* Top */}
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            <div className="max-w-[320px] flex flex-col gap-4">
              <span className="text-white font-bold text-xl">
                casco<span className="text-[#4F56D3]">.</span>kz
              </span>
              <p className="text-[13px] text-[#8592AD] leading-relaxed">
                Автострахование нового поколения с кешбэком для владельцев.
              </p>
              <div className="flex flex-col gap-3 mt-2">
                <a href="mailto:info@casco.kz" className="flex items-center gap-2 text-sm text-[#8592AD] hover:text-white transition-colors">
                  <Mail className="w-4 h-4" /> info@casco.kz
                </a>
                <a href="tel:+77001234567" className="flex items-center gap-2 text-sm text-[#8592AD] hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> +7 700 123 45 67
                </a>
              </div>
            </div>

            <div className="flex gap-16">
              <div className="flex flex-col gap-4">
                <span className="text-sm font-semibold text-white">Разделы</span>
                <button onClick={() => scrollTo("features")} className="text-sm text-[#8592AD] hover:text-white transition-colors text-left cursor-pointer">Преимущества</button>
                <button onClick={() => scrollTo("how")} className="text-sm text-[#8592AD] hover:text-white transition-colors text-left cursor-pointer">Как это работает</button>
                <button onClick={() => scrollTo("partners")} className="text-sm text-[#8592AD] hover:text-white transition-colors text-left cursor-pointer">Партнёры</button>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-sm font-semibold text-white">Информация</span>
                <a href="#" className="text-sm text-[#8592AD] hover:text-white transition-colors">Политика конфиденциальности</a>
                <a href="#" className="text-sm text-[#8592AD] hover:text-white transition-colors">Условия использования</a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#29303D]" />

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[13px] text-[#8592AD]">&copy; 2026 casco.kz. Все права защищены.</p>
            <div className="flex gap-6">
              <a href="#" className="text-[13px] text-[#8592AD] hover:text-white transition-colors">Политика конфиденциальности</a>
              <a href="#" className="text-[13px] text-[#8592AD] hover:text-white transition-colors">Условия</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
