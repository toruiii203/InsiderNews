const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/header.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /useEffect\(\(\) => \{\s+async function fetchLocation\(\) \{[\s\S]*?fetchLocation\(\)\s+\}, \[\]\)/;
const replacement = '  useEffect(() => {\\n    async function fetchLocation() {\\n      try {\\n        const locRes = await fetch("https://get.geojs.io/v1/ip/geo.json");\\n        if (!locRes.ok) return;\\n        const loc = await locRes.json();\\n        if (loc.city) setCity(loc.city);\\n        if (loc.latitude && loc.longitude) {\\n          const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current_weather=true");\\n          if (weatherRes.ok) {\\n            const w = await weatherRes.json();\\n            const code = w.current_weather.weathercode;\\n            const temp = w.current_weather.temperature;\\n            let emoji = "??";\\n            if (code === 1 || code === 2) emoji = "?";\\n            else if (code === 3) emoji = "??";\\n            else if (code >= 45 && code <= 48) emoji = "???";\\n            else if (code >= 51 && code <= 67) emoji = "???";\\n            else if (code >= 71 && code <= 86) emoji = "??";\\n            else if (code >= 95) emoji = "??";\\n            setWeather(emoji + " " + temp + "°C");\\n          }\\n        }\\n      } catch (e) {\\n        setCity("Unknown");\\n      }\\n    }\\n    fetchLocation();\\n  }, [])';

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
