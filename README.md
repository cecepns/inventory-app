# Inventory Siswa App

Fullstack aplikasi inventory + produksi:
- Frontend: React Vite PWA (JSX), TailwindCSS, Lucide icons.
- Backend: Express.js + MySQL dalam satu file `server.js`.

## Fitur
- Kontrol stock
- Planning / perencanaan produksi
- Monitoring produksi (efisiensi)
- Analisis & pelaporan (dashboard)
- Manajemen user dan hak akses fitur (role admin/user + feature allowlist)

## Catatan Implementasi
- Semua endpoint list menggunakan paginasi API (`limit` maksimal 10).
- Semua modul punya search server-side.
- Frontend memakai input search dengan debounce.
- Form add/edit semua modul menggunakan modal dan label pada tiap input.
- Sidebar responsif dan dapat collapse di mobile.

## Menjalankan Backend
1. Copy `backend/.env.example` ke `backend/.env` lalu isi koneksi MySQL.
2. Buat database MySQL: `inventory_app` (atau sesuai `DB_NAME`).
3. Jalankan:
   - `cd backend`
   - `npm install`
   - `npm run dev`

Default admin otomatis dibuat:
- username: `admin`
- password: `admin123` (bisa diubah via env sebelum server start pertama)

## Menjalankan Frontend
1. Copy `frontend/.env.example` ke `frontend/.env`.
2. Jalankan:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Build
- Frontend: `cd frontend && npm run build`
# inventory-app
