# API Documentation — IPB AI Repository

**Base URL (production):** `https://your-domain/api/v1`  
**Base URL (lokal):** `http://localhost:8001/api/v1`  
**Versi:** `1.0.0`  
**Diperbarui:** Maret 2026

---

## Daftar Isi

1. [Autentikasi & JWT](#1-autentikasi--jwt)
2. [Endpoint Auth](#2-endpoint-auth)
3. [Endpoint Chat](#3-endpoint-chat)
4. [Endpoint Sessions](#4-endpoint-sessions)
5. [Endpoint Master Data](#5-endpoint-master-data)
6. [Health Check](#6-health-check)
7. [Error Responses Umum](#7-error-responses-umum)
8. [Frontend Integration Guide](#8-frontend-integration-guide)

---

## 1. Autentikasi & JWT

Semua endpoint (kecuali `POST /auth/login` dan `GET /health`) membutuhkan JWT token yang dikirim via header:

```http
Authorization: Bearer <access_token>
```

### Cara mendapatkan token

Login via `POST /auth/login` menggunakan credentials SSO IPB. Server memverifikasi ke IPB API, menyimpan data mahasiswa ke database, lalu mengembalikan JWT yang ditandatangani server ini (bukan JWT dari IPB).

### Masa berlaku token

Token berlaku **7 hari** (10.080 menit). Frontend harus menangani kasus token expired dengan mengarahkan user kembali ke halaman login.

### Format error autentikasi

```json
{ "detail": "Not authenticated" }         // Tidak ada token (403)
{ "detail": "Token tidak valid: ..." }     // Token invalid/expired (401)
{ "detail": "User tidak ditemukan. ..." }  // User dihapus dari DB (401)
```

---

## 2. Endpoint Auth

### 2.1 Login Mahasiswa

Autentikasi via SSO IPB. Jika berhasil, data mahasiswa disimpan/diperbarui di database dan JWT server dikembalikan.

**`POST /auth/login`**

**Request Body:**
```json
{
  "username": "krs001",
  "password": "teriN45!"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `username` | `string` | Ya | Username SSO IPB (NIM atau username mahasiswa) |
| `password` | `string` | Ya | Password SSO IPB |

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "username": "krs001",
    "nim": "Z14110001",
    "nama": "Budi Santoso",
    "email": "budi@apps.ipb.ac.id",
    "mayor": "Ilmu Komputer",
    "kode_mayor": "M03",
    "jenjang": "S1",
    "tahun_masuk": 2020,
    "mahasiswa_id": 324826,
    "orang_id": 481083
  }
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `access_token` | `string` | JWT untuk digunakan di header `Authorization` |
| `token_type` | `string` | Selalu `"bearer"` |
| `user.username` | `string` | Username SSO IPB |
| `user.nim` | `string\|null` | Nomor Induk Mahasiswa |
| `user.nama` | `string\|null` | Nama lengkap |
| `user.email` | `string\|null` | Email IPB (dari JWT payload IPB) |
| `user.mayor` | `string\|null` | Nama program studi |
| `user.kode_mayor` | `string\|null` | Kode program studi (mis. `"M03"`) |
| `user.jenjang` | `string\|null` | Jenjang studi: `"S1"`, `"S2"`, `"S3"` |
| `user.tahun_masuk` | `integer\|null` | Tahun masuk IPB |
| `user.mahasiswa_id` | `integer\|null` | ID mahasiswa dari sistem IPB |
| `user.orang_id` | `integer\|null` | ID orang dari JWT IPB |

**Response `401 Unauthorized`:**
```json
{ "detail": "Username atau password salah" }
```

**Response `502 Bad Gateway`:**
```json
{ "detail": "IPB authentication service is unreachable" }
```

---

### 2.2 Get Profil User Saat Ini

Ambil data profil user yang sedang login berdasarkan JWT.

**`GET /auth/me`**

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response `200 OK`:** *(schema sama dengan `user` object di response login)*
```json
{
  "username": "krs001",
  "nim": "Z14110001",
  "nama": "Budi Santoso",
  "email": "budi@apps.ipb.ac.id",
  "mayor": "Ilmu Komputer",
  "kode_mayor": "M03",
  "jenjang": "S1",
  "tahun_masuk": 2020,
  "mahasiswa_id": 324826,
  "orang_id": 481083
}
```

**Response `401 Unauthorized`:**
```json
{ "detail": "Token tidak valid: ..." }
```

---

## 3. Endpoint Chat

### 3.1 Kirim Pesan

Endpoint utama untuk berinteraksi dengan AI. Memulai sesi baru jika `session_id` tidak diberikan.

**`POST /chat/send`**

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body — Semua Field:**

| Field | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `query` | `string` | **Ya** | Pertanyaan / perintah user (1–2000 karakter) |
| `session_id` | `integer\|null` | Tidak | ID sesi yang dilanjutkan. `null` atau tidak dikirim = sesi baru |
| `selected_paper_ids` | `UUID[]` | Tidak | Daftar UUID paper yang dipilih manual sebagai konteks |
| `faculty` | `string` | Tidak | Filter nama fakultas (partial match) |
| `department` | `string` | Tidak | Filter nama departemen (partial match) |
| `document_type` | `string` | Tidak | Filter jenis: `"Skripsi"`, `"Tesis"`, `"Disertasi"` |
| `year` | `integer` | Tidak | Filter tahun terbit (exact match) |
| `year_range` | `object` | Tidak | Filter rentang tahun: `{ "start": 2020, "end": 2024 }` |

> **Catatan filter:** Jika `faculty`, `department`, `document_type`, `year`, atau `year_range` dikirim, filter tersebut **menggantikan** filter otomatis dari AI intent. `selected_paper_ids` juga melewati proses pencarian vektor.

**Contoh Request — Sesi Baru:**
```json
{ "query": "Carikan penelitian tentang ketahanan pangan" }
```

**Contoh Request — Lanjutkan Sesi:**
```json
{
  "query": "Jelaskan lebih detail tentang penelitian pertama",
  "session_id": 66
}
```

**Contoh Request — Dengan Filter:**
```json
{
  "query": "skripsi machine learning terbaru",
  "document_type": "Skripsi",
  "year_range": { "start": 2022, "end": 2024 }
}
```

**Contoh Request — Paper Dipilih Manual:**
```json
{
  "query": "Apa kesimpulan dari penelitian ini?",
  "session_id": 66,
  "selected_paper_ids": ["c19edcd1-93d8-4abb-bc6c-058a02ee8c1c"]
}
```

**Response `200 OK`:**
```json
{
  "session_id": 67,
  "message_id": 134,
  "ai_response": "Berdasarkan penelitian yang tersedia di repositori IPB...",
  "references": [
    {
      "rank": 1,
      "paper_id": "c19edcd1-93d8-4abb-bc6c-058a02ee8c1c",
      "title": "Machine Learning untuk Prediksi Produksi Padi di Indonesia",
      "authors": "Budi Santoso, Siti Rahayu",
      "year": 2023,
      "faculty": "Fakultas Pertanian",
      "department": "Agronomi dan Hortikultura",
      "type": "Skripsi",
      "abstract": "Penelitian ini bertujuan untuk...",
      "keywords": "machine learning, padi, produksi, prediksi",
      "url": "https://repository.ipb.ac.id/handle/123456789/...",
      "relevance_score": 0.8734
    }
  ],
  "metadata": {
    "query_type": "informational",
    "total_papers_found": 1,
    "search_duration_ms": 312,
    "rerank_duration_ms": 145,
    "llm_latency_ms": 2145,
    "total_tokens": 1872
  }
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `session_id` | `integer` | ID sesi (baru dibuat atau yang dilanjutkan) |
| `message_id` | `integer` | ID pesan respons AI |
| `ai_response` | `string` | Teks respons dari AI |
| `references` | `array` | Daftar paper referensi (kosong untuk query chitchat) |
| `references[].rank` | `integer` | Urutan relevansi (1 = paling relevan) |
| `references[].relevance_score` | `float` | Skor relevansi (0.0–1.0) |
| `metadata.query_type` | `string` | `navigational`, `informational`, `follow_up`, `chitchat` |
| `metadata.total_tokens` | `integer` | Total token OpenAI (0 untuk chitchat) |

---

## 4. Endpoint Sessions

### 4.1 List Semua Sesi User

**`GET /sessions/`**

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `limit` | `integer` | `50` | Maks jumlah sesi dikembalikan |

**Response `200 OK`:**
```json
[
  {
    "id": 67,
    "username": "krs001",
    "title": "Carikan penelitian tentang ketahanan pangan",
    "created_at": "2026-03-15T10:30:00.000000",
    "updated_at": "2026-03-15T10:35:22.819797"
  }
]
```

> `title` diisi otomatis dari query pertama dalam sesi.

---

### 4.2 Get Detail Sesi (Riwayat Pesan)

**`GET /sessions/{session_id}`**

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response `200 OK`:**
```json
{
  "id": 67,
  "username": "krs001",
  "title": "Carikan penelitian tentang ketahanan pangan",
  "created_at": "2026-03-15T10:30:00.000000",
  "updated_at": "2026-03-15T10:35:22.819797",
  "messages": [
    {
      "id": 133,
      "session_id": 67,
      "role": "user",
      "content": "Carikan penelitian tentang ketahanan pangan",
      "created_at": "2026-03-15T10:30:00.000000",
      "references": []
    },
    {
      "id": 134,
      "session_id": 67,
      "role": "assistant",
      "content": "Berdasarkan penelitian yang tersedia...",
      "created_at": "2026-03-15T10:30:05.000000",
      "references": [
        {
          "rank": 1,
          "paper_id": "c19edcd1-93d8-4abb-bc6c-058a02ee8c1c",
          "title": "...",
          "relevance_score": 0.8734
        }
      ]
    }
  ]
}
```

**Response `403 Forbidden`:** Sesi milik user lain.  
**Response `404 Not Found`:** Sesi tidak ditemukan.

---

### 4.3 Hapus Sesi

**`DELETE /sessions/{session_id}`**

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response `200 OK`:**
```json
{ "message": "Session deleted successfully" }
```

---

## 5. Endpoint Master Data

Digunakan untuk mengisi dropdown/opsi filter di frontend. Semua endpoint membutuhkan JWT.

### 5.1 Daftar Fakultas

**`GET /master/faculties`**

**Response `200 OK`:** Array of strings
```json
[
  "Fakultas Ekonomi dan Manajemen",
  "Fakultas Pertanian",
  "Fakultas Matematika dan IPA",
  "Fakultas Teknologi Pertanian"
]
```

### 5.2 Daftar Departemen

**`GET /master/departments`**

**Response `200 OK`:** Array of strings
```json
[
  "Agronomi dan Hortikultura",
  "Ilmu Komputer",
  "Statistika",
  "Teknologi Pangan"
]
```

---

## 6. Health Check

**`GET /health`** *(tidak butuh autentikasi)*

**Response `200 OK`:**
```json
{ "status": "healthy" }
```

---

## 7. Error Responses Umum

| HTTP Status | Kapan terjadi |
|---|---|
| `400 Bad Request` | Field wajib kosong atau format salah |
| `401 Unauthorized` | Token expired, tidak valid, atau user tidak ditemukan |
| `403 Forbidden` | Tidak ada token / akses ke resource milik user lain |
| `404 Not Found` | Resource tidak ditemukan |
| `422 Unprocessable Entity` | Validasi Pydantic gagal (mis. body kosong di login) |
| `500 Internal Server Error` | Error server tak terduga |
| `502 Bad Gateway` | IPB API atau OpenAI tidak bisa dijangkau |

---

## 8. Frontend Integration Guide

Panduan ini ditujukan untuk developer frontend (React, Vue, Next.js, dll.) yang mengintegrasikan dengan API ini.

---

### 8.1 Auth Flow — Gambaran Umum

```
User input username & password
         │
         ▼
POST /api/v1/auth/login
         │
    200 OK ──► Simpan access_token + data user
         │          (localStorage / Zustand / Pinia)
         │
    401 ──────► Tampilkan pesan "Username atau password salah"
    502 ──────► Tampilkan pesan "Layanan IPB sedang tidak tersedia"
```

Token berlaku **7 hari**. Tidak ada refresh token — jika expired, user harus login ulang.

---

### 8.2 Menyimpan & Menggunakan Token

#### Simpan saat login

```javascript
// Setelah login berhasil
const { access_token, user } = await response.json()

localStorage.setItem('token', access_token)
localStorage.setItem('user', JSON.stringify(user))
```

#### Hapus saat logout

```javascript
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // redirect ke /login
}
```

#### Kirim di setiap request (axios interceptor)

```javascript
// axios instance rekomendasi
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8001/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

### 8.3 Contoh Implementasi Login

```javascript
async function login(username, password) {
  try {
    const res = await fetch('http://localhost:8001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.status === 401) {
      throw new Error('Username atau password salah')
    }
    if (res.status === 502) {
      throw new Error('Layanan IPB sedang tidak tersedia, coba lagi nanti')
    }
    if (!res.ok) {
      throw new Error('Login gagal, silakan coba lagi')
    }

    const data = await res.json()
    // data = { access_token, token_type, user: { username, nim, nama, ... } }

    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))

    return data.user
  } catch (err) {
    throw err
  }
}
```

---

### 8.4 Cek Status Login (Route Guard)

```javascript
function isLoggedIn() {
  const token = localStorage.getItem('token')
  if (!token) return false

  // Decode payload JWT (tanpa verifikasi signature — hanya untuk cek expiry di client)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const isExpired = payload.exp * 1000 < Date.now()
    if (isExpired) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return false
    }
    return true
  } catch {
    return false
  }
}
```

> **Catatan:** Verifikasi sesungguhnya tetap dilakukan server. Pengecekan di atas hanya untuk UX (hindari request yang pasti gagal).

---

### 8.5 Menampilkan Data Profil User

Setelah login, data user langsung tersedia dari response. Gunakan `GET /auth/me` hanya jika perlu refresh data terbaru (mis. setelah app reload).

```javascript
// Ambil user dari localStorage (sudah ada sejak login)
const user = JSON.parse(localStorage.getItem('user'))

// Atau fetch ulang dari API
async function getProfile() {
  const res = await api.get('/auth/me')
  return res.data
  // { username, nim, nama, email, mayor, kode_mayor, jenjang, tahun_masuk, mahasiswa_id, orang_id }
}
```

**Field yang tersedia untuk ditampilkan di UI:**

| Field | Contoh | Keterangan |
|---|---|---|
| `nama` | `"Budi Santoso"` | Nama lengkap untuk greeting |
| `nim` | `"Z14110001"` | NIM untuk info profil |
| `email` | `"budi@apps.ipb.ac.id"` | Email IPB |
| `mayor` | `"Ilmu Komputer"` | Program studi |
| `jenjang` | `"S1"` | S1 / S2 / S3 |
| `tahun_masuk` | `2020` | Angkatan |

---

### 8.6 Alur Lengkap Chat

```javascript
// 1. Login & simpan token
const user = await login('krs001', 'teriN45!')

// 2. Kirim pesan — sesi baru
const chatRes = await api.post('/chat/send', {
  query: 'Carikan penelitian tentang pertanian organik'
})
const { session_id, message_id, ai_response, references, metadata } = chatRes.data

// 3. Lanjutkan sesi yang sama
const followUp = await api.post('/chat/send', {
  query: 'Jelaskan lebih detail penelitian pertama',
  session_id: session_id
})

// 4. Ambil daftar sesi user
const sessions = await api.get('/sessions/')
// sessions.data = [{ id, title, updated_at }, ...]

// 5. Buka riwayat sesi
const history = await api.get(`/sessions/${session_id}`)
// history.data = { id, title, messages: [...] }

// 6. Hapus sesi
await api.delete(`/sessions/${session_id}`)
```

---

### 8.7 Handling Error yang Perlu Diperhatikan

| Skenario | HTTP Status | Pesan yang ditampilkan ke user |
|---|---|---|
| Password salah | `401` | "Username atau password salah" |
| IPB API down | `502` | "Layanan autentikasi IPB sedang bermasalah" |
| Token expired | `401` | Redirect otomatis ke halaman login |
| Tidak ada token | `403` | Redirect otomatis ke halaman login |
| Query kosong | `422` | "Pertanyaan tidak boleh kosong" |
| Sesi tidak ditemukan | `404` | "Sesi tidak ditemukan" |
| Sesi milik user lain | `403` | "Akses ditolak" |
| Server error | `500` | "Terjadi kesalahan, coba lagi nanti" |

---

### 8.8 Filter Chat — Panduan UI

Filter di chat bersifat opsional dan dapat dikombinasikan. Rekomendasi UI:

- **`faculty`** → Dropdown dari `GET /master/faculties`
- **`department`** → Dropdown dari `GET /master/departments`
- **`document_type`** → Dropdown statis: `["Skripsi", "Tesis", "Disertasi"]`
- **`year`** → Input angka (exact match)
- **`year_range`** → Dua input angka: "Dari" dan "Sampai"

> Jika `year` dan `year_range` keduanya dikirim, `year_range` akan digunakan (prioritas di backend).

---

### 8.9 Tipe Query yang Dikembalikan AI (`query_type`)

| Nilai | Artinya |
|---|---|
| `informational` | Pertanyaan umum — AI cari paper dan beri penjelasan |
| `navigational` | User mencari paper spesifik (judul, penulis, dsb.) |
| `follow_up` | Pertanyaan lanjutan dalam sesi yang sama |
| `chitchat` | Sapaan/pertanyaan non-akademik — references akan kosong `[]`, `total_tokens` = 0 |

Gunakan ini untuk menyesuaikan tampilan UI (mis. jangan tampilkan section "Referensi" jika `query_type == 'chitchat'`).
