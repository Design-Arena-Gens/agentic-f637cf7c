import { Howl, Howler } from "howler";
const createToneDataUri = ({ duration, frequency, sampleRate = 22050, volume = 0.4, type = "sine" }) => {
    const totalSamples = Math.floor(duration * sampleRate);
    const buffer = new Array(totalSamples * 2);
    const generateSample = (i) => {
        const t = i / sampleRate;
        const omega = 2 * Math.PI * frequency * t;
        switch (type) {
            case "square":
                return Math.sign(Math.sin(omega)) * volume;
            case "triangle":
                return (2 / Math.PI) * Math.asin(Math.sin(omega)) * volume;
            case "sine":
            default:
                return Math.sin(omega) * volume;
        }
    };
    for (let i = 0; i < totalSamples; i += 1) {
        const sample = generateSample(i);
        const v = Math.max(-1, Math.min(1, sample));
        const intSample = Math.floor(v * 32767);
        buffer[i * 2] = intSample & 0xff;
        buffer[i * 2 + 1] = (intSample >> 8) & 0xff;
    }
    const header = [
        ...Buffer.from("RIFF", "ascii"),
        ...[0, 0, 0, 0],
        ...Buffer.from("WAVEfmt ", "ascii"),
        16,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        sampleRate & 0xff,
        (sampleRate >> 8) & 0xff,
        (sampleRate >> 16) & 0xff,
        (sampleRate >> 24) & 0xff,
        sampleRate & 0xff,
        (sampleRate >> 8) & 0xff,
        (sampleRate >> 16) & 0xff,
        (sampleRate >> 24) & 0xff,
        2,
        0,
        16,
        0,
        ...Buffer.from("data", "ascii"),
        (buffer.length) & 0xff,
        (buffer.length >> 8) & 0xff,
        (buffer.length >> 16) & 0xff,
        (buffer.length >> 24) & 0xff
    ];
    const wavBuffer = Uint8Array.from([...header, ...buffer]);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < wavBuffer.length; i += chunkSize) {
        const chunk = wavBuffer.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    const encode = typeof btoa === "function"
        ? btoa
        : (input) => Buffer.from(input, "binary").toString("base64");
    const base64 = encode(binary);
    return `data:audio/wav;base64,${base64}`;
};
class Soundscape {
    constructor() {
        this.ambient = new Howl({
            src: [
                createToneDataUri({
                    duration: 4,
                    frequency: 176,
                    volume: 0.15,
                    type: "sine"
                })
            ],
            loop: true
        });
        this.combat = new Howl({
            src: [
                createToneDataUri({
                    duration: 2,
                    frequency: 320,
                    volume: 0.2,
                    type: "square"
                })
            ],
            loop: true
        });
        this.village = new Howl({
            src: [
                createToneDataUri({
                    duration: 3,
                    frequency: 220,
                    volume: 0.12,
                    type: "triangle"
                })
            ],
            loop: true
        });
        this.footsteps = new Howl({
            src: [
                createToneDataUri({
                    duration: 0.15,
                    frequency: 120,
                    volume: 0.25,
                    type: "square"
                })
            ],
            rate: 2.4
        });
    }
    stopAll() {
        Howler.stop();
    }
    playAmbient() {
        if (!this.ambient.playing())
            this.ambient.play();
    }
    playVillage() {
        if (!this.village.playing())
            this.village.play();
    }
    playCombat() {
        if (!this.combat.playing())
            this.combat.play();
    }
    playFootstep() {
        this.footsteps.play();
    }
}
export const soundscape = new Soundscape();
