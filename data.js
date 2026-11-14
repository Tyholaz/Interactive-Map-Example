/* ============================================================
   config.js — налаштування, які найчастіше доводиться міняти
   ============================================================ */

// Центр карти (запасна точка старту)
const CENTER = [49.564, 25.618];

// id мікрорайону «Аляска» в OpenStreetMap (можна додати кілька через кому)
const AREAS = [327955987];

// Дзеркала Overpass API — пробуються по черзі, поки одне не відповість
const OVPS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

// Категорії: ключ → назва (іконки — у utils.js, переклади — у i18n-dict.js)
const CATS = { eat: 'Поїсти', cafe: "Кав'ярні", bar: 'Бари', walk: 'Погуляти', see: 'Побачити', shop: 'Магазини' };

// Режими маршруту: [назва, профіль OSRM, режим Google Maps]
const MODES = {
  foot: ['Пішки', 'routed-foot', 'walking'],
  bike: ['Велосипед', 'routed-bike', 'bicycling'],
  car: ['Авто', 'routed-car', 'driving']
};

// Орієнтовна швидкість (м/хв) для оцінки часу в списку
const SPEED = { foot: 80, bike: 250, car: 450 };
// Підпис до часу в списку («~5 хв пішки»)
const ETA_W = { foot: 'пішки', bike: 'на велосипеді', car: 'авто' };
/* ============================================================
   places.js — ВЛАСНА ДОБІРКА МІСЦЬ (тут додавайте / правте місця)

   Поля:
     id      унікальний, починається з "c-"
     name    назва
     cat     eat | cafe | bar | walk | see | shop
     coords  [широта, довгота]
     desc    короткий опис
     facts   масив цікавих фактів (може бути порожнім)
     addr, phone, hours (формат OSM: 'Mo-Su 08:00-22:00'), cuisine — необов'язкові
     snap    RegExp — підтягує точні координати з OSM за назвою

   Переклади назв/описів — у i18n-dict.js.
   ============================================================ */

// Координати ТРЦ + невеликий зсув, щоб піни всередині не накладались
const MALL = [49.5752, 25.6388];
const J = n => [MALL[0] + (n % 4 - 1.5) * 0.00012, MALL[1] + (Math.floor(n / 4) - 1.5) * 0.00018];

