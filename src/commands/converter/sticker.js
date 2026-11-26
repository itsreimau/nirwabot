const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const util = require("node:util");
const Baileys = require("baileys");
const WebPMux = require("node-webpmux");
const WASF = require("wa-sticker-formatter");
const config = require("../../runtime/config");

const execFileAsync = util.promisify(execFile);

const MAX_DURATION = 20;
const MAX_STICKER_SIZE = 512 * 1024;
const MAX_AUDIO_SIZE = 950 * 1024;
const MAX_INPUT_SIZE = 32 * 1024 * 1024;
const AUDIO_MIMETYPE = "audio/ogg; codecs=opus";

const STICKER_LADDER = [
    { size: 512, fps: 15, quality: 60 },
    { size: 512, fps: 12, quality: 45 },
    { size: 384, fps: 12, quality: 45 },
    { size: 384, fps: 10, quality: 30 },
    { size: 320, fps: 10, quality: 30 },
    { size: 320, fps: 8, quality: 20 },
    { size: 256, fps: 8, quality: 20 },
    { size: 256, fps: 6, quality: 10 }
];
const TRIMMED_DURATIONS = [15, 10, 7, 5, 3];
const GALLOP_SIZE = 8 * MAX_STICKER_SIZE;

async function probeDurations(inputPath) {
    const { stdout } = await execFileAsync("ffprobe", [
        "-hide_banner",
        "-loglevel", "error",
        "-show_streams",
        "-show_format",
        "-of", "json",
        inputPath
    ], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
    });

    const probe = JSON.parse(stdout);
    const durationOf = (type) => {
        const stream = (probe.streams || []).find((item) => item.codec_type === type);
        if (!stream) return null;
        for (const value of [stream.duration, probe.format?.duration]) {
            const seconds = Number(value);
            if (Number.isFinite(seconds) && seconds > 0) return seconds;
        }
        return null;
    };

    return {
        video: durationOf("video"),
        audio: durationOf("audio")
    };
}

async function convertVideoToWebp(inputPath, outputPath, duration, size, fps, quality) {
    await execFileAsync("ffmpeg", [
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", inputPath,
        "-t", String(duration),
        "-vf", `fps=${fps},scale=${size}:${size}:force_original_aspect_ratio=increase,crop=${size}:${size}`,
        "-vcodec", "libwebp",
        "-loop", "0",
        "-preset", "default",
        "-an",
        "-vsync", "0",
        "-q:v", String(quality),
        outputPath
    ], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000
    });
}

async function convertAudioToOgg(inputPath, outputPath, duration, bitrate) {
    await execFileAsync("ffmpeg", [
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", inputPath,
        "-map", "0:a:0",
        "-t", String(duration),
        "-vn",
        "-c:a", "libopus",
        "-b:a", bitrate,
        "-ac", "1",
        "-ar", "48000",
        outputPath
    ], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120000
    });
}

function createStickerExif(packname, author) {
    const data = JSON.stringify({
        "sticker-pack-id": Date.now().toString(),
        "sticker-pack-name": packname || "",
        "sticker-pack-publisher": author || "",
        emojis: ["🌕"]
    });
    const exif = Buffer.concat([
        Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]),
        Buffer.from(data, "utf-8")
    ]);
    exif.writeUIntLE(Buffer.byteLength(data), 14, 4);
    return exif;
}

async function buildSticker(webp, packname, author) {
    try {
        const image = new WebPMux.Image();
        await image.load(webp);
        image.exif = createStickerExif(packname, author);
        return await image.save(null);
    } catch {
        return await new WASF.Sticker(webp, {
            pack: packname,
            author: author,
            type: WASF.StickerTypes.FULL,
            categories: ["🌕"],
            id: Date.now().toString(),
            quality: 50
        }).build();
    }
}

async function sendSoundSticker(sock, jid, webp, ogg, seconds, size) {
    const upload = { upload: sock.waUploadToServer };

    const { stickerMessage } = await Baileys.prepareWAMessageMedia({ sticker: webp }, upload);
    const { audioMessage } = await Baileys.prepareWAMessageMedia({ audio: ogg, mimetype: AUDIO_MIMETYPE, seconds }, upload);

    const message = {
        audioStickerMessage: {
            message: {
                stickerMessage: {
                    url: stickerMessage.url,
                    directPath: stickerMessage.directPath,
                    mediaKey: stickerMessage.mediaKey,
                    fileSha256: stickerMessage.fileSha256,
                    fileEncSha256: stickerMessage.fileEncSha256,
                    fileLength: stickerMessage.fileLength,
                    mediaKeyTimestamp: stickerMessage.mediaKeyTimestamp,
                    mimetype: stickerMessage.mimetype || "image/webp",
                    height: size,
                    width: size,
                    isAnimated: true,
                    audioMessage: {
                        url: audioMessage.url,
                        directPath: audioMessage.directPath,
                        mediaKey: audioMessage.mediaKey,
                        fileSha256: audioMessage.fileSha256,
                        fileEncSha256: audioMessage.fileEncSha256,
                        fileLength: audioMessage.fileLength,
                        mediaKeyTimestamp: audioMessage.mediaKeyTimestamp,
                        mimetype: AUDIO_MIMETYPE,
                        seconds
                    }
                }
            }
        }
    };

    return await sock.relayMessage(jid, message, {});
}

