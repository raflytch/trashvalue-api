import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Inisialisasi Gemini AI dengan API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Konfigurasi model Gemini Pro
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
});

// Context khusus untuk TrashValue
const TRASHVALUE_CONTEXT = `
Anda adalah asisten virtual TrashValue, aplikasi manajemen sampah digital yang menghubungkan pengguna dengan bank sampah. 

Informasi tentang TrashValue:
- Platform digital untuk menyetorkan sampah dan mendapat imbalan
- Sistem poin dan saldo: 1 kg sampah = 10.000 poin/saldo
- Fitur utama: dropoff sampah, transaksi keuangan, manajemen profil
- Jenis sampah: berbagai kategori dengan harga per kg berbeda
- Metode pickup: pickup (dijemput) atau dropoff (diantar sendiri)
- Status dropoff: PENDING, PROCESSING, COMPLETED, REJECTED, CANCELLED
- Pembayaran via Midtrans (bank transfer, e-wallet)
- Role pengguna: USER dan ADMIN

Selalu jawab dengan konteks TrashValue dan berikan informasi yang membantu pengguna memahami cara kerja aplikasi. Jika pertanyaan tidak terkait TrashValue, arahkan kembali ke topik aplikasi.
`;

// Fungsi untuk generate response dari Gemini
export const generateGeminiResponse = async (userMessage) => {
  try {
    // Gabungkan context dengan pesan user
    const prompt = `${TRASHVALUE_CONTEXT}\n\nPertanyaan pengguna: ${userMessage}\n\nJawab dengan ramah dan informatif seputar TrashValue:`;

    // Generate response menggunakan Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw new Error(
      "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi."
    );
  }
};

export default model;