const CURATED = [
  /* ---------- ТРЦ «Подоляни» ---------- */
  { id: 'c-podolyany', name: 'ТРЦ «Подоляни»', cat: 'shop', coords: MALL, snap: /подоляни/i, addr: 'вул. Текстильна, 28ч',
    desc: 'Найбільший торгово-розважальний центр Тернополя біля об\'їзної: магазини, їжа й розваги під одним дахом.',
    facts: ['Відкритий у 2007 році', 'Близько 50 тис. м², паркінг на ~1800 місць', 'Сільпо, Фокстрот, LC Waikiki, Reserved, Sinsay, Intersport та інші'] },
  { id: 'c-mall2', name: 'Подоляни Mall (нова черга)', cat: 'shop', coords: J(1), addr: 'вул. Текстильна, 28ч',
    desc: 'Нова будівля комплексу з панорамним фудкортом.',
    facts: ['Анонсовані KFC (перший у Тернополі), «Чорноморка», Pepco, New Yorker, CCC', 'Розважальний центр FlyKids', 'Відкриття було заплановане на 15 жовтня 2026 — перевірте, чи вже працює'] },
  { id: 'c-eskimos', name: 'Льодовий центр «Ескімос»', cat: 'see', coords: J(2), addr: 'ТРЦ «Подоляни»',
    desc: 'Всесезонний льодовий центр у «Подолянах».', facts: ['За даними сайту ТРЦ — єдиний у місті всесезонний'] },
  { id: 'c-silver', name: 'Більярд-боулінг клуб «Silver»', cat: 'see', coords: J(3), addr: 'ТРЦ «Подоляни»',
    desc: 'Боулінг і більярд для компанії.', facts: ['За даними сайту ТРЦ — найбільший у місті більярд-боулінг клуб'] },
  { id: 'c-miromax', name: 'Кінотеатр MiroMax', cat: 'see', coords: J(4), addr: 'ТРЦ «Подоляни»',
    desc: 'Багатозальний кінотеатр у торговому центрі.', facts: ['Поруч також 5D та 7D кінотеатри'] },
  { id: 'c-concert', name: 'Концерт-хол «Подоляни»', cat: 'see', coords: J(5), addr: 'ТРЦ «Подоляни»',
    desc: 'Зал для концертів, весіль, конференцій і виставок.', facts: ['Позиціонується як найбільший концерт-хол Західної України'] },
  { id: 'c-peperoni', name: 'Піцерія «Пепероні»', cat: 'eat', coords: J(6), addr: 'ТРЦ «Подоляни»', cuisine: 'італійська, піца',
    desc: 'Італійська піцерія в «Подолянах».', facts: [] },
  { id: 'c-silpo', name: 'Сільпо («Подоляни»)', cat: 'shop', coords: J(7), addr: 'ТРЦ «Подоляни»',
    desc: 'Супермаркет у торговому центрі.', facts: [] },
  { id: 'c-foxtrot', name: 'Фокстрот («Подоляни»)', cat: 'shop', coords: J(8), addr: 'ТРЦ «Подоляни»',
    desc: 'Магазин побутової техніки та електроніки.', facts: [] },
  { id: 'c-intersport', name: 'Intersport («Подоляни»)', cat: 'shop', coords: J(9), addr: 'ТРЦ «Подоляни»',
    desc: 'Спортивний одяг, взуття та інвентар.', facts: [] },
  { id: 'c-lcw', name: 'LC Waikiki («Подоляни»)', cat: 'shop', coords: J(10), addr: 'ТРЦ «Подоляни»',
    desc: 'Одяг для всієї родини.', facts: [] },

  /* ---------- кав'ярні й їжа ---------- */
  { id: 'c-cukerka', name: 'Кав\'ярня «Цукерка»', cat: 'cafe', coords: J(11), addr: 'вул. Текстильна, 28ч',
    desc: 'Кава, десерти, свіжа випічка; є комплексні обіди та сніданки.', facts: ['Також у ТРЦ «Подоляни» діє кондитерська «Цукерка»'] },
  { id: 'c-formiya', name: 'Кав\'ярня-піцерія «Формія»', cat: 'cafe', coords: [49.5717, 25.6373], addr: 'вул. Леся Курбаса, 2а', phone: '+38 (097) 920-64-05',
    desc: 'Кав\'ярня з піцою; відгуки хвалять торти на замовлення.', facts: [] },
  { id: 'c-dali', name: 'Dali. Pizza & Sushi', cat: 'eat', coords: [49.5698, 25.6419], addr: 'бульвар Дмитра Вишневецького, 1', phone: '+38 (097) 394-72-77', cuisine: 'піца, суші',
    desc: 'Піца й суші, є бронювання столиків і доставка.', facts: [] },
  { id: 'c-lavash', name: 'Пекарня «Лаваш»', cat: 'cafe', coords: [49.5731, 25.6380], addr: 'вул. Леся Курбаса, 3',
    desc: 'Пекарня зі свіжим хлібом і випічкою.', facts: [] },

  /* ---------- магазини біля дому ---------- */
  { id: 'c-atb2', name: 'АТБ (Курбаса, 2а)', cat: 'shop', coords: [49.5717, 25.6370], addr: 'вул. Леся Курбаса, 2а', hours: 'щодня 08:00–22:00',
    desc: 'Супермаркет біля початку вулиці Курбаса.', facts: [] },
  { id: 'c-smakolyk', name: 'Супермаркет «Смаколик» №10', cat: 'shop', coords: [49.5716, 25.6375], addr: 'вул. Леся Курбаса, 2а', hours: 'щодня 08:00–22:00',
    desc: 'Продуктовий супермаркет.', facts: [] },
  { id: 'c-atb7', name: 'АТБ (Курбаса, 7)', cat: 'shop', coords: [49.5730, 25.6424], addr: 'вул. Леся Курбаса, 7', hours: 'щодня 08:00–22:00',
    desc: 'Супермаркет біля «Подолян».', facts: [] },
  { id: 'c-blyzenko', name: 'Магазин «Близенько»', cat: 'shop', coords: [49.5729, 25.6424], addr: 'вул. Леся Курбаса, 7',
    desc: 'Мережевий магазин біля дому.', facts: [] },

  /* ---------- побачити й погуляти ---------- */
  { id: 'c-ioan', name: 'Храм апостола Іоана Богослова (ПЦУ)', cat: 'see', coords: [49.5721, 25.6418], addr: 'вул. Леся Курбаса, 6а',
    desc: 'Храм у самому серці району.', facts: [] },
  { id: 'c-vyshnevetskoho', name: 'Бульвар Дмитра Вишневецького', cat: 'walk', coords: [49.5708, 25.6412], addr: 'бульвар Дмитра Вишневецького',
    desc: 'Пішохідний бульвар, серце району: спокійна прогулянка між вулицями Курбаса та Симоненка.',
    facts: ['Реконструйований у 2015 році', 'Є фонтан, лавки та дитячий майданчик'] }
];
/* ============================================================
   i18n-dict.js — СЛОВНИК ПЕРЕКЛАДІВ.
   Кожен рядок: [українською (точно як у коді), англійською, польською]
   Щоб перекласти нове місце — додайте його назву, адресу, опис і факти сюди.
   ============================================================ */
