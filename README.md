# ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์

ระบบบริหารจัดการและติดตามกระบวนการจัดส่ง ตรวจสอบ และพิมพ์ข้อสอบ
คณะวิทยาศาสตร์ ตามข้อกำหนด URS และ ER-Diagram

**สถานะ:** โหมดสาธิต — ข้อมูลเก็บใน localStorage ของเบราว์เซอร์
(โครงสร้างเตรียมเชื่อมต่อ Supabase ไว้แล้ว ดู [supabase/README.md](supabase/README.md))

## การเริ่มต้นใช้งาน

ต้องมี Node.js 18.18 ขึ้นไป

```bash
npm install        # ติดตั้ง dependencies
npm run dev        # รันโหมดพัฒนา → http://localhost:3000
npm run build      # สร้าง production build
npm run start      # รัน production build
npm run lint       # ตรวจ TypeScript
```

## บัญชีทดลอง (โหมดสาธิต)

| ชื่อผู้ใช้ | บทบาท | หน้าจอ |
|---|---|---|
| `somchai.t` | Teacher (อาจารย์) | จัดส่งข้อสอบ, ติดตามสถานะ, เพิ่มรายวิชา |
| `waree.p` | Teacher (อาจารย์) | เช่นเดียวกัน |
| `av.staff1` | AudioVisual (โสตทัศน์) | ตรวจสอบข้อสอบ, จัดพิมพ์, ส่งมอบ |
| `ops.officer` | Operations (ดำเนินการสอบ) | รับมอบซอง, จัดเก็บห้องมั่นคง |
| `admin.sci` | Admin | จัดการผู้ใช้, Audit Logs, นโยบายความปลอดภัย |

ล็อกอินได้ทั้งพิมพ์ชื่อผู้ใช้ (รหัสผ่านยังไม่ตรวจจริง) หรือกดปุ่ม Quick Login

## โครงสร้างโปรเจกต์

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout — ภาษาไทย, ฟอนต์, metadata
│   ├── page.tsx            # หน้าแรก → AppShell (mounted guard)
│   └── globals.css         # ธีม (Tailwind v4) + สไตล์สั่งพิมพ์
├── components/
│   ├── AppShell.tsx        # แกนกลาง — state หลัก + handlers + สลับหน้าตามบทบาท
│   ├── auth/LoginPage.tsx  # หน้าล็อกอิน
│   ├── layout/Header.tsx   # แถบหัวเว็บ + แจ้งเตือน + สลับบัญชี
│   ├── views/              # หน้าจอตามบทบาท (Teacher/AudioVisual/Operations/Admin)
│   ├── modals/             # อัปโหลดข้อสอบ, ตัวอย่างข้อสอบ, ใบปะหน้าซอง
│   └── ui/                 # UI primitives (shadcn-style)
├── hooks/                  # useExams, useUsers, ... (persist ลง localStorage)
├── data/mockData.ts        # ข้อมูลตัวอย่าง (seed)
├── lib/
│   ├── repositories/       # ชั้นจัดเก็บข้อมูล — interface + localStorage impl
│   ├── supabase/           # placeholder client + database types
│   ├── statusLabels.ts     # ข้อความ/สีของสถานะข้อสอบ 8 สถานะ
│   └── utils.ts            # cn() helper
└── types/entities.ts       # Entity ทั้งหมดของระบบ
supabase/                   # schema.sql + คู่มือเชื่อมต่อ
```

ทุก component มีคอมเมนต์ภาษาไทยด้านบนไฟล์อธิบาย "หน้าที่ของหน้านี้ / ผู้ใช้งาน / ฟีเจอร์หลัก"

## เทคโนโลยี

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + shadcn-style UI primitives
- ฟอนต์ Anuphan (หัวข้อ) / Sarabun (เนื้อหา) ผ่าน `next/font`

## แผนต่อยอด: เชื่อมต่อ Supabase

โครงสร้างแยกชั้นข้อมูล (repository pattern) ไว้รองรับแล้ว — ขั้นตอนเชื่อมต่อจริง
ดูที่ [supabase/README.md](supabase/README.md): ตาราง + RLS พร้อมใน `supabase/schema.sql`
สลับ implementation ที่จุดเดียว (`src/lib/repositories/index.ts`)
