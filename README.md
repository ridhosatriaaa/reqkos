# ReqKos

Aplikasi rekomendasi kost berbasis data dan web interaktif.

## Teknologi

- Python
- FastAPI
- Pandas / NumPy
- React + Vite
- Leaflet
- Tailwind CSS

## Struktur Project

- `app.py` : backend Python dan logika rekomendasi
- `kampus20.csv` : data kampus
- `kost100.csv` : data kost
- `frontend/` : aplikasi frontend React
- `requirements.txt` : dependency Python

## Persiapan

Pastikan komputer Anda sudah memiliki:

- Python 3.10 atau lebih baru
- Node.js LTS
- npm

## 1) Install dependency backend

Di terminal, jalankan di folder project utama:

```bash
pip install -r requirements.txt
```

## 2) Install dependency frontend

```bash
cd frontend
npm install
```

## 3) Jalankan backend Python

Kembali ke folder project utama:

```bash
python app.py --mode api
```

Backend akan berjalan di:

```text
http://localhost:8000
```

## 4) Jalankan frontend React

Buka terminal baru, lalu jalankan:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

Frontend akan berjalan di:

```text
http://localhost:3000
```

## 5) Buka aplikasi

Buka browser dan akses:

```text
http://localhost:3000
```

## Endpoint API penting

- Health check: `http://localhost:8000/api/health`
- Daftar kampus: `http://localhost:8000/api/campuses`
- Rekomendasi kost: `http://localhost:8000/api/recommendations?selected_campus=...`

## Catatan

- Jika backend tidak bisa berjalan, pastikan `app.py` tetap berada di root project.
- Jika frontend tidak tampil, pastikan backend sudah aktif terlebih dahulu.
- Jika port 3000 sudah dipakai, ubah menjadi port lain seperti `npm run dev -- --host 0.0.0.0 --port 3001`.

## Build produksi frontend

Untuk build versi production:

```bash
cd frontend
npm run build
```

## License

Project ini dibuat untuk kebutuhan demo / tugas / pengembangan lokal.
