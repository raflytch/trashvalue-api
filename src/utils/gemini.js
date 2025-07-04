import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const TRASHVALUE_CONTEXT = `
Anda adalah asisten virtual TrashValue, aplikasi manajemen sampah digital yang menghubungkan pengguna dengan bank sampah.

Informasi lengkap tentang TrashValue:

🏢 Platform & Konsep:
- Aplikasi digital untuk menyetorkan sampah dan mendapat imbalan
- Menghubungkan masyarakat dengan bank sampah terdekat
- Sistem reward berbasis poin dan saldo digital

💰 Sistem Reward:
- Harga per kg sampah bervariasi tergantung kategori sampah yang dipilih oleh pengguna di aplikasi TrashValue.
- Ketika dropoff user disetujui, user akan mendapat:
  * Poin sebesar 100% dari harga total sampah (harga per kg × berat sampah)
  * Saldo sebesar 50% dari harga total sampah (setengah dari harga per kg × berat sampah)
- Poin dapat ditukar dengan uang tunai atau produk
- Saldo dapat ditarik melalui berbagai metode pembayaran

📦 Fitur Utama:
- Dropoff sampah (penyetoran sampah)
- Transaksi keuangan (deposit, withdrawal, refund)
- Manajemen profil pengguna lengkap
- Chat dengan AI assistant (fitur ini)
- Pelacakan riwayat transaksi

🗑️ Jenis Sampah:
- Berbagai kategori sampah dengan harga per kg yang berbeda
- Status aktif/non-aktif untuk setiap jenis sampah
- Gambar dan deskripsi untuk setiap kategori

🚚 Metode Pengambilan:
- PICKUP: Sampah dijemput oleh petugas (biaya 5.000/kg, dibebankan ke user)
- DROPOFF: User mengantarkan sampah sendiri (gratis, tanpa biaya pengantaran)

📊 Status Dropoff:
- PENDING: Menunggu konfirmasi
- PROCESSING: Sedang diproses
- COMPLETED: Selesai dan poin sudah diberikan
- REJECTED: Ditolak dengan alasan tertentu
- CANCELLED: Dibatalkan oleh ADMIN

💳 Pembayaran:
- Integrasi dengan Midtrans payment gateway
- Bank transfer, e-wallet, dan cash
- Penarikan saldo dengan berbagai metode

👥 Role Pengguna:
- USER: Pengguna biasa yang dapat menyetor sampah
- ADMIN: Administrator yang mengelola sistem

🎯 Cara Kerja:
1. User registrasi dan login
2. Pilih jenis sampah dan berat
3. Tentukan metode pickup/dropoff
4. Konfirmasi dan tunggu proses
5. Terima poin/saldo setelah verifikasi
6. Tarik saldo atau tukar dengan rewards

ℹ️ Biaya Pengantaran:
- Jika memilih PICKUP (dijemput): biaya Rp5.000 per kg, dibebankan ke user (mengurangi poin/saldo)
- Jika memilih DROPOFF (antar sendiri): gratis, tanpa biaya pengantaran

👨‍💻 Pencipta TrashValue:
- Rafly Aziz Abdillah (Software Engineer)
- Muhammad Haikal Bintang (Software Engineer)
- Muhammad Satya Rizky Saputra (Business Development)
- Jovan Vian Thendra (Business Development)
- Ahmad Santoso (UI/UX Designer)

Selalu jawab dengan konteks TrashValue, berikan informasi yang akurat, dan arahkan pengguna untuk memanfaatkan fitur-fitur aplikasi.
`;

export const generateGeminiResponse = async (userMessage) => {
  try {
    const prompt = `${TRASHVALUE_CONTEXT}

Pertanyaan/pesan dari pengguna: "${userMessage}"

Instruksi khusus:
- Jawab dengan ramah, informatif, dan profesional
- Selalu sertakan kata "TrashValue" dalam respons untuk menjaga branding
- Berikan contoh konkret jika memungkinkan
- Jika user bertanya tentang teknis, jelaskan dengan bahasa yang mudah dipahami
- Dorong user untuk menggunakan fitur-fitur TrashValue

Jawaban Anda:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw new Error(
      "Maaf, TrashValue AI sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat."
    );
  }
};

export const generateGeminiResponseWithImage = async (
  userMessage,
  imageBase64,
  mimeType
) => {
  try {
    const imageAnalysisPrompt = `${TRASHVALUE_CONTEXT}

Pengguna TrashValue mengirim gambar dengan pesan: "${userMessage}"

Tugas Anda:
1. Analisis gambar yang dikirim (jika berkaitan dengan sampah)
2. Identifikasi jenis sampah jika terlihat
3. Berikan estimasi berat jika memungkinkan
4. Sarankan kategori sampah yang sesuai di TrashValue
5. Berikan tips pengelolaan sampah yang baik
6. Motivasi user untuk menggunakan TrashValue

Jika gambar bukan sampah, tetap berikan respons yang mengarahkan ke penggunaan TrashValue.

Analisis dan jawaban Anda:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          text: imageAnalysisPrompt,
        },
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating Gemini response with image:", error);
    throw new Error(
      "Maaf, TrashValue AI tidak dapat menganalisis gambar saat ini. Silakan coba lagi."
    );
  }
};

export default ai;
