const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/header.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /useEffect\(\(\) => \{\s+async function fetchLocation\(\) \{[\s\S]*?fetchLocation\(\)\s+\}, \[\]\)/;
const replacement = 
  useEffect(() => {
    async function fetchLocation() {
      try {
        const locRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!locRes.ok) return;
        const loc = await locRes.json();
        if (loc.city) setCity(loc.city);
        if (loc.latitude && loc.longitude) {
          const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current_weather=true");
          if (weatherRes.ok) {
            const w = await weatherRes.json();
            const code = w.current_weather.weathercode;
            const temp = w.current_weather.temperature;
            let emoji = "??";
            if (code === 1 || code === 2) emoji = "?";
            else if (code === 3) emoji = "??";
            else if (code >= 45 && code <= 48) emoji = "???";
            else if (code >= 51 && code <= 67) emoji = "???";
            else if (code >= 71 && code <= 86) emoji = "??";
            else if (code >= 95) emoji = "??";
            setWeather(emoji + " " + temp + "°C");
          }
        }
      } catch (e) {
        setCity("Unknown");
      }
    }
    fetchLocation();
  }, []);

content = content.replace(regex, replacement.trim());
fs.writeFileSync(file, content);
