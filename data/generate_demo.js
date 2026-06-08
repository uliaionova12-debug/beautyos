// Генератор демо-данных: реалистичный CSV для BeautyOS
// node data/generate_demo.js > public/sample_salon.csv

const MASTERS = ['Наташа', 'Ольга', 'Марина', 'Алина', 'Катя']
const SERVICES = [
  'Маникюр', 'Маникюр + гель', 'Педикюр', 'Педикюр + гель',
  'Маникюр + педикюр', 'Брови (оформление)', 'Брови (окрашивание)',
  'Ресницы (наращивание)', 'Ресницы (коррекция)', 'Уход за лицом',
  'Окрашивание волос', 'Стрижка', 'Укладка',
]
const PRICES = {
  'Маникюр': 1800, 'Маникюр + гель': 2800, 'Педикюр': 2200,
  'Педикюр + гель': 3200, 'Маникюр + педикюр': 3800,
  'Брови (оформление)': 1200, 'Брови (окрашивание)': 1500,
  'Ресницы (наращивание)': 3500, 'Ресницы (коррекция)': 1800,
  'Уход за лицом': 2500, 'Окрашивание волос': 5500,
  'Стрижка': 1200, 'Укладка': 900,
}

const NAMES = [
  'Анна Соколова', 'Мария Иванова', 'Ольга Петрова', 'Елена Сидорова',
  'Наталья Кузнецова', 'Татьяна Попова', 'Ирина Новикова', 'Светлана Морозова',
  'Юлия Волкова', 'Алла Козлова', 'Вера Лебедева', 'Надежда Соловьёва',
  'Людмила Васильева', 'Галина Зайцева', 'Оксана Павлова', 'Диана Семёнова',
  'Алина Голубева', 'Кристина Виноградова', 'Валерия Богданова', 'Полина Никитина',
  'Дарья Фёдорова', 'Екатерина Орлова', 'Маргарита Сорокина', 'Ксения Ковалёва',
  'Виктория Романова', 'Тамара Беляева', 'Зинаида Медведева', 'Раиса Антонова',
  'Инна Гусева', 'Нина Яковлева', 'Лариса Степанова', 'Жанна Захарова',
  'Регина Лазарева', 'Эльвира Тарасова', 'Лилия Белова', 'Карина Михайлова',
  'Ангелина Пономарёва', 'Валентина Рыбакова', 'Зульфия Кириллова', 'Камилла Ершова',
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d) {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

function randomPhone() {
  return '+7' + randomInt(9000000000, 9999999999)
}

const rows = [['Клиент', 'Телефон', 'Дата визита', 'Мастер', 'Услуга', 'Сумма']]
const today = new Date('2026-06-08')

// Создаём 280 клиентов с разными паттернами поведения
for (let i = 0; i < 280; i++) {
  const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : '')
  const phone = randomPhone()
  const master = MASTERS[randomInt(0, MASTERS.length - 1)]

  // Паттерн клиента
  const pattern = randomInt(1, 10)
  let firstVisitDaysAgo, avgInterval, numVisits, stopDaysAgo

  if (pattern <= 4) {
    // Активный клиент (40%) — ходит регулярно, последний визит недавно
    firstVisitDaysAgo = randomInt(120, 365)
    avgInterval = randomInt(25, 40)
    numVisits = Math.floor(firstVisitDaysAgo / avgInterval)
    stopDaysAgo = randomInt(0, avgInterval * 1.2)
  } else if (pattern <= 7) {
    // Клиент в риске (30%) — раньше ходил, пропустил 1-2 цикла
    firstVisitDaysAgo = randomInt(90, 300)
    avgInterval = randomInt(25, 45)
    numVisits = Math.floor(firstVisitDaysAgo / avgInterval) - randomInt(1, 2)
    stopDaysAgo = Math.floor(avgInterval * randomInt(15, 25) / 10)
  } else {
    // Потерянный (30%) — не был очень давно
    firstVisitDaysAgo = randomInt(150, 400)
    avgInterval = randomInt(28, 50)
    numVisits = randomInt(2, 8)
    stopDaysAgo = randomInt(80, 200)
  }

  numVisits = Math.max(1, numVisits)
  const service = SERVICES[randomInt(0, SERVICES.length - 1)]
  const basePrice = PRICES[service]
  const priceVariation = randomInt(-200, 400)
  const amount = Math.max(500, basePrice + priceVariation)

  // Генерируем визиты назад от stopDaysAgo
  let visitDate = addDays(today, -stopDaysAgo)

  for (let v = 0; v < numVisits; v++) {
    rows.push([
      name,
      phone,
      formatDate(visitDate),
      master,
      service,
      String(amount + randomInt(-100, 200)),
    ])
    visitDate = addDays(visitDate, -(avgInterval + randomInt(-5, 5)))
    // Не уходим в будущее
    if (visitDate > today) visitDate = new Date(today)
  }
}

// Выводим CSV
console.log(rows.map(row => row.join(',')).join('\n'))
