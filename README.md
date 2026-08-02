<p align="center">
  <img src="https://files.catbox.moe/zpfaek.jpg" alt="nirwabot Banner" width="100%">
</p>

<h1 align="center">✦ nirwabot ✦</h1>

<p align="center">
  <strong>Useless WhatsApp Bot — Because Why Not?</strong>
</p>

<br>

<p align="center">
  <img src="https://img.shields.io/badge/status-✅_Active-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/github/package-json/v/itsreimau/nirwabot?style=for-the-badge&color=blue" alt="Version">
  <img src="https://img.shields.io/badge/node-%3E%3D20-green?style=for-the-badge" alt="Node Version">
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" alt="License">
</p>

<p align="center">
  <a href="https://github.com/itsreimau/nirwabot/stargazers">
    <img src="https://img.shields.io/github/stars/itsreimau/nirwabot?style=for-the-badge&color=yellow" alt="Stars">
  </a>
  <a href="https://github.com/itsreimau/nirwabot/network/members">
    <img src="https://img.shields.io/github/forks/itsreimau/nirwabot?style=for-the-badge&color=blue" alt="Forks">
  </a>
  <a href="https://github.com/itsreimau/nirwabot/watchers">
    <img src="https://img.shields.io/github/watchers/itsreimau/nirwabot?style=for-the-badge&color=green" alt="Watchers">
  </a>
  <a href="https://github.com/itsreimau/nirwabot/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/itsreimau/nirwabot?style=for-the-badge&color=purple" alt="Contributors">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/maintained-yes-brightgreen?style=for-the-badge" alt="Maintained">
  <img src="https://img.shields.io/badge/PRs-welcome-orange?style=for-the-badge" alt="PRs Welcome">
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
        coin: 0, // Biaya koin
        group: false, // Hanya di grup?
        owner: false, // Hanya owner?
        premium: false, // Hanya premium?
        private: false, // Hanya private chat?
        restrict: false // Mode restriktif?
    },
    code: async (ctx) => {
        await ctx.reply("Hello, World! 👋"); // Kirim pesan
        await ctx.replyReact("✨"); // Kirim reaksi
    }
};
```

---

## 🤝 Contribution

### Contribution Guidelines

1. **Fork** repositori ini
2. Buat **branch** baru (`git checkout -b fitur-keren`)
3. **Commit** perubahan (`git commit -m '✨ Menambahkan fitur keren'`)
4. **Push** ke branch (`git push origin fitur-keren`)
5. Buat **Pull Request**

### Contribution Rules

- ✅ Ikuti gaya kode yang sudah ada
- ✅ Tambahkan dokumentasi untuk fitur baru
- ✅ Uji coba sebelum mengirim PR
- ✅ Gunakan pesan commit yang deskriptif
- ❌ Jangan menghapus credit/attribution

---

## 🙏 Thanks to Contributors

Terima kasih kepada semua pihak yang telah berkontribusi:

<table>
<tr>
<td align="center">
  <a href="https://github.com/itsreimau">
    <img src="https://github.com/itsreimau.png" width="60px" style="border-radius:50%">
    <br><sub><b>ItsReimau</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/JastinXyz">
    <img src="https://github.com/JastinXyz.png" width="60px" style="border-radius:50%">
    <br><sub><b>Jastin Linggar Tama</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/itsliaaa">
    <img src="https://github.com/itsliaaa.png" width="60px" style="border-radius:50%">
    <br><sub><b>Lia Wynn</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/Kyluxx">
    <img src="https://github.com/Kyluxx.png" width="60px" style="border-radius:50%">
    <br><sub><b>Kyluxx</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/SirKaff">
    <img src="https://github.com/SirKaff.png" width="60px" style="border-radius:50%">
    <br><sub><b>Sir Kafka</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/fjrhub">
    <img src="https://github.com/fjrhub.png" width="60px" style="border-radius:50%">
    <br><sub><b>fjrhub</b></sub>
  </a>
</td>
</tr>
<tr>
<td align="center">
  <a href="https://github.com/Rippanteq7">
    <img src="https://github.com/Rippanteq7.png" width="60px" style="border-radius:50%">
    <br><sub><b>Rippanteq7</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/fandyahmd">
    <img src="https://github.com/fandyahmd.png" width="60px" style="border-radius:50%">
    <br><sub><b>Fan</b></sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/lzif">
    <img src="https://github.com/lzif.png" width="60px" style="border-radius:50%">
    <br><sub><b>Luki Zainur</b></sub>
  </a>
</td>
</tr>
</table>

Dan semua kontributor lainnya yang tidak bisa disebutkan satu per satu 🌟

---

## 📄 License

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

<p align="center">
  <sub>Dibuat dengan ❤️ oleh <a href="https://github.com/itsreimau">ItsReimau</a> dan para kontributor</sub>
  <br>
  <sub>✦ nirwabot — Useless WhatsApp Bot ✦</sub>
</p>