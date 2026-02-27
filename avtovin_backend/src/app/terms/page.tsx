"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="font-[family-name:var(--font-inter)] min-h-screen bg-white">
      <header className="bg-[#0A0B2B] py-6 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold text-white tracking-tight">Payda</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            &larr; На главную
          </Link>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-5 py-12 lg:py-16">
        <h1 className="text-3xl font-bold text-[#14181F] mb-8">
          Условия использования
        </h1>
        <p className="text-sm text-[#8592AD] mb-8">
          Последнее обновление: 20 февраля 2026 г.
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-[#14181F] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">1. Общие положения</h2>
            <p>
              Настоящие Условия использования (далее — Условия) регулируют порядок использования
              сайта Payda (далее — Сервис). Используя Сервис, вы соглашаетесь с настоящими Условиями.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">2. Описание Сервиса</h2>
            <p>
              Payda — сервис гарантийного обслуживания автомобилей, предоставляющий
              автовладельцам доступ к сети партнёрских сервисных центров по всему Казахстану.
              Через Payda пользователи могут:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Оформить гарантию на автомобиль</li>
              <li>Пройти первичный осмотр для активации гарантии</li>
              <li>Обслуживаться в партнёрских сервисных центрах</li>
              <li>Получать гарантийное покрытие при обращении в СЦ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">3. Оформление гарантии</h2>
            <p>
              Для оформления гарантии необходимо связаться с менеджером Payda и
              назначить первичный осмотр автомобиля. После успешного осмотра гарантия
              активируется. Для автомобилей, приобретённых в автосалонах-партнёрах,
              гарантия активируется автоматически.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">4. Обязанности пользователя</h2>
            <p>Пользователь обязуется:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Предоставлять достоверные данные об автомобиле</li>
              <li>Проходить техническое обслуживание в партнёрских сервисных центрах</li>
              <li>Своевременно сообщать об изменениях в техническом состоянии авто</li>
              <li>Не использовать Сервис в противоправных целях</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">5. Ответственность</h2>
            <p>
              Payda несёт ответственность за организацию гарантийного обслуживания
              в рамках условий гарантии. Качество ремонтных работ обеспечивается
              партнёрскими сервисными центрами. Претензии по качеству выполненных работ
              рассматриваются совместно с сервисным центром.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">6. Партнёрские сервисные центры</h2>
            <p>
              Сервисные центры, представленные на платформе, являются проверенными партнёрами
              Payda. Каждый партнёр проходит аттестацию и соответствует стандартам качества.
              Стоимость работ, не покрываемых гарантией, определяется сервисным центром.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">7. Изменение условий</h2>
            <p>
              Мы оставляем за собой право изменять настоящие Условия. О существенных изменениях
              пользователи будут уведомлены по SMS или электронной почте. Продолжение
              использования Сервиса означает согласие с обновлёнными Условиями.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">8. Применимое право</h2>
            <p>
              Настоящие Условия регулируются законодательством Республики Казахстан.
              Все споры разрешаются в соответствии с действующим законодательством РК.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">9. Контакты</h2>
            <p>
              По всем вопросам обращайтесь:{" "}
              <a href="mailto:paydacasco@gmail.com" className="text-[#4F56D3] hover:underline">
                paydacasco@gmail.com
              </a>{" "}
              или{" "}
              <a href="tel:+77758221235" className="text-[#4F56D3] hover:underline">
                +7 775 822 12 35
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-[#14181F] py-8 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-[#8592AD]">&copy; 2026 Payda. Все права защищены.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[13px] text-[#8592AD] hover:text-white transition-colors">Политика конфиденциальности</Link>
            <span className="text-[13px] text-white">Условия</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
