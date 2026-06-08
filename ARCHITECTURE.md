# BeautyOS — Architecture v1
> Дата: 2026-06-08 | Статус: FROZEN

---

## 1. АУДИТ ТЕКУЩЕГО СОСТОЯНИЯ

### Страницы и маршруты

| Маршрут | Роль | Статус | Проблемы |
|---|---|---|---|
| `/` | — | ✅ Готов | Онбординг, загрузка CSV |
| `/role` | — | ✅ Готов | Выбор роли |
| `/dashboard` | Owner | ✅ Готов | Нет "Daily Action" блока |
| `/retention` | Owner | ✅ Готов | Нет Return Score, нет Revenue Opportunity |
| `/master` | Master | ✅ Готов | Нет геймификации |
| `/client` | Client | ⚠️ Прототип | Статичный mock, нет данных |

**Отсутствуют:**
- `/reputation` — AI Reputation Director
- `/competitors` — AI Competitor Director
- `/marketing` — AI Marketing Director
- `/retention/[client_id]` — детальный экран клиента

### API Routes

| Endpoint | Назначение | Статус |
|---|---|---|
| `POST /api/upload` | CSV → анализ → Supabase | ✅ |
| `GET /api/clients` | Список клиентов по статусу | ✅ |
| `GET /api/summary` | Агрегаты для dashboard | ✅ |
| `GET /api/masters` | Список мастеров | ✅ |
| `GET /api/insights` | AI-инсайты салона | ✅ |
| `POST /api/master-insight` | AI-рекомендация для мастера | ✅ |
| `POST /api/clients` (POST) | Генерация текста возврата | ✅ |

**Отсутствуют:**
- `GET /api/clients/[id]` — детальная карточка клиента
- `GET /api/daily-action` — главное действие дня
- `GET /api/reputation` — mock данные репутации
- `GET /api/competitors` — mock данные конкурентов

### Технический долг

| Проблема | Критичность | Решение |
|---|---|---|
| `visits.client_id = null` — визиты не связаны с клиентами | Высокая | Добавить при импорте |
| Нет `return_score` на клиенте | Высокая | Добавить в retention-engine |
| Нет авторизации — любой `salon_id` открывает данные | Высокая | Supabase Auth (V1) |
| `TODAY` захардкожен на старте сервера | Средняя | Передавать как параметр |
| Нет таблицы `services` | Средняя | Добавить в V1 |
| `agent_type` в Insight не включает `reputation`, `competitor` | Низкая | Расширить тип |
| Нет кэша AI-инсайтов — каждый анализ дорогой | Средняя | TTL-кэш (V1) |

---

## 2. DOMAIN MODEL

```
Salon
├── id, name, owner_id, crm_type
│
├── Masters[]
│   ├── id, name, salon_id
│   ├── retention_rate, avg_check, total_revenue
│   └── active/at_risk/lost counts
│
├── Clients[]
│   ├── id, name, phone, salon_id
│   ├── first/last_visit_date
│   ├── total_visits, total_revenue, avg_check
│   ├── avg_interval_days
│   ├── status: active | at_risk | lost
│   ├── risk_score: 0.0–1.0
│   ├── return_score: 0.0–1.0        ← ДОБАВИТЬ
│   └── revenue_opportunity: number   ← ДОБАВИТЬ
│
├── Visits[]
│   ├── id, salon_id, client_id (!)
│   ├── master_name, service_name
│   ├── visit_date, amount
│
├── Insights[]
│   ├── agent_type: retention|profit|load|marketing|quality|reputation|competitor
│   ├── title, body, financial_impact
│   └── priority: critical|warning|info
│
└── DailyActions[]          ← ДОБАВИТЬ
    ├── salon_id
    ├── action_type: call|sms|offer|review_request
    ├── title, description
    ├── financial_impact
    ├── probability
    ├── target_clients: uuid[]
    └── created_date
```

---

## 3. NAVIGATION MAP

```
[Landing /]
    │
    ▼ после загрузки CSV
[Role Selection /role]
    │
    ├──[OWNER]──────────────────────────────────────────────────┐
    │  /dashboard                                                │
    │  ├── Daily AI Brief (главное действие дня)                │
    │  ├── Summary (можно вернуть N клиентов → X ₽)            │
    │  └── Agents Grid (4 карточки)                             │
    │       ├── /retention ──► ClientRiskList ──► /retention/[id]│
    │       ├── /reputation (mock)                              │
    │       ├── /competitors (mock)                             │
    │       └── /marketing (mock)                               │
    │                                                           │
    ├──[MASTER]─────────────────────────────────────────────────┤
    │  /master                                                   │
    │  ├── Stats (возвратность, риск, выручка)                  │
    │  ├── Gamification (индекс, рейтинг, прогресс)             │
    │  └── AI Coach (следующее лучшее действие)                 │
    │                                                           │
    └──[CLIENT]─────────────────────────────────────────────────┘
       /client
       ├── Следующий визит + окна мастера
       ├── История процедур
       └── Beauty AI Assistant
```

---

## 4. USER FLOWS

