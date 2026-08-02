async function get(ctx, type) {
    try {
        let text = "";
        const createList = (data, list) => data.map(list).join("\n");

        switch (type) {
            case "alkitab": {
                const data = (await ctx.request.get("https://api-alkitab.vercel.app/api/book")).data.data;
                text = createList(data, (list) =>
                    `❖ ${ctx.format.bold("Kitab")}: ${list.name} (${list.abbr})\n` +
                    `❖ ${ctx.format.bold("Jumlah Bab")}: ${list.chapter}`
                );
                break;
            }
            case "alquran": {
                const data = (await ctx.request.get("https://raw.githubusercontent.com/penggguna/QuranJSON/master/quran.json")).data;
                text = createList(data, (list) =>
                    `❖ ${ctx.format.bold("Surah")}: ${list.name} (${list.number_of_surah})\n` +
                    `❖ ${ctx.format.bold("Jumlah Ayat")}: ${list.number_of_ayah}`
                );
                break;
            }
            case "claim": {
                const data = [
                    "daily (Hadiah harian)",
                    "weekly (Hadiah mingguan)",
                    "monthly (Hadiah bulanan)",
                    "yearly (Hadiah tahunan)"
                ];
                text = createList(data, (list) => `❖ ${list}`);
                break;
            }
            case "group": {
                const data = [
                    "open (Buka grup)",
                    "close (Tutup grup)",
                    "lock (Kunci grup)",
                    "unlock (Buka kunci grup)",
                    "approve (Aktifkan persetujuan masuk)",
                    "disapprove (Nonaktifkan persetujuan masuk)",
                    "invite (Izinkan anggota menambah anggota)",
                    "restrict (Hanya admin yang bisa menambah anggota)"
                ];
                text = createList(data, (list) => `❖ ${list}`);
                break;
            }
            case "mode": {
                const data = [
                    "premium (Mode premium, hanya merespons pengguna premium dan owner)",
                    "group (Mode group, hanya merespons dalam grup)",
                    "private (Mode private, hanya merespons dalam obrolan pribadi)",
                    "public (Mode publik, merespons dalam grup dan obrolan pribadi)",
                    "self (Mode self, hanya merespons dirinya sendiri dan owner)"
                ];
                text = createList(data, (list) => `❖ ${list}`);
                break;
            }
            case "osettext": {
                const data = [
                    "donate - Variabel yang tersedia: %tag%, %name%, %prefix%, %command%, %footer%, %readmore% (Atur teks donasi)",
                    "price - Variabel yang tersedia: %tag%, %name%, %prefix%, %command%, %footer%, %readmore% (Atur teks harga)",
                    "qris (Atur gambar QRIS untuk donasi, gambar harus berupa link)"
                ];
                text = createList(data, (list) => `❖ ${list}`);
                break;
            }
            case "setoption": {
                const data = [
                    "antiaudio (Anti audio)",
                    "antidocument (Anti dokumen)",
                    "Antiimage (Anti gambar)",
                    "antisticker (Anti stiker)",
                    "antivideo (Anti video)",
                    "antigcsw (Anti GC SW)",
                    "antilink (Anti link)",
                    "antispam (Anti spam)",
                    "antitagsw (Anti Tag SW)",
                    "antitoxic (Anti toxic, seperti bahasa kasar)",
                    `autokick (Dikeluarkan secara otomatis, jika ada yang melanggar salah satu opsi ${ctx.format.inlineCode("anti...")})`,
                    "gamerestrict (Anggota dilarang bermain game)",
                    "welcome (Sambutan member)"
                ];
                text = createList(data, (list) => `❖ ${list}`);
                break;
            }
            case "settext": {
                const data = [
                    "goodbye (Teks goodbye, variabel yang tersedia: %tag%, %subject%, %description%)",
                    "intro (Teks intro)",
                    "welcome (Teks welcome, variabel yang tersedia: %tag%, %subject%, %description%)"
                ];
                text = createList(data, (list) => `❖ ${list}`);
                break;
            }
            default:
                text = ctx.format.info(`Tipe tidak diketahui: ${type}`);
        }
        return text;
    } catch (error) {
        return null;
    }
}

module.exports = {
    get
};