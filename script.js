// ====== ВСТАВЬ СВОЙ API-КЛЮЧ СЮДА ======
const API_KEY = "caab2c0716cc2c51c5a8692df915ef79";

document.getElementById('checkBtn').addEventListener('click', async () => {
    const lat = document.getElementById('latInput').value;
    const lon = document.getElementById('lonInput').value;
    const resultDiv = document.getElementById('result');

    if (!lat || !lon) {
        resultDiv.innerHTML = '<p>Введите координаты поля.</p>';
        resultDiv.className = 'error';
        resultDiv.style.display = 'block';
        return;
    }

    resultDiv.innerHTML = '<p>Загрузка данных...</p>';
    resultDiv.className = '';
    resultDiv.style.display = 'block';

    try {
        // Запрос к OpenWeatherMap (текущая погода + прогноз на 5 дней по 3 часа)
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }
        const data = await response.json();

        // Анализ данных по алгоритму Smith Period
        // Берем прогноз на ближайшие 2 дня (по 3 часа = 8 записей в день, итого 16)
        const list = data.list;
        const suitableHours = []; // Часы, где t >= 10 и humidity >= 90

        // Группируем по дням, считая количество подходящих часов
        const dailySuitable = {};
        
        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            const temp = item.main.temp;
            const humidity = item.main.humidity;

            // Условие Smith Period: t >= 10°C и влажность >= 90%
            if (temp >= 10 && humidity >= 90) {
                if (!dailySuitable[date]) dailySuitable[date] = 0;
                dailySuitable[date] += 3; // Каждая запись = 3 часа
            } else {
                if (!dailySuitable[date]) dailySuitable[date] = 0;
            }
        });

        const dates = Object.keys(dailySuitable).sort();
        let riskDetected = false;
        let riskMessage = '';

        // Проверяем пары дней: 1-й день >= 11 часов, 2-й день >= 10 часов
        for (let i = 0; i < dates.length - 1; i++) {
            const day1 = dates[i];
            const day2 = dates[i + 1];
            const hours1 = dailySuitable[day1];
            const hours2 = dailySuitable[day2];

            if (hours1 >= 11 && hours2 >= 10) {
                riskDetected = true;
                riskMessage = `⚠️ ВЫСОКИЙ РИСК: Smith Period обнаружен с ${day1} по ${day2}. Рекомендуется профилактическая обработка.`;
                break;
            }
        }

        // Формируем вывод
        if (riskDetected) {
            resultDiv.innerHTML = `<p class="warning">${riskMessage}</p>`;
            resultDiv.className = 'warning';
        } else {
            // Показываем статистику по дням для наглядности
            let statsHtml = '<p>✅ Риск фитофтороза НИЗКИЙ.</p><p><b>Условия по дням (часы с влажностью ≥90% и t ≥10°C):</b></p><ul>';
            dates.forEach(d => {
                statsHtml += `<li>${d}: ${dailySuitable[d]} часов</li>`;
            });
            statsHtml += '</ul><p>Порог для Smith Period: 11 ч (день 1) + 10 ч (день 2).</p>';
            resultDiv.innerHTML = statsHtml;
            resultDiv.className = 'success';
        }

    } catch (error) {
        resultDiv.innerHTML = `<p class="error">Ошибка: ${error.message}</p>`;
        resultDiv.className = 'error';
        console.error('Детали ошибки:', error);
    }
});