### Owner: Daily Flow
```
Открыл приложение утром
→ Видит Daily AI Brief: "Позвонить 12 клиентам Натальи. 48 000 ₽ / 83%"
→ Нажал [Выполнить]
→ Открылся список 12 клиентов с номерами и скриптами
→ Отметил выполненных
→ Система зафиксировала действие
← Закрыл. 3 минуты. Дело сделано.
```

### Owner: Retention Deep-Dive
```
Dashboard → [Вернуть клиентов]
→ Retention Director: список по риску
→ Клик на клиента → детальная карточка
→ Return Score: 87% | Revenue Opportunity: 8 400 ₽
→ [Сгенерировать сообщение]
→ Копировать → отправить в WhatsApp
```

### Master: Morning Check
```
Открыл /master
→ Видит: возвратность 71%, в риске 8 клиентов
→ AI Coach: "Написать Анне Петровой — 47 дней без записи"
→ [Действие] → готовый текст → скопировать
→ Видит прогресс: "До уровня Про — 3 возврата"
```

---

## 5. ARCHITECTURE DECISIONS

### Принцип Next Best Action
Каждый экран заканчивается одной кнопкой с глаголом.  
Не "отчёт", а "позвонить". Не "аналитика", а "вернуть".

### Mock-First для новых агентов
Reputation, Competitor, Marketing — сначала полноценный UI с mock data.  
Потом подключаются реальные источники данных.  
Владелец видит ценность продукта до интеграции.

### AI — интерпретатор, не источник данных
Алгоритмы (retention-engine) считают детерминированно.  
OpenAI только объясняет результат человеческим языком.  
Это дешевле и надёжнее.

### Мультитенантность с первого дня
Каждая запись содержит `salon_id`.  
Auth через Supabase добавляется в V1 без изменения схемы.

---

## 6. ROADMAP

### MVP (текущий спринт — 1–2 недели)
**Цель: демо, которое продаёт. Одна очень дорогая проблема + одна кнопка.**

| Задача | Файл | Приоритет |
|---|---|---|
| Return Score + Revenue Opportunity на клиенте | retention-engine, types | 🔴 |
| Daily AI Brief на dashboard (главное действие дня) | dashboard/page, api/daily-action | 🔴 |
| Master: геймификация (индекс, рейтинг, прогресс) | master/page | 🟠 |
| /reputation — mock экран Reputation Director | app/reputation/page | 🟠 |
| /competitors — mock экран Competitor Director | app/competitors/page | 🟠 |
| /marketing — mock экран Marketing Director | app/marketing/page | 🟡 |
| Детальная карточка клиента /retention/[id] | app/retention/[id]/page | 🟡 |
| Dashboard: добавить агентов Reputation, Competitor | dashboard/page | 🟡 |

---

### V1 (месяц 2–3)
**Цель: первые платящие клиенты. Supabase Auth. YClients API.**

- Supabase Auth (email / magic link)
- Подключение YClients API (вместо CSV)
- Ежедневные push-уведомления (Telegram-бот)
- Campaigns: массовая рассылка по сегменту
- Сохранение выполненных действий
- History: трекинг возвратов после кампаний
- Services таблица + анализ по услугам

---

### V2 (месяц 4–6)
**Цель: retention через автоматизацию. MRR × 3.**

- Beauty AI Assistant как полноценный Telegram-бот
- AI Performance Coach (личный бот мастера)
- AI Profit Director (маржинальность услуг)
- AI Load Director (оптимизация расписания)
- Суммарный ROI: "BeautyOS вернул вам X ₽ за этот месяц"

---

### V3 (месяц 7–12)
**Цель: платформа. Сети салонов. Enterprise.**

- AI Marketing Director (генерация контента)
- AI Competitor Director (реальные данные 2GIS/Яндекс)
- Multi-location (сети 5+ точек)
- API для партнёров (Dikidi, YClients, Planfix)
- White-label для крупных сетей

---

## 7. КОМПОНЕНТЫ ДЛЯ СОЗДАНИЯ (следующий шаг)

После утверждения архитектуры реализовать в порядке приоритета:

### 7.1 Return Score + Revenue Opportunity
```typescript
// retention-engine.ts — добавить
return_score: calcReturnScore(client)     // 0.0–1.0
revenue_opportunity: calcOpportunity(client) // ₽
```

### 7.2 Daily AI Brief
```typescript
// /api/daily-action — новый endpoint
// Логика: найти один мастер с наибольшим at_risk × avg_check
// Вернуть: master_name, client_count, potential_revenue, probability
```

### 7.3 Master Gamification
```typescript
// Показывать относительно других мастеров салона:
retention_rank: "Лучше чем у 72% мастеров"
progress_to_next: { needed: 4, label: "до уровня Про" }
saved_revenue: number
returned_clients: number
```

### 7.4 Mock Directors
```
/reputation  — рейтинг, динамика, неотвеченные отзывы
/competitors — конкуренты, средний чек, новые акции
/marketing   — контент-план, идеи постов, акции
```

---

## 8. ПРАВИЛА РАЗРАБОТКИ

1. **Никаких новых страниц без записи в Navigation Map**
2. **Никаких новых API без записи в Domain Model**
3. **Каждый экран заканчивается одной кнопкой с глаголом**
4. **Mock data — это ок для демо. Пометить `// MOCK` в коде**
5. **TypeScript strict — ноль `any`**
6. **Все строки на русском языке**