module.exports = {
    name: "sticker",
    aliases: ["s", "stiker"],
    category: "converter",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const isVideo = ctx.isMedia(["video"]);
        const isMedia = isVideo || ctx.isMedia(["image"]);

        if (!isMedia)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send", "reply"], ["image", "video"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "nama pack|nama author") + "\n" +
                ctx.format.generateNotes([
                    "Gambar menjadi stiker biasa; video otomatis menjadi stiker bersuara (animasi + audio asli video).",
                    "Pakai --silence untuk membuat stiker video tanpa suara.",
                    `Hanya ${MAX_DURATION} detik pertama video dan audio yang dipakai.`,
                    "Ukuran video maksimal 32 MB.",
                    "Suara hanya terdengar di WhatsApp yang sudah mendukung stiker bersuara."
                ])
            );

        const silent = /--silen(ce|t)\b/.test(ctx.text || "");
        const [packname, author] = (ctx.text || "")
            .replace(/--silen(ce|t)\b/g, "")
            .split("|")
            .map((part) => part?.trim());
        const pack = packname || config.sticker.packname;
        const publisher = author || config.sticker.author;
        const sendSilentSticker = async (buffer) => await ctx.reply({
            sticker: buffer
        }, {
            pack,
            author: publisher
        });

        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.msg.media.download();

            if (!buffer) return await ctx.reply(ctx.format.info("Media tidak dapat diunduh!"));

            if (!isVideo || silent) return await sendSilentSticker(buffer);

            if (buffer.length > MAX_INPUT_SIZE) return await ctx.reply(ctx.format.info("Video terlalu besar (maksimal 32 MB)!"));

            const videoMessage = ctx.msg.messageType === "videoMessage" ? ctx.msg.message?.videoMessage : ctx.quoted?.msg?.message?.videoMessage;
            const seconds = videoMessage?.seconds;

            if (seconds > MAX_DURATION)
                await ctx.reply(ctx.format.info(`Video lebih dari ${MAX_DURATION} detik, hanya ${MAX_DURATION} detik pertama yang dipakai.`));

            const base = path.join(os.tmpdir(), `sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`);
            const inputPath = `${base}.mp4`;
            const webpPath = `${base}.webp`;
            const oggPath = `${base}.ogg`;

            try {
                await fs.writeFile(inputPath, buffer);

                const durations = await probeDurations(inputPath);

                if (!durations.video) return await ctx.reply(ctx.format.info("Durasi video tidak dapat dibaca!"));

                if (!durations.audio) return await sendSilentSticker(buffer);

                const duration = Math.min(durations.video, durations.audio, MAX_DURATION);

                if (duration < 1) return await ctx.reply(ctx.format.info("Video terlalu pendek untuk dijadikan stiker!"));

                const attempts = STICKER_LADDER.map(rung => ({
                    ...rung,
                    duration
                }));
                for (const trimmed of TRIMMED_DURATIONS) {
                    if (trimmed >= duration) continue;
                    for (const rung of STICKER_LADDER.slice(-2)) attempts.push({
                        ...rung,
                        duration: trimmed
                    });
                }

                let webp = null;
                let usedDuration = duration;
                let usedSize = STICKER_LADDER[0].size;

                for (let i = 0; i < attempts.length; i++) {
                    const attempt = attempts[i];

                    await convertVideoToWebp(inputPath, webpPath, attempt.duration, attempt.size, attempt.fps, attempt.quality);

                    const raw = await fs.readFile(webpPath);

                    if (i === 0 && raw.length > GALLOP_SIZE) {
                        const jump = attempts.findIndex(item => item.size === 320 && item.duration === duration);
                        if (jump > i) {
                            i = jump - 1;
                            continue;
                        }
                    }

                    const built = await buildSticker(raw, pack, publisher);

                    if (built.length <= MAX_STICKER_SIZE) {
                        webp = built;
                        usedDuration = attempt.duration;
                        usedSize = attempt.size;
                        break;
                    }
                }

                if (!webp) return await ctx.reply(ctx.format.info("Video terlalu ramai untuk dijadikan stiker (melebihi 512 KB). Coba video yang lebih pendek atau lebih sederhana!"));

                if (usedDuration < duration)
                    await ctx.reply(ctx.format.info(`Stiker terlalu besar, durasi dipotong menjadi ${usedDuration} detik agar muat 512 KB.`));

                await convertAudioToOgg(inputPath, oggPath, usedDuration, "32k");

                let ogg = await fs.readFile(oggPath);

                if (ogg.length > MAX_AUDIO_SIZE) {
                    await convertAudioToOgg(inputPath, oggPath, usedDuration, "16k");
                    ogg = await fs.readFile(oggPath);
                }

                if (ogg.length > MAX_AUDIO_SIZE) return await ctx.reply(ctx.format.info("Audio video terlalu besar untuk stiker bersuara. Coba video yang lebih pendek!"));

                const audioSeconds = Math.min(MAX_DURATION, Math.max(1, Math.ceil(usedDuration)));

                await sendSoundSticker(ctx.core.core, ctx.id, webp, ogg, audioSeconds, usedSize);
            } finally {
                await fs.unlink(inputPath).catch(() => {});
                await fs.unlink(webpPath).catch(() => {});
                await fs.unlink(oggPath).catch(() => {});
            }
        } catch (error) {
            if (error.code === "ENOENT")
                return await ctx.reply(ctx.format.info("FFmpeg tidak ditemukan di server. Minta owner memasang FFmpeg agar perintah ini bisa digunakan."));

            await ctx.helper.reportError(ctx, error);
        }
    }
};