const I18N_RULES = [
  /* ---------- інтерфейс ---------- */
  ["Аляска, Тернопіль — куди піти", "Alaska, Ternopil — where to go", "Alaska, Tarnopol — dokąd pójść"],
  ["Аляска · Тернопіль — куди піти", "Alaska · Ternopil — where to go", "Alaska · Tarnopol — dokąd pójść"],
  ["Де поїсти, де погуляти і що побачити в районі Аляска у Тернополі: інтерактивна карта з маршрутами.", "Where to eat, stroll and what to see in the Alaska district of Ternopil: an interactive map with routes.", "Gdzie zjeść, pospacerować i co zobaczyć na osiedlu Alaska w Tarnopolu: interaktywna mapa z trasami."],
  ["Здивуй мене", "Surprise me", "Zaskocz mnie"],
  ["Моя позиція як старт", "Use my location as start", "Moja pozycja jako start"],
  ["Моя позиція", "My location", "Moja pozycja"],
  ["Темна", "Dark", "Ciemny"], ["Світла", "Light", "Jasny"],
  ["Змінити тему", "Change theme", "Zmień motyw"],
  ["Карта", "Map", "Mapa"],
  ["Список місць", "List of places", "Lista miejsc"],
  ["Змінити висоту панелі", "Resize panel", "Zmień wysokość panelu"],
  ["Пошук", "Search", "Szukaj"],
  ["Пошук місць  ( / )", "Search places  ( / )", "Szukaj miejsc  ( / )"],
  ["Завантажую місця…", "Loading places…", "Ładuję miejsca…"],
  ["Ближчі", "Nearest", "Najbliższe"], ["А–Я", "A–Z", "A–Z"],
  ["До району", "To the district", "Do osiedla"],
  ["Старт", "Start", "Start"],
  ["Усе", "All", "Wszystko"], ["Відкрито зараз", "Open now", "Otwarte teraz"],
  ["Поїсти", "Eat", "Zjeść"], ["Кав'ярні", "Cafés", "Kawiarnie"], ["Бари", "Bars", "Bary"],
  ["Погуляти", "Stroll", "Spacer"], ["Побачити", "See", "Zobaczyć"], ["Магазини", "Shops", "Sklepy"],
  ["♥ Збережене", "♥ Saved", "♥ Zapisane"],
  ["← Усі місця", "← All places", "← Wszystkie miejsca"],
  ["Адреса", "Address", "Adres"], ["Кухня", "Cuisine", "Kuchnia"], ["Години", "Hours", "Godziny"],
  ["Телефон", "Phone", "Telefon"], ["Сайт", "Website", "Strona"],
  ["Пішки", "On foot", "Pieszo"], ["Велосипед", "Bike", "Rower"], ["Авто", "Car", "Samochód"],
  ["Прокладаю маршрут…", "Plotting route…", "Wyznaczam trasę…"],
  ["♥ Збережено", "♥ Saved", "♥ Zapisano"], ["♡ Зберегти", "♡ Save", "♡ Zapisz"], ["Зберегти", "Save", "Zapisz"],
  ["Поділитись", "Share", "Udostępnij"],
  ["відкрито", "open", "otwarte"], ["зачинено", "closed", "zamknięte"], ["добірка", "curated", "polecane"],
  ["Не вдалося прокласти маршрут. Спробуйте ще раз.", "Could not plot the route. Try again.", "Nie udało się wyznaczyć trasy. Spróbuj ponownie."],
  ["Немає з'єднання з інтернетом.", "No internet connection.", "Brak połączenia z internetem."],
  ["Немає з'єднання з інтернетом", "No internet connection", "Brak połączenia z internetem"],
  ["З'єднання відновлено", "Connection restored", "Połączenie przywrócone"],
  ["Посилання скопійовано", "Link copied", "Link skopiowany"],
  ["Старт — ваша позиція", "Start — your location", "Start — Twoja pozycja"],
  ["Дозвольте доступ до геолокації в налаштуваннях браузера", "Allow location access in your browser settings", "Zezwól na dostęp do lokalizacji w ustawieniach przeglądarki"],
  ["Не вдалося визначити позицію", "Could not determine your location", "Nie udało się ustalić pozycji"],
  ["Геолокація недоступна в цьому браузері", "Geolocation is not available in this browser", "Geolokalizacja jest niedostępna w tej przeglądarce"],
  ["Збережених місць ще немає — натисніть ♡ біля будь-якого.", "No saved places yet — tap ♡ next to any place.", "Brak zapisanych miejsc — dotknij ♡ przy dowolnym."],
  ["Нічого не знайдено.", "Nothing found.", "Nic nie znaleziono."],
  ["Показати ще", "Show more", "Pokaż więcej"],
  ["Не вдалося завантажити місця.", "Could not load places.", "Nie udało się załadować miejsc."],
  ["Повторити", "Retry", "Ponów"],
  /* фільтр відстані */
  ["до 500 м", "up to 500 m", "do 500 m"], ["до 1 км", "up to 1 km", "do 1 km"], ["до 2 км", "up to 2 km", "do 2 km"],

  /* ---------- добірка: назви, описи, факти ---------- */
  ["ТРЦ «Подоляни»", "Podolyany Mall", "CH „Podoliany”"],
  ["Найбільший торгово-розважальний центр Тернополя біля об'їзної: магазини, їжа й розваги під одним дахом.", "Ternopil's largest shopping and entertainment center by the ring road: shops, food and entertainment under one roof.", "Największe centrum handlowo-rozrywkowe Tarnopola przy obwodnicy: sklepy, jedzenie i rozrywka pod jednym dachem."],
  ["Відкритий у 2007 році", "Opened in 2007", "Otwarte w 2007 roku"],
  ["Близько 50 тис. м², паркінг на ~1800 місць", "About 50,000 m², parking for ~1,800 cars", "Ok. 50 tys. m², parking na ~1800 miejsc"],
  ["Сільпо, Фокстрот, LC Waikiki, Reserved, Sinsay, Intersport та інші", "Silpo, Foxtrot, LC Waikiki, Reserved, Sinsay, Intersport and others", "Silpo, Foxtrot, LC Waikiki, Reserved, Sinsay, Intersport i inne"],
  ["вул. Текстильна, 28ч", "Tekstylna St., 28ch", "ul. Tekstylna 28ch"],
  ["Подоляни Mall (нова черга)", "Podolyany Mall (new phase)", "Podoliany Mall (nowy etap)"],
  ["Нова будівля комплексу з панорамним фудкортом.", "New building of the complex with a panoramic food court.", "Nowy budynek kompleksu z panoramicznym food courtem."],
  ["Анонсовані KFC (перший у Тернополі), «Чорноморка», Pepco, New Yorker, CCC", "Announced: KFC (the first in Ternopil), Chornomorka, Pepco, New Yorker, CCC", "Zapowiedziane: KFC (pierwszy w Tarnopolu), „Czornomorka”, Pepco, New Yorker, CCC"],
  ["Розважальний центр FlyKids", "FlyKids entertainment center", "Centrum rozrywki FlyKids"],
  ["Відкриття було заплановане на 15 жовтня 2026 — перевірте, чи вже працює", "Opening was planned for 15 October 2026 — check whether it is already open", "Otwarcie planowano na 15 października 2026 — sprawdź, czy już działa"],
  ["Льодовий центр «Ескімос»", "Eskimo Ice Center", "Lodowisko „Eskimos”"],
  ["Всесезонний льодовий центр у «Подолянах».", "All-season ice center in Podolyany Mall.", "Całoroczne lodowisko w CH „Podoliany”."],
  ["За даними сайту ТРЦ — єдиний у місті всесезонний", "According to the mall's website — the only all-season one in the city", "Według strony centrum — jedyne całoroczne w mieście"],
  ["Більярд-боулінг клуб «Silver»", "Silver Billiards & Bowling Club", "Klub bilardowo-kręglarski „Silver”"],
  ["Боулінг і більярд для компанії.", "Bowling and billiards for groups.", "Kręgle i bilard dla towarzystwa."],
  ["За даними сайту ТРЦ — найбільший у місті більярд-боулінг клуб", "According to the mall's website — the city's largest billiards and bowling club", "Według strony centrum — największy w mieście klub bilardowo-kręglarski"],
  ["Кінотеатр MiroMax", "MiroMax Cinema", "Kino MiroMax"],
  ["Багатозальний кінотеатр у торговому центрі.", "Multiplex cinema in the shopping center.", "Wielosalowe kino w centrum handlowym."],
  ["Поруч також 5D та 7D кінотеатри", "There are also 5D and 7D cinemas nearby", "W pobliżu także kina 5D i 7D"],
  ["Концерт-хол «Подоляни»", "Podolyany Concert Hall", "Sala koncertowa „Podoliany”"],
  ["Зал для концертів, весіль, конференцій і виставок.", "Hall for concerts, weddings, conferences and exhibitions.", "Sala na koncerty, wesela, konferencje i wystawy."],
  ["Позиціонується як найбільший концерт-хол Західної України", "Billed as the largest concert hall in Western Ukraine", "Reklamowana jako największa sala koncertowa zachodniej Ukrainy"],
  ["Піцерія «Пепероні»", "Peperoni Pizzeria", "Pizzeria „Peperoni”"],
  ["італійська", "Italian", "włoska"], ["піца", "pizza", "pizza"], ["суші", "sushi", "sushi"],
  ["Італійська піцерія в «Подолянах».", "Italian pizzeria in Podolyany Mall.", "Włoska pizzeria w CH „Podoliany”."],
  ["Сільпо («Подоляни»)", "Silpo (Podolyany)", "Silpo („Podoliany”)"],
  ["Супермаркет у торговому центрі.", "Supermarket in the shopping center.", "Supermarket w centrum handlowym."],
  ["Фокстрот («Подоляни»)", "Foxtrot (Podolyany)", "Foxtrot („Podoliany”)"],
  ["Магазин побутової техніки та електроніки.", "Home appliances and electronics store.", "Sklep z AGD i elektroniką."],
  ["Intersport («Подоляни»)", "Intersport (Podolyany)", "Intersport („Podoliany”)"],
  ["Спортивний одяг, взуття та інвентар.", "Sportswear, footwear and equipment.", "Odzież sportowa, obuwie i sprzęt."],
  ["LC Waikiki («Подоляни»)", "LC Waikiki (Podolyany)", "LC Waikiki („Podoliany”)"],
  ["Одяг для всієї родини.", "Clothing for the whole family.", "Odzież dla całej rodziny."],
  ["Кав'ярня «Цукерка»", "Tsukerka Café", "Kawiarnia „Cukierka”"],
  ["Кава, десерти, свіжа випічка; є комплексні обіди та сніданки.", "Coffee, desserts, fresh pastries; set lunches and breakfasts available.", "Kawa, desery, świeże wypieki; są zestawy obiadowe i śniadania."],
  ["Також у ТРЦ «Подоляни» діє кондитерська «Цукерка»", "There is also a Tsukerka pastry shop in Podolyany Mall", "W CH „Podoliany” działa też cukiernia „Cukierka”"],
  ["Кав'ярня-піцерія «Формія»", "Formiya Café & Pizzeria", "Kawiarnia-pizzeria „Formia”"],
  ["Кав'ярня з піцою; відгуки хвалять торти на замовлення.", "Café with pizza; reviews praise the made-to-order cakes.", "Kawiarnia z pizzą; opinie chwalą torty na zamówienie."],
  ["вул. Леся Курбаса, 2а", "Les Kurbas St., 2a", "ul. Lesia Kurbasa 2a"],
  ["Піца й суші, є бронювання столиків і доставка.", "Pizza and sushi; table reservations and delivery available.", "Pizza i sushi; możliwa rezerwacja stolika i dostawa."],
  ["бульвар Дмитра Вишневецького, 1", "Dmytro Vyshnevetsky Blvd., 1", "bulwar Dmytra Wyszniewieckiego 1"],
  ["АТБ (Курбаса, 2а)", "ATB (Kurbas St., 2a)", "ATB (ul. Kurbasa 2a)"],
  ["Супермаркет біля початку вулиці Курбаса.", "Supermarket at the start of Kurbas Street.", "Supermarket na początku ulicy Kurbasa."],
  ["Супермаркет «Смаколик» №10", "Smakolyk Supermarket No. 10", "Supermarket „Smakolyk” nr 10"],
  ["Продуктовий супермаркет.", "Grocery supermarket.", "Supermarket spożywczy."],
  ["Пекарня «Лаваш»", "Lavash Bakery", "Piekarnia „Lawasz”"],
  ["Пекарня зі свіжим хлібом і випічкою.", "Bakery with fresh bread and pastries.", "Piekarnia ze świeżym chlebem i wypiekami."],
  ["вул. Леся Курбаса, 3", "Les Kurbas St., 3", "ul. Lesia Kurbasa 3"],
  ["АТБ (Курбаса, 7)", "ATB (Kurbas St., 7)", "ATB (ul. Kurbasa 7)"],
  ["Супермаркет біля «Подолян».", "Supermarket near Podolyany Mall.", "Supermarket przy CH „Podoliany”."],
  ["вул. Леся Курбаса, 7", "Les Kurbas St., 7", "ul. Lesia Kurbasa 7"],
  ["Магазин «Близенько»", "Blyzenko Store", "Sklep „Blyzenko”"],
  ["Мережевий магазин біля дому.", "Neighborhood chain store.", "Sieciowy sklep blisko domu."],
  ["Храм апостола Іоана Богослова (ПЦУ)", "Church of St. John the Theologian (OCU)", "Cerkiew św. Jana Teologa (PCU)"],
  ["Храм у самому серці району.", "A church in the very heart of the district.", "Cerkiew w samym sercu osiedla."],
  ["вул. Леся Курбаса, 6а", "Les Kurbas St., 6a", "ul. Lesia Kurbasa 6a"],
  ["Бульвар Дмитра Вишневецького", "Dmytro Vyshnevetsky Boulevard", "Bulwar Dmytra Wyszniewieckiego"],
  ["бульвар Дмитра Вишневецького", "Dmytro Vyshnevetsky Blvd.", "bulwar Dmytra Wyszniewieckiego"],
  ["Пішохідний бульвар, серце району: спокійна прогулянка між вулицями Курбаса та Симоненка.", "Pedestrian boulevard, the heart of the district: a calm walk between Kurbas and Symonenko streets.", "Deptak, serce osiedla: spokojny spacer między ulicami Kurbasa i Symonenki."],
  ["Реконструйований у 2015 році", "Reconstructed in 2015", "Zrewitalizowany w 2015 roku"],
  ["Є фонтан, лавки та дитячий майданчик", "Has a fountain, benches and a playground", "Jest fontanna, ławki i plac zabaw"]
];
