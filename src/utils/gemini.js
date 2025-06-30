import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Inisialisasi Gemini AI dengan API key dari environment
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Context khusus untuk TrashValue yang lebih lengkap
const TRASHVALUE_CONTEXT = `
Anda adalah asisten virtual TrashValue, aplikasi manajemen sampah digital yang menghubungkan pengguna dengan bank sampah. 

Informasi lengkap tentang TrashValue:

🏢 Platform & Konsep:
- Aplikasi digital untuk menyetorkan sampah dan mendapat imbalan
- Menghubungkan masyarakat dengan bank sampah terdekat
- Sistem reward berbasis poin dan saldo digital

💰 Sistem Reward:
- 1 kg sampah = 10.000 poin/saldo (dapat bervariasi per jenis sampah)
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
- PICKUP: Sampah dijemput oleh petugas
- DROPOFF: User mengantarkan sampah sendiri

📊 Status Dropoff:
- PENDING: Menunggu konfirmasi
- PROCESSING: Sedang diproses
- COMPLETED: Selesai dan poin sudah diberikan
- REJECTED: Ditolak dengan alasan tertentu
- CANCELLED: Dibatalkan oleh user

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

Selalu jawab dengan konteks TrashValue, berikan informasi yang akurat, dan arahkan pengguna untuk memanfaatkan fitur-fitur aplikasi. Jika ada pertanyaan di luar topik, dengan sopan arahkan kembali ke TrashValue.
`;

// Fungsi untuk generate response dari Gemini (hanya text)
export const generateGeminiResponse = async (userMessage) => {
  try {
    // Buat prompt dengan context yang lebih kaya
    const prompt = `${TRASHVALUE_CONTEXT}

Pertanyaan/pesan dari pengguna: "${userMessage}"

Instruksi khusus:
- Jawab dengan ramah, informatif, dan profesional
- Selalu sertakan kata "TrashValue" dalam respons untuk menjaga branding
- Berikan contoh konkret jika memungkinkan
- Jika user bertanya tentang teknis, jelaskan dengan bahasa yang mudah dipahami
- Dorong user untuk menggunakan fitur-fitur TrashValue

Jawaban Anda:`;

    // Generate response menggunakan Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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

// Fungsi untuk generate response dengan gambar
export const generateGeminiResponseWithImage = async (
  userMessage,
  imageBase64,
  mimeType
) => {
  try {
    // Context khusus untuk analisis gambar sampah
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

    // Generate response dengan gambar
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
