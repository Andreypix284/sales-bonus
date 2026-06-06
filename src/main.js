/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;
    const discountDecimal = discount / 100;  // Переводим скидку из процентов в десятичное число
    const fullPrice = sale_price * quantity;    // Считаем полную стоимость без учёта скидки
    const revenue = fullPrice * (1 - discountDecimal);     // Вычисляем итоговую выручку с учётом скидки
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index === 0) {
        return 0.15;                  // Первое место (наибольшая прибыль) — 15%
    } else if (index === 1 || index === 2) {
        return 0.10;           // Второе и третье место — 10%
    } else if (index === total - 1) {
        return 0;      // Последнее место — 0%
    } else {
        return 0.05;   // Все остальные продавцы — 5%
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
*/
function analyzeSalesData(data, options) {      //Объявление функции с двумя параметрами.
    // @TODO: Проверка входных данных
    // @TODO: Проверка наличия опций
    // @TODO: Подготовка промежуточных данных для сбора статистики
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    // @TODO: Расчет выручки и прибыли для каждого продавца
    // @TODO: Сортировка продавцов по прибыли
    // @TODO: Назначение премий на основе ранжирования
    // @TODO: Подготовка итоговой коллекции с нужными полями
    
    //Проверка продавцов
    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) { 
        throw new Error('Некорректные входные данные о продавцах');
    }
    //Проверка товаров
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Некорректные входные данные о продуктах');
    }
    //Проверка записей о покупках
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные о продажах');
    }
    //Проверка наличия опций (функций)
    if (!options || typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
        throw new Error('Необходимые функции для расчетов не переданы');
    }
    //Деструктуризация опций
    const { calculateRevenue, calculateBonus } = options;
    //Инициализация статистики продавцов
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    //Индексация продавцов
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    //Индексация товаров
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));
    //Обработка каждой записи о покупке
    data.purchase_records.forEach(record => {
        //Увеличение счётчика продаж продавца
        const seller = sellerIndex[record.seller_id];
        if (seller) {
            seller.sales_count += 1;
        }
        //Обработка товаров внутри записи
        record.items.forEach(item => {
            // Поиск товара по SKU
            const product = productIndex[item.sku];
            //Проверка существования продавца и товара
            if (seller && product) {
                // Расчёт себестоимости
                const cost = product.purchase_price * item.quantity;
                //Расчёт выручки (передаём в callback)
                const revenue = calculateRevenue(item, product);
                //Расчёт прибыли за этот товар
                const itemProfit = revenue - cost;
                //Накопление выручки продавца
                seller.revenue = +(seller.revenue + revenue).toFixed(2);
                //Накопление прибыли продавца
                seller.profit = seller.profit + itemProfit;
                //Учёт проданных товаров по SKU
                if (!seller.products_sold[item.sku]) {
                    seller.products_sold[item.sku] = 0;
                }
                seller.products_sold[item.sku] += item.quantity;
            }
        });
    });
    //Сортировка продавцов по убыванию прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // Количество продавцов
    const totalSellers = sellerStats.length;
    //Расчёт бонуса и топ‑товаров для каждого продавца
    sellerStats.forEach((seller, index) => {
        //Округление прибыли
        seller.profit = +seller.profit.toFixed(2);
        //Расчёт бонуса через callback
        seller.bonus = calculateBonus(index, totalSellers, seller);
        //Формирование топ‑10 товаров
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });
    //Формирование итогового возвращаемого массива
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
