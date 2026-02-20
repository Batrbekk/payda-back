import { CalendarCheck, Coins, Car, Percent, FileText, ShieldCheck, ArrowRight, CheckCircle, Apple, Play, Phone, Mail, Download, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-20 px-8 lg:px-20">
          <span className="text-2xl font-bold text-[#1A1A1A]">Kasko.kz</span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Приложение</a>
            <a href="#partners-section" className="text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Партнёрам</a>
            <a href="#guarantee" className="text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Гарантия</a>
            <a href="#footer" className="text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Контакты</a>
          </div>
          <a href="#download" className="bg-[#FFDE59] text-[#1A1A1A] text-[15px] font-semibold px-6 py-3 rounded-3xl hover:bg-[#f5d540] transition-colors">
            Скачать
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#FAFAFA]">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20 py-20 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex flex-col gap-8">
            <h1 className="text-4xl md:text-[56px] font-extrabold text-[#1A1A1A] leading-[1.1]">
              Забудь о просроченном ТО — выиграй автомобиль
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Следи за обслуживанием, получай кэшбек и участвуй в ежемесячном розыгрыше Changan CS55
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#download" className="bg-[#FFDE59] text-[#1A1A1A] text-base font-semibold px-8 py-4 rounded-full hover:bg-[#f5d540] transition-colors">
                Скачать приложение
              </a>
              <a href="#partners-section" className="bg-white text-[#1A1A1A] text-base font-semibold px-8 py-4 rounded-full border-2 border-[#1A1A1A] hover:bg-gray-50 transition-colors">
                Я владелец сервиса
              </a>
            </div>
          </div>
          <div className="w-full max-w-[500px] h-[400px] lg:h-[500px] bg-gradient-to-br from-[#FFDE59] to-[#FFE88A] rounded-3xl flex items-center justify-center">
            <Smartphone className="w-24 h-24 text-[#1A1A1A]/30" />
          </div>
        </div>
        {/* Trust Badges */}
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20 pb-12 flex flex-wrap justify-center gap-12">
          {[
            { num: "37", label: "сервисов" },
            { num: "600+", label: "клиентов" },
            { num: "3", label: "города" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-[32px] font-extrabold text-[#FFDE59]">{b.num}</span>
              <span className="text-base font-medium text-gray-500">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Toggle Section */}
      <section className="bg-white py-12 flex justify-center px-4">
        <div className="bg-gray-100 rounded-full p-1.5 flex">
          <span className="bg-[#FFDE59] text-[#1A1A1A] text-base font-semibold px-8 py-4 rounded-full">Для автовладельцев</span>
          <span className="text-gray-500 text-base font-medium px-8 py-4 rounded-full cursor-pointer hover:text-gray-700">Для сервисных центров</span>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] text-center mb-12">Как это работает?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "01", icon: <Download className="w-8 h-8 text-[#1A1A1A]" />, title: "Скачай приложение", desc: "Установи Kasko.kz на iOS или Android бесплатно" },
              { num: "02", icon: <Car className="w-8 h-8 text-[#1A1A1A]" />, title: "Добавь свой автомобиль", desc: "Заполни данные авто и получай персональные напоминания" },
              { num: "03", icon: <CalendarCheck className="w-8 h-8 text-[#1A1A1A]" />, title: "Проходи ТО у партнёров", desc: "Сканируй QR-код в сервисе — мы всё запишем автоматически" },
              { num: "04", icon: <Car className="w-8 h-8 text-[#1A1A1A]" />, title: "Участвуй в розыгрыше", desc: "Каждое ТО — это шанс выиграть Changan CS55" },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-5 p-6 text-center">
                <div className="w-20 h-20 bg-[#FFDE59] rounded-[40px] flex items-center justify-center">{step.icon}</div>
                <span className="text-sm font-bold text-[#FFDE59]">{step.num}</span>
                <h3 className="text-xl font-bold text-[#1A1A1A]">{step.title}</h3>
                <p className="text-[15px] text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#F9FAFB] py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] text-center mb-12">Что ты получаешь:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <CalendarCheck className="w-7 h-7 text-[#FFDE59]" />, title: "Напоминания о ТО", desc: "Никогда не пропустишь плановое обслуживание — напомним заранее" },
              { icon: <Coins className="w-7 h-7 text-[#FFDE59]" />, title: "Кэшбек 500₸ с каждого ТО", desc: "Получай реальные деньги за каждое пройденное обслуживание" },
              { icon: <Car className="w-7 h-7 text-[#FFDE59]" />, title: "Розыгрыш авто каждый месяц", desc: "Участвуй в розыгрыше Changan CS55 каждый месяц" },
              { icon: <Percent className="w-7 h-7 text-[#FFDE59]" />, title: "Скидки у партнёров до 20%", desc: "Экономь на запчастях и услугах у партнёрских сервисов" },
              { icon: <FileText className="w-7 h-7 text-[#FFDE59]" />, title: "История обслуживания", desc: "Вся история ТО в одном месте — для тебя и будущего покупателя" },
              { icon: <ShieldCheck className="w-7 h-7 text-[#FFDE59]" />, title: "Гарантия Kasko.kz", desc: "Расширенная гарантия на двигатель, батарею и электронику" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-[20px] p-8 flex flex-col gap-4">
                <div className="w-14 h-14 bg-[#FFF8E1] rounded-2xl flex items-center justify-center">{f.icon}</div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">{f.title}</h3>
                <p className="text-[15px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Giveaway Section */}
      <section className="bg-gradient-to-br from-[#FFDE59] to-[#FFE88A] py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex flex-col gap-8">
            <span className="bg-[#1A1A1A] text-[#FFDE59] text-xs font-bold px-4 py-2 rounded-full w-fit tracking-wider">ЕЖЕМЕСЯЧНЫЙ РОЗЫГРЫШ</span>
            <h2 className="text-3xl md:text-[42px] font-extrabold text-[#1A1A1A] leading-[1.2]">
              Каждый месяц разыгрываем автомобиль
            </h2>
            <p className="text-lg text-[#1A1A1A]/80">Условия просты: пройди ТО — участвуй в розыгрыше</p>
            <div className="flex gap-4">
              {[
                { val: "12", label: "дней" },
                { val: "08", label: "часов" },
                { val: "45", label: "минут" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl px-6 py-4 flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-[#1A1A1A]">{c.val}</span>
                  <span className="text-sm text-gray-500">{c.label}</span>
                </div>
              ))}
            </div>
            <a href="#download" className="bg-[#1A1A1A] text-white text-base font-semibold px-8 py-4 rounded-full flex items-center gap-2 w-fit hover:bg-[#333] transition-colors">
              Хочу участвовать <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="w-full max-w-[480px] h-[360px] bg-[#1A1A1A]/10 rounded-3xl flex items-center justify-center">
            <Car className="w-20 h-20 text-[#1A1A1A]/30" />
          </div>
        </div>
      </section>

      {/* For Service Centers */}
      <section id="partners-section" className="bg-[#1A1A1A] py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex flex-col gap-8">
            <span className="bg-[#FFDE59] text-[#1A1A1A] text-xs font-bold px-4 py-2 rounded-full w-fit tracking-wider">ДЛЯ ПАРТНЁРОВ</span>
            <h2 className="text-3xl md:text-[42px] font-extrabold text-white leading-[1.2]">
              Станьте партнёром Kasko.kz
            </h2>
            <p className="text-xl text-gray-400">Получайте клиентов без затрат на рекламу</p>
            <div className="flex flex-col gap-4">
              {[
                "Клиенты приходят к вам через приложение",
                "Платите только за факт обслуживания",
                "Ваш сервис в каталоге 10,000+ автовладельцев",
                "Простая интеграция — сканируйте QR и всё",
              ].map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#FFDE59] flex-shrink-0" />
                  <span className="text-base text-white">{b}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <a href="#" className="bg-[#FFDE59] text-[#1A1A1A] text-base font-semibold px-8 py-4 rounded-full hover:bg-[#f5d540] transition-colors">
                Стать партнёром
              </a>
            </div>
            <p className="text-[15px] text-gray-400">Или позвоните: +7 7XX XXX XX XX</p>
          </div>
          <div className="w-full max-w-[420px] h-[400px] bg-white/10 rounded-3xl flex items-center justify-center">
            <Smartphone className="w-20 h-20 text-white/20" />
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-white py-16 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-10">
          <p className="text-xl font-semibold text-gray-400">Нам доверяют:</p>
          <div className="flex flex-wrap justify-center gap-6 lg:gap-12">
            {["АвтоСервис 1", "МастерАвто", "СТО Профи", "AutoCare KZ", "ТехМастер", "АвтоЦентр"].map((p) => (
              <div key={p} className="bg-gray-100 rounded-lg px-6 h-[50px] flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-400">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Screenshots */}
      <section className="bg-[#F9FAFB] py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">Удобное приложение</h2>
            <p className="text-lg text-gray-500">Всё для твоего авто в одном месте</p>
          </div>
          <div className="flex items-end justify-center gap-6 overflow-hidden">
            <div className="w-[180px] lg:w-[220px] h-[360px] lg:h-[440px] rounded-[28px] border-[8px] border-[#1A1A1A] bg-white" />
            <div className="w-[200px] lg:w-[240px] h-[400px] lg:h-[480px] rounded-[32px] border-[8px] border-[#1A1A1A] bg-[#FFDE59]/10" />
            <div className="w-[180px] lg:w-[220px] h-[360px] lg:h-[440px] rounded-[28px] border-[8px] border-[#1A1A1A] bg-white hidden sm:block" />
            <div className="w-[180px] lg:w-[220px] h-[360px] lg:h-[440px] rounded-[28px] border-[8px] border-[#1A1A1A] bg-white hidden md:block" />
          </div>
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFDE59]" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section id="guarantee" className="bg-white py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full max-w-[400px] h-[320px] bg-gradient-to-br from-[#FFDE59]/20 to-[#FFF8E1] rounded-3xl flex items-center justify-center">
            <ShieldCheck className="w-20 h-20 text-[#FFDE59]" />
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <span className="bg-[#FFF8E1] text-[#B8860B] text-xs font-bold px-4 py-2 rounded-full w-fit tracking-wider">ЗАЩИТА KASKO</span>
            <h2 className="text-3xl md:text-[42px] font-extrabold text-[#1A1A1A] leading-[1.2]">Гарантия Kasko.kz</h2>
            <p className="text-2xl font-bold text-[#FFDE59]">Экономия до 3,000,000₸ на ремонте</p>
            <p className="text-base text-gray-500 leading-relaxed">
              Расширенная гарантия покрывает ремонт двигателя, электродвигателя и батареи. Защити себя от непредвиденных расходов.
            </p>
            <a href="#" className="bg-[#FFDE59] text-[#1A1A1A] text-base font-semibold px-8 py-4 rounded-full flex items-center gap-2 w-fit hover:bg-[#f5d540] transition-colors">
              Узнать подробнее <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="bg-[#FFDE59] py-20 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex flex-col gap-8">
            <h2 className="text-3xl md:text-[42px] font-extrabold text-[#1A1A1A] leading-[1.2]">
              Скачай приложение и начни экономить
            </h2>
            <p className="text-lg text-[#1A1A1A]/80">
              Присоединяйся к тысячам водителей, которые уже экономят с Kasko.kz
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="bg-[#1A1A1A] text-white rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-[#333] transition-colors">
                <Apple className="w-7 h-7" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/80">Скачать в</span>
                  <span className="text-base font-semibold">App Store</span>
                </div>
              </a>
              <a href="#" className="bg-[#1A1A1A] text-white rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-[#333] transition-colors">
                <Play className="w-7 h-7" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/80">Скачать в</span>
                  <span className="text-base font-semibold">Google Play</span>
                </div>
              </a>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="w-[200px] h-[400px] rounded-3xl border-[6px] border-[#1A1A1A] bg-white" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-[#1A1A1A] py-16 px-8 lg:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-12 mb-12">
            <div className="max-w-[280px]">
              <h3 className="text-2xl font-bold text-white mb-4">Kasko.kz</h3>
              <p className="text-sm text-gray-400">Экосистема для автовладельцев Казахстана</p>
            </div>
            <div className="flex gap-16">
              <div className="flex flex-col gap-4">
                <span className="text-sm font-semibold text-white">Компания</span>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">О нас</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Партнёрам</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Гарантия</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-sm font-semibold text-white">Поддержка</span>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Контакты</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Политика конфиденциальности</a>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-sm font-semibold text-white">Контакты</span>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" /> +7 7XX XXX XX XX
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" /> info@kasko.kz
              </div>
            </div>
          </div>
          <div className="border-t border-[#2D2D2D] pt-6 text-center">
            <p className="text-[13px] text-gray-500">&copy; 2025 Kasko.kz. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
