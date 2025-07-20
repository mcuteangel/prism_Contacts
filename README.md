# Prism Contacts

مدیریت هوشمند و چندسکویی مخاطبین (PWA، دسکتاپ، موبایل)

---

## امکانات کلیدی
- جستجو و CRUD کامل مخاطبین و گروه‌ها
- فیلدهای سفارشی و گروه‌بندی پیشرفته
- تشخیص و ادغام مخاطب تکراری (هوشمند و فازی)
- خروجی و ورودی CSV/JSON
- داشبورد آماری و نمودار
- تم تاریک/روشن با ذخیره‌سازی
- کنترل دسترسی چندکاربره (مدیر/عادی)
- نصب به عنوان PWA، دسکتاپ (Tauri)، موبایل (Capacitor)

---

## نصب و اجرا (وب)
```bash
pnpm install
pnpm run dev
```
سپس به آدرس http://localhost:5173 (یا پورت اعلام‌شده) مراجعه کنید.

---

## ساخت نسخه نهایی (Production Build)
```bash
pnpm run build
```
خروجی در پوشه `dist` قرار می‌گیرد.

---

## نصب به عنوان PWA
پس از build، پروژه را روی سرور (مثلاً با `pnpm run preview`) اجرا کنید و در مرورگر گزینه "Add to Home Screen" یا "Install App" را انتخاب کنید.

---

## نسخه دسکتاپ (Tauri)
### پیش‌نیازها:
- Rust و ابزارهای build (برای لینوکس: `sudo apt install build-essential libwebkit2gtk-4.0-dev`)
- Node.js و pnpm

### مراحل:
```bash
pnpm tauri build
```
خروجی در مسیر `src-tauri/target/release/bundle` (deb, rpm, AppImage) قرار می‌گیرد.

---

## نسخه موبایل (Capacitor)
### پیش‌نیازها:
- Node.js و pnpm
- Android Studio (برای build اندروید)

### مراحل:
```bash
pnpm run build
npx cap sync android
npx cap open android
```
سپس پروژه را در Android Studio اجرا و build کنید.

---

## توسعه و تست
- تست کامل نقش‌ها، امکانات هوشمند، تم و خروجی/ورودی داده انجام شده است.
- برای توسعه بیشتر، کدها کاملاً ماژولار و قابل گسترش هستند.

---

## مشارکت و توسعه
پیشنهادات و pull requestها خوش‌آمدند!

---

## لایسنس
MIT
