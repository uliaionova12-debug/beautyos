import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream text-graphite">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-dusk hover:text-sage transition-colors mb-10">
          <ArrowLeft size={15} />
          Вернуться на главную
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">Политика обработки персональных данных</h1>
        <p className="text-sm text-dusk mb-10">Последнее обновление: июнь 2025</p>

        <div className="prose prose-sm max-w-none text-dusk space-y-8">

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">1. Общие положения</h2>
            <p className="leading-relaxed">
              ИП «BeautyOS» (далее — «Оператор») обрабатывает персональные данные в соответствии
              с Федеральным законом № 152-ФЗ «О персональных данных». Используя сервис BeautyOS,
              вы даёте согласие на обработку данных, описанную в настоящей политике.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">2. Какие данные мы обрабатываем</h2>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
              <li>Данные о клиентах вашего салона из загружаемых CSV-файлов: имя, телефон, история визитов, суммы чеков</li>
              <li>Контактные данные пользователя-администратора: email, название и город салона</li>
              <li>Технические данные: IP-адрес, браузер, время сессий (в целях безопасности)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">3. Цели обработки</h2>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
              <li>Предоставление аналитики возвратности клиентов</li>
              <li>Формирование AI-рекомендаций по работе с клиентской базой</li>
              <li>Обеспечение безопасности и работоспособности сервиса</li>
              <li>Направление уведомлений, связанных с работой сервиса</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">4. Хранение и защита данных</h2>
            <p className="leading-relaxed">
              Данные хранятся в защищённой базе данных Supabase (EU-region, ISO 27001).
              Передача данных осуществляется по протоколу HTTPS/TLS 1.3.
              Доступ к данным ограничен и защищён многофакторной аутентификацией.
              Данные не продаются и не передаются третьим лицам без вашего согласия.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">5. Ваши права</h2>
            <p className="leading-relaxed mb-3">Вы вправе в любой момент:</p>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
              <li>Получить доступ к своим данным</li>
              <li>Запросить исправление неточных данных</li>
              <li>Запросить удаление всех данных вашего аккаунта</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Для реализации прав обратитесь на{' '}
              <a href="mailto:hello@beautyos.ai" className="text-sage hover:underline">hello@beautyos.ai</a>.
              Срок ответа — не более 10 рабочих дней.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">6. Cookies</h2>
            <p className="leading-relaxed">
              Сервис использует технические cookies, необходимые для работы аутентификации и безопасности.
              Маркетинговые и аналитические cookies не используются без вашего явного согласия.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-graphite mb-3">7. Контакты</h2>
            <p className="leading-relaxed">
              По всем вопросам обработки данных:{' '}
              <a href="mailto:hello@beautyos.ai" className="text-sage hover:underline">hello@beautyos.ai</a>
              {' '}или через{' '}
              <a href="https://t.me/beautyos_ai" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">Telegram</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
