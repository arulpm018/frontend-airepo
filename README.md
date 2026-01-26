# RAG Chat Frontend

Frontend untuk sistem RAG (Retrieval-Augmented Generation) mirip consensus.app dengan tech stack React + TypeScript + Tailwind CSS + shadcn/ui.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env` di root project:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_USER_ID=hasrulmalik
```

**⚠️ PENTING:**
- **JANGAN ada spasi** setelah tanda `=`
- **JANGAN gunakan quotes** untuk URL
- Jangan tambahkan trailing slash di akhir URL

✅ **Benar:**
```env
VITE_API_BASE_URL=https://0f1fbf52d44d.ngrok-free.app/api/v1
```

❌ **Salah:**
```env
VITE_API_BASE_URL= https://0f1fbf52d44d.ngrok-free.app/api/v1  (ada spasi)
VITE_API_BASE_URL="https://0f1fbf52d44d.ngrok-free.app/api/v1"  (ada quotes)
VITE_API_BASE_URL=https://0f1fbf52d44d.ngrok-free.app/api/v1/  (ada trailing slash)
```

### 3. Run Development Server

```bash
npm run dev
```

Server akan jalan di `http://localhost:5173/`

### 4. Debug Environment Variables

Buka browser console (F12) dan cek log:

```
🔗 API Base URL: https://your-api-domain.com/api/v1
📋 Raw VITE_API_BASE_URL: "https://your-api-domain.com/api/v1"
👤 User ID: user_12345
```

Pastikan URL benar dan tidak ada spasi di awal/akhir.

## 🔧 Features

### ✅ Implemented Features

1. **Sidebar Sticky**
   - Session history di kiri
   - Fixed position saat scroll chat
   - Button "New Chat" di atas

2. **Chat Area**
   - Messages dengan markdown rendering (bold, lists, links)
   - References list dengan checkbox
   - Input box fixed di bawah
   - Auto-scroll ke message terbaru

3. **Checklist Feature**
   - User bisa select references
   - Selected papers muncul sebagai chips di atas input
   - Chips bisa di-remove dengan button X
   - Selected paper IDs dikirim ke API

4. **API Integration**
   - GET `/sessions/` - List semua sessions
   - GET `/sessions/{id}` - Get session detail
   - POST `/chat/send` - Send message & get AI response
   - Ngrok support (bypass warning page)
   - Better error handling

5. **UI/UX**
   - Responsive design
   - Loading states
   - Error notifications (toast)
   - Smooth animations
   - Clean, modern design

## 🐛 Troubleshooting

### Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Penyebab:**
1. `.env` tidak terbaca atau format salah (ada spasi)
2. URL endpoint salah
3. Ngrok warning page (jika pakai ngrok)

**Solusi:**
1. **Cek `.env` format** - pastikan tidak ada spasi setelah `=`
2. **Restart dev server** setelah edit `.env`:
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```
3. **Cek browser console** untuk BASE_URL yang digunakan
4. **Ngrok header** sudah ditambahkan otomatis (`ngrok-skip-browser-warning: true`)

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Penyebab:**
Backend belum enable CORS untuk endpoint GET `/sessions/` atau GET `/sessions/{id}`.

**Solusi:**

**Backend perlu tambahkan CORS headers:**

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # atau specify origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Sementara waktu:**
- Chat masih bisa digunakan (POST `/chat/send` berhasil)
- Session history tidak muncul di sidebar
- Setelah send message, session baru akan muncul

### API Calls Logging

Setiap API call akan di-log di console (development mode):

```
🌐 GET https://your-api.com/api/v1/sessions/?limit=50
🌐 POST https://your-api.com/api/v1/chat/send
```

Gunakan ini untuk debug jika ada endpoint yang salah.

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatArea.tsx        # Main chat area with messages
│   ├── InputBox.tsx        # User input + selected chips
│   ├── Message.tsx         # Single message bubble (with markdown)
│   ├── ReferenceCard.tsx   # Single reference item (with checkbox)
│   ├── SelectedPaperChip.tsx  # Chip for selected papers
│   ├── Sidebar.tsx         # Sessions list sidebar
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── api.ts              # API calls (with ngrok support)
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
├── App.tsx                 # Main app component
└── main.tsx                # Entry point
```

## 🔗 API Endpoints

Base URL: `/api/v1` (set via `.env`)

### 1. Send Message
```
POST /chat/send
Headers: X-User-ID
Body: {
  query: string,
  session_id: number | null,
  selected_paper_ids?: string[]
}
```

### 2. Get Sessions
```
GET /sessions/?limit=50
Headers: X-User-ID
```

### 3. Get Session Detail
```
GET /sessions/{session_id}
Headers: X-User-ID
```

## 🎨 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **react-markdown** - Markdown rendering
- **sonner** - Toast notifications
- **lucide-react** - Icons

## 📝 Notes

### Ngrok Support
Jika backend menggunakan ngrok, header `ngrok-skip-browser-warning: true` sudah ditambahkan otomatis untuk bypass warning page.

### Markdown Rendering
AI response dari GPT-4 akan di-render dengan format:
- **Bold** text
- Numbered lists
- Bullet lists
- Links (clickable)
- Paragraphs dengan spacing

### Session Management
- New chat: `session_id = null`
- Continue chat: gunakan `session_id` dari response
- Load session: fetch dari `/sessions/{id}`

## 🚧 Build for Production

```bash
npm run build
```

Output ada di folder `dist/`.

## 📄 License

Private project.

# frontend-airepo
