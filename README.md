<h1 align="center">✦ nirwabot ✦</h1>

<p align="center">
  <strong>Useless WhatsApp Bot — Because Why Not?</strong>
</p>

---

## 📖 About

**nirwabot** adalah bot WhatsApp yang dirancang untuk menjadi teman digital serbaguna — mulai dari membuat stiker, menjawab pertanyaan dengan AI, hingga bermain game interaktif. Meskipun disebut _"useless"_, bot ini hadir dengan segudang fitur yang (mungkin) berguna untuk keseharianmu.

### 🧠 Philosophy of Names

| Bagian  | Arti                                                                                      |
| ------- | ----------------------------------------------------------------------------------------- |
| **Nir** | Berasal dari bahasa Sanskerta yang berarti **"tidak ada"**, **"tanpa"**, atau **"bebas"** |
| **Wa**  | Singkatan dari **WhatsApp**                                                               |
| **Bot** | Merujuk pada **Robot** atau program otomatis                                              |

> Secara keseluruhan, **nirwabot** bermakna _"Bot WhatsApp yang bebas (tanpa batasan)"_ — sebuah representasi dari semangat open-source yang memberi kebebasan kepada pengguna untuk mengeksplorasi dan mengembangkan sesuai kebutuhan.

---

> [!WARNING]
>
> ## ⚠️ Important Warning
>
> `nirwabot` **tidak berafiliasi dengan WhatsApp, Meta, atau pihak terkait mana pun**. Proyek ini adalah **perangkat lunak sumber terbuka** yang dibuat untuk tujuan edukasi dan pengembangan.
>
> Bot ini menggunakan **API WhatsApp tidak resmi**, yang berarti **akun WhatsApp Anda berpotensi diblokir** oleh WhatsApp. Gunakan dengan bijak dan di bawah tanggung jawab Anda sendiri.
>
> **Kami tidak bertanggung jawab atas penyalahgunaan, kerusakan, atau pemblokiran akun** yang mungkin terjadi.

---

## 🚀 Starting

### 📋 Requirements

- **Node.js** ≥ 20
- **npm** atau **yarn** atau **pnpm**
- **Git**

### 1️⃣ Clone

```bash
git clone https://github.com/itsreimau/nirwabot.git
cd nirwabot
```

### 2️⃣ Install & Setup

```bash
npm run setup
```

Atau manual:

```bash
npm install
cp config.example.json config.json
```

### 3️⃣ Configuration

Buka dan edit `config.json` sesuai kebutuhan:

- **Bot Identity** — Nama, nomor HP, thumbnail, dan link grup
- **Owner Settings** — Nama, nomor, dan co-owner
- **System Settings** — Mode bot, fitur keamanan, batasan, dan lainnya
- **Message Settings** — Pesan default untuk berbagai situasi
- **Sticker Settings** — Packname dan author untuk stiker

---

## ▶️ Running

| Mode               | Perintah               | Deskripsi                            |
| ------------------ | ---------------------- | ------------------------------------ |
| 🧪 **Development** | `npm start`            | Jalankan di terminal untuk debugging |
| 🚀 **Production**  | `npm run start:pm2`    | Jalankan sebagai background service  |

### 🔐 Authentication

| Metode           | Langkah                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Pairing Code** | Kode 8 digit muncul di terminal → Buka WhatsApp > Perangkat Tertaut → Masukkan kode |
| **QR Code**      | QR Code muncul di terminal → Buka WhatsApp > Perangkat Tertaut → Pindai QR          |

---

## 🛠️ Creating a New Command

Untuk menambahkan perintah kustom, buat file JavaScript baru di folder `commands/` dengan struktur berikut:

```javascript
// commands/example/helloworld.js

module.exports = {
    name: "helloworld", // Nama perintah (wajib)
    aliases: ["hello", "hw"], // Alias (opsional)
    category: "example", // Kategori (opsional)
    permissions: { // Izin (opsional)
        admin: false, // Hanya admin grup?
        botAdmin: false, // Bot harus admin?
        group: false, // Hanya di grup?
        owner: false, // Hanya owner?
        premium: false, // Hanya premium?
        private: false, // Hanya private chat?
        restrict: false, // Mode restriktif?
        ticket: true // Biaya tiket
    },
    code: async (ctx) => {
        await ctx.reply("Hello, World! 👋"); // Kirim pesan
        await ctx.replyReact("✨"); // Kirim reaksi
    }
};
```

---

## 📄 License

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

<p align="center">
  <sub>Dibuat dengan ❤️ oleh <a href="https://github.com/itsreimau">ItsReimau</a> dan para kontributor</sub>
  <br>
  <sub>✦ nirwabot — Useless WhatsApp Bot ✦</sub>
</p>