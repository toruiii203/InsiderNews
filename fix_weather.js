const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/header.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/setWeather\(\\\$\{\\\$\}\{emoji\} \{\w+\}C\)/, 'setWeather(emoji + " " + temp + "°C")');
content = content.replace(/setWeather\(\\\$\{\"\\\$\"\}\{emoji\} \{\w+\}C\)/, 'setWeather(emoji + " " + temp + "°C")');
content = content.replace(/setWeather\(.*emoji.*temp.*C\)/, 'setWeather(emoji + " " + temp + "°C")');
fs.writeFileSync(file, content);
