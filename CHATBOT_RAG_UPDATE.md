# Chatbot RAG Implementation

## 📋 Overview

Implementasi **Simple RAG (Retrieval Augmented Generation)** untuk chatbot Devion dengan **2-model approach** untuk optimasi kecepatan.

### Arsitektur 2 Model

| Model | Size | Use Case | Speed |
|-------|------|----------|-------|
| **tinyllama:1.1b** | 1.1B | Intent classification | 🚀 Cepat (~1-2 detik) |
| **phi3:3.8b** | 3.8B | Response generation | ⚖️ Sedang (~5-10 detik) |

**Total estimasi waktu: 6-12 detik** (50% lebih cepat dari single model)

## 🔄 Alur Kerja Baru

### Sebelumnya (Old Approach)
```
User Query → Keyword Matching → Tool Execution → Template String Response
```
**Masalah:** Respons kaku, tidak natural, dan "melantur" karena hanya menggunakan template string.

### Sekarang (RAG Approach)
```
User Query → LLM Intent Classification → Tool Execution → Data Injection → LLM Response Generation
```
**Keuntungan:** Respons natural, berdasarkan data real, dan lebih kontekstual.

## 🏗️ Arsitektur

### 1. Intent Classification
- Menggunakan LLM untuk mengklasifikasikan intent user
- 5 intent: `getProjects`, `getTodos`, `getCalendarEvents`, `getGitHubStats`, `general`
- Fallback ke keyword matching jika LLM classification gagal

### 2. Tool Execution
- Execute tool berdasarkan intent yang terklasifikasi
- Mengambil data real dari PostgreSQL

### 3. Data Formatting
- Format data yang diambil menjadi konteks yang mudah dipahami LLM
- Menambahkan emoji, formatting, dan struktur yang jelas

### 4. Response Generation (RAG)
- Inject formatted data ke prompt LLM
- LLM generate respons natural berdasarkan data real
- Respons dalam Bahasa Indonesia secara default

## 📁 File yang Diubah

### `src/chatbot/chatbot.types.ts`
- Menambahkan types baru: `ChatIntent`, `IntentClassification`
- Menambahkan prompts baru: `INTENT_CLASSIFICATION_PROMPT`, `RAG_RESPONSE_PROMPT`
- Update `SYSTEM_PROMPT` untuk lebih general

### `src/chatbot/chatbot.service.ts`
- Menambahkan method `classifyIntent()` untuk LLM-based classification
- Menambahkan method `classifyIntentFallback()` untuk keyword-based fallback
- Menambahkan method `formatDataForContext()` untuk format data ke LLM
- Refactor method `chat()` untuk implementasi RAG flow

### `.env`
- Menambahkan `OLLAMA_SMALL_MODEL` untuk intent classification

## 🚀 Cara Testing

### 1. Pastikan Ollama Running
```bash
ollama serve
```

### 2. Pastikan Model Tersedia
```bash
# Model untuk intent classification (WAJIB)
ollama pull tinyllama:1.1b

# Model untuk response generation (sudah ada)
ollama pull phi3:3.8b

# Cek model yang tersedia
ollama list
```

### 3. Restart Backend
```bash
cd backend
npm run start:dev
```

### 4. Test Chatbot via Frontend
Buka http://localhost:5173 dan gunakan fitur chatbot.

### 5. Test Cases

#### Test Project Query
```
User: "Apa proyek saya yang belum selesai?"
Expected: Chatbot menampilkan list proyek dengan status TODO dari database
```

#### Test Todo Query
```
User: "Tugas apa yang harus saya kerjakan?"
Expected: Chatbot menampilkan list todos yang pending
```

#### Test Calendar Query
```
User: "Apa jadwal saya minggu ini?"
Expected: Chatbot menampilkan event kalender
```

#### Test GitHub Query
```
User: "Tampilkan repository GitHub saya"
Expected: Chatbot menampilkan GitHub stats dan repos
```

#### Test General Query
```
User: "Halo, apa kabar?"
Expected: Chatbot merespons dengan ramah tanpa memanggil tool
```

## 🔧 Konfigurasi

### Environment Variables
```env
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="phi3:3.8b"           # Model utama untuk response generation
OLLAMA_SMALL_MODEL="tinyllama:1.1b" # Model kecil untuk intent classification
```

**Alternatif untuk OLLAMA_SMALL_MODEL:**
- `tinyllama:1.1b` - Paling cepat, akurasi cukup (recommended)
- `gemma:2b` - Sedikit lebih lambat, akurasi lebih baik
- `phi3:3.8b` - Sama dengan model utama (fallback)

## 📊 Keuntungan Implementasi Ini

1. ✅ **Tidak perlu Vector Database** - Menggunakan data terstruktur dari PostgreSQL
2. ✅ **Data Real-time** - Selalu query data terbaru dari database
3. ✅ **Respons Natural** - LLM yang generate respons, bukan template string
4. ✅ **Kontekstual** - Respons berdasarkan data actual user
5. ✅ **Fallback Robust** - Jika LLM classification gagal, ada keyword-based fallback
6. ✅ **Minimal Changes** - Modifikasi dari kode existing yang minimal

## 🐛 Troubleshooting

### Chatbot tidak merespons
- Pastikan Ollama running di `http://localhost:11434`
- Cek model tersedia: `ollama list`
- Pastikan **tinyllama:1.1b** sudah di-download: `ollama pull tinyllama:1.1b`
- Cek log backend untuk error details

### Intent classification gagal
- Cek apakah tinyllama model sudah ter-download
- Lihat log untuk error message dari Ollama
- Fallback ke keyword classification akan otomatis aktif

### Respons masih "melantur"
- Pastikan data di database valid
- Coba gunakan model yang lebih besar untuk `OLLAMA_MODEL` seperti `llama3:8b` atau `mistral:7b`
- Cek intent classification di log

### Response terlalu lambat
- Gunakan GPU jika tersedia (perbedaan signifikan)
- Gunakan model quantized: `tinyllama:1.1b-q4_0` lebih cepat dari `tinyllama:1.1b`
- Pertimbangkan caching untuk query yang sering ditanyakan

## 📝 Next Steps (Opsional)

1. **Add Conversation Memory** - Simpan conversation history ke database
2. **Add Feedback Mechanism** - User bisa rate respons chatbot
3. **Add Multi-turn Support** - Chatbot bisa handle follow-up questions lebih baik
4. **Add Analytics** - Track chatbot usage dan accuracy

## 👨‍💻 Developer Notes

Kode ini menggunakan pendekatan **Simple RAG** yang tidak memerlukan vector database. Jika di masa depan Anda ingin menambahkan semantic search atau handle unstructured data, pertimbangkan untuk menambahkan vector database seperti:
- pgvector (PostgreSQL extension)
- ChromaDB
- Pinecone
- Weaviate
