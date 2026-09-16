/**
 * PostCSS config สำหรับ Tailwind CSS v4 บน Next.js
 * (แทนที่ @tailwindcss/vite ที่ใช้ตอนเป็น Vite)
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
