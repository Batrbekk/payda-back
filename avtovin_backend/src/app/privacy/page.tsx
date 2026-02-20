"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="font-[family-name:var(--font-inter)] min-h-screen bg-white">
      <header className="bg-[#0A0B2B] py-6 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-land.svg" alt="casco.kz" className="h-7" />
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
          Политика конфиденциальности
        </h1>
        <p className="text-sm text-[#8592AD] mb-8">
          Последнее обновление: 20 февраля 2026 г.
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-[#14181F] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности (далее — Политика) действует в отношении
              всей информации, которую сервис casco.kz (далее — Сервис) может получить
              о Пользователе во время использования сайта casco.kz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">2. Сбор информации</h2>
            <p>Мы собираем следующие данные:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Номер телефона — для связи с менеджером и уведомлений</li>
              <li>ФИО — для оформления гарантии</li>
              <li>VIN-номер и государственный номер автомобиля — для идентификации транспортного средства</li>
              <li>Марка, модель и год выпуска автомобиля — для оценки при первичном осмотре</li>
              <li>Данные о техническом состоянии — для оформления гарантийного покрытия</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">3. Использование информации</h2>
            <p>Собранная информация используется для:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Проведения первичного осмотра и оценки автомобиля</li>
              <li>Оформления и ведения гарантийного покрытия</li>
              <li>Связи с пользователем по вопросам обслуживания</li>
              <li>Направления к партнёрским сервисным центрам</li>
              <li>Обеспечения безопасности и предотвращения мошенничества</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">4. Защита данных</h2>
            <p>
              Мы применяем современные методы защиты персональных данных, включая шифрование
              при передаче данных (SSL/TLS), безопасное хранение данных на серверах и
              ограниченный доступ к персональной информации.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">5. Передача данных третьим лицам</h2>
            <p>
              Мы не продаём и не передаём персональные данные третьим лицам, за исключением
              случаев, предусмотренных законодательством Республики Казахстан, а также
              партнёрским сервисным центрам в объёме, необходимом для оказания гарантийного
              обслуживания.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">6. Хранение данных</h2>
            <p>
              Персональные данные хранятся на территории Республики Казахстан.
              Срок хранения данных — в течение всего периода действия гарантии и 3 года
              после её окончания.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">7. Права пользователя</h2>
            <p>Пользователь имеет право:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Запросить информацию о хранящихся персональных данных</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Потребовать удаления персональных данных</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-3">8. Контакты</h2>
            <p>
              По вопросам, связанным с обработкой персональных данных, вы можете
              обратиться по адресу электронной почты:{" "}
              <a href="mailto:paydacasco@gmail.com" className="text-[#4F56D3] hover:underline">
                paydacasco@gmail.com
              </a>{" "}
              или по телефону{" "}
              <a href="tel:+77072292441" className="text-[#4F56D3] hover:underline">
                +7 707 229 24 41
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-[#14181F] py-8 px-5 lg:px-[120px]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-[#8592AD]">&copy; 2026 casco.kz. Все права защищены.</p>
          <div className="flex gap-6">
            <span className="text-[13px] text-white">Политика конфиденциальности</span>
            <Link href="/terms" className="text-[13px] text-[#8592AD] hover:text-white transition-colors">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
