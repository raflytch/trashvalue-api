# ♻️ TrashValue Backend

**TrashValue** adalah aplikasi manajemen sampah digital yang menghubungkan pengguna dengan bank sampah. Pengguna dapat menyetorkan sampah mereka dan menerima uang tunai atau poin digital sebagai imbalan. Sistem ini juga menyediakan fitur chat AI berbasis Gemini untuk edukasi dan konsultasi seputar pengelolaan sampah.

---

## 🚀 Fitur Utama

- 🔐 Autentikasi & otorisasi menggunakan **JWT**
- 🧑 Profil pengguna lengkap dengan foto profil & latar belakang
- 🛡️ Kontrol akses berbasis peran: **User** & **Admin**
- 🗑️ Manajemen sampah: **dropoff**, kategori, dan item sampah
- 💰 Dompet digital dengan **saldo** & **poin**
- 🔄 Transaksi keuangan: setoran & penarikan
- 💳 Integrasi pembayaran dengan **Midtrans**
- 🖼️ Upload & optimasi gambar dengan **ImageKit**
- 🎁 Sistem hadiah berbasis poin untuk aktivitas daur ulang
- 📆 Penjadwalan pengambilan & penyetoran sampah
- 📡 Pelacakan status pembayaran secara **real-time**
- 🤖 **Chat AI** edukasi & konsultasi berbasis **Gemini API** (text & image)

---

## ⚙️ Teknologi yang Digunakan

| Teknologi            | Deskripsi                                    |
| -------------------- | -------------------------------------------- |
| Node.js & Express.js | Backend framework cepat dan ringan           |
| PostgreSQL           | Database relasional open-source yang handal  |
| Prisma ORM           | ORM modern untuk TypeScript & JavaScript     |
| JWT                  | Autentikasi berbasis token                   |
| bcrypt               | Hashing password yang aman                   |
| Multer               | Middleware unggah file                       |
| ImageKit.io          | Penyimpanan & optimasi gambar berbasis cloud |
| Midtrans             | Gateway pembayaran lokal                     |
| Morgan               | Logger request HTTP                          |
| express-validator    | Middleware validasi input                    |
| dotenv               | Manajemen variabel lingkungan                |
| **Gemini API**       | Layanan AI Google untuk chat asisten cerdas  |

---

## 📁 Struktur API

| Endpoint               | Fungsi                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| `/api/v1/users`        | Registrasi, login, & manajemen profil                               |
| `/api/v1/waste-types`  | CRUD kategori sampah & harga                                        |
| `/api/v1/dropoffs`     | Penjadwalan dan pengelolaan penyetoran sampah                       |
| `/api/v1/waste`        | Pengelolaan item sampah dalam dropoff                               |
| `/api/v1/transactions` | Proses & riwayat transaksi keuangan                                 |
| `/api/v1/chat`         | Chat dengan AI (text & image), riwayat, pencarian, hapus, statistik |

**Catatan:**

- Endpoint chat AI menggunakan Gemini API untuk menghasilkan respons cerdas, termasuk analisis gambar.
- Upload gambar hanya mendukung format JPG, JPEG, PNG, maksimal 5MB.

---

## 🛠️ Cara Menjalankan Proyek

1. **Clone repositori**

```bash
git clone https://github.com/raflytch/trashvalue-api.git
cd trashvalue-api
```

2. **Install dependensi**

```bash
npm install
```

3. **Konfigurasi environment**

```bash
cp env.example .env
```

Edit file `.env` dengan konfigurasi pribadi Anda:

```env
DATABASE_URL="postgresql://nama_anda:password@localhost:5432/db_anda?schema=public"
JWT_SECRET=secret_jwt_anda
IMAGEKIT_PUBLIC_KEY=kunci_publik_imagekit
IMAGEKIT_PRIVATE_KEY=kunci_pribadi_imagekit
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/endpoint_anda
MIDTRANS_SERVER_KEY=kunci_server_midtrans
MIDTRANS_CLIENT_KEY=kunci_klien_midtrans
PORT=3000
JWT_EXPIRATION=1d
ADMIN_PASSWORD=password_admin
GEMINI_API_KEY=api_key_gemini
```

4. **Migrasi & seeding database**

```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Jalankan server**

```bash
# Mode development
npm run dev

# Mode production
npm start
```

---

## 🧩 Skema Database

### Entitas Utama

| Entitas          | Deskripsi                                   |
| ---------------- | ------------------------------------------- |
| **Users**        | Info pengguna, autentikasi, saldo & poin    |
| **WasteTypes**   | Kategori sampah + harga per kg              |
| **Dropoffs**     | Data penyetoran sampah oleh user            |
| **WasteItems**   | Item sampah individual dalam sebuah dropoff |
| **Transactions** | Riwayat transaksi (deposit & withdraw)      |
| **Chats**        | Riwayat chat AI (pesan, respons, gambar)    |

---

## 💱 Sistem Saldo & Poin

- **Poin**: Diperoleh dari aktivitas daur ulang, digunakan untuk menyetorkan sampah.
- **Saldo**: Uang yang bisa ditarik ke bank/e-wallet.

### Logika Penyetoran:

- Setiap **1 kg** sampah = **10.000 poin/saldo**
- Sistem lebih dulu menggunakan poin
- Jika poin tidak cukup, maka saldo akan digunakan
- Setelah dropoff selesai, pengguna akan menerima kembali **saldo dan poin** sesuai kontribusi

---

## 🤖 Tentang Fitur Chat AI (Gemini)

- Chat AI menggunakan **Google Gemini API** untuk menjawab pertanyaan dan konsultasi seputar pengelolaan sampah, edukasi, dan fitur TrashValue.
- Mendukung input teks dan gambar (analisis gambar sampah, edukasi visual).
- Setiap chat disimpan di database dan dapat diakses kembali oleh user.
- Admin dapat melihat statistik penggunaan chat AI dan mengelola data chat.

---

## 👨‍💻 Kontributor

- [Rafly Aziz Abdillah](https://github.com/raflytch)
- [Muhammad Haikal Bintang](https://github.com/Haikal18)
- [Jovan Vian Thendra](https://github.com/JovanVian13)
- [Muhammad Satya Rizky Saputra](https://github.com/SatyaRizkySaputra0214)
- [Ahmad Santoso](https://github.com/ahmad-santoso)

---
