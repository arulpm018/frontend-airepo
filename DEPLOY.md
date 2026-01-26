# Tutorial Deploy ke Vercel

## 📋 Prerequisites
- ✅ Project sudah di-push ke GitHub
- ✅ Build script sudah ada di `package.json`
- ✅ File `vercel.json` sudah dibuat

## 🚀 Cara Deploy

### Metode 1: Deploy via Website Vercel (Paling Mudah)

#### 1. Buka Vercel
- Kunjungi [vercel.com](https://vercel.com)
- Klik **"Sign Up"** atau **"Login"**
- Login menggunakan akun GitHub Anda

#### 2. Import Project
- Setelah login, klik **"Add New..."** atau **"New Project"**
- Klik **"Import Git Repository"**
- Pilih repository GitHub Anda: `frontend-airepo`
- Klik **"Import"**

#### 3. Configure Project
Vercel akan otomatis mendeteksi settings, tapi pastikan:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 4. Environment Variables (Jika Ada)
- Jika project Anda menggunakan API atau environment variables:
  - Klik **"Environment Variables"**
  - Tambahkan variabel yang diperlukan (misal: `VITE_API_URL`)
  - Contoh:
    ```
    VITE_API_URL = https://your-api.com
    ```

#### 5. Deploy
- Klik **"Deploy"**
- Tunggu proses build selesai (biasanya 1-2 menit)
- Setelah selesai, Anda akan mendapat URL deployment: `https://frontend-airepo.vercel.app`

### Metode 2: Deploy via Vercel CLI

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login ke Vercel
```bash
vercel login
```

#### 3. Deploy
```bash
# Deploy ke preview
vercel

# Deploy ke production
vercel --prod
```

## 🔄 Auto Deploy

Setiap kali Anda push ke branch `main` di GitHub, Vercel akan otomatis:
- Build project
- Deploy versi terbaru
- Update URL production Anda

## 🌍 Custom Domain (Opsional)

### Tambah Custom Domain:
1. Buka project di Vercel Dashboard
2. Pilih **"Settings"** → **"Domains"**
3. Masukkan domain Anda (misal: `airepo.com`)
4. Follow instruksi untuk update DNS records

## 🔧 Troubleshooting

### Build Error
Jika ada error saat build:
1. Cek terminal log di Vercel dashboard
2. Pastikan project bisa di-build local:
   ```bash
   npm run build
   ```
3. Pastikan semua dependencies ada di `package.json`

### 404 Error pada Routing
- File `vercel.json` sudah di-configure untuk handle SPA routing
- Pastikan file ini ter-commit ke GitHub

### Environment Variables
Jika API tidak connect:
1. Pastikan environment variables sudah ditambahkan di Vercel
2. Nama variable harus diawali dengan `VITE_` untuk Vite project
3. Redeploy setelah menambah env vars

## 📱 Monitoring

### Lihat Deployment Logs:
1. Buka Vercel Dashboard
2. Pilih project Anda
3. Klik pada deployment
4. Lihat **"Build Logs"** untuk detail

### Analytics:
- Vercel menyediakan analytics gratis
- Lihat performa dan visitor di dashboard

## 🎉 Selesai!

Project Anda sudah live di internet! 🚀

**URL Production:** `https://[your-project-name].vercel.app`

### Next Steps:
- Share URL dengan tim atau client
- Setup custom domain
- Enable analytics
- Setup environment variables untuk production

---

## 📝 Notes

- **Free Plan:** 
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Serverless functions

- **Build Time:** Biasanya 1-3 menit
- **Update Time:** Push ke GitHub → Auto deploy dalam beberapa menit

