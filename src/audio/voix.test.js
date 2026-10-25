import { cleFiche, cleFisc, cleModule, extensionAudio, formatDuree, lectureVoix } from "./voix";

test("clés des contenus", () => {
  expect([cleFisc("F11"), cleFiche("41"), cleModule("m3")]).toEqual(["FISC-F11", "FICHE-41", "MOD-m3"]);
});

test("lecture d'un lien : Google Drive en aperçu, fichier direct en <audio>", () => {
  expect(lectureVoix("https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing")).toEqual({ mode: "drive", src: "https://drive.google.com/file/d/1AbCdEfGhIjKlMn/preview" });
  expect(lectureVoix("https://firebasestorage.googleapis.com/v0/b/x/o/audios%2FFISC-F11%2F1.webm?alt=media")).toMatchObject({ mode: "audio" });
  expect(lectureVoix("pas un lien")).toBe(null);
});

test("format et extension", () => {
  expect(formatDuree(125)).toBe("2:05");
  expect([extensionAudio("audio/webm;codecs=opus"), extensionAudio("audio/mp4"), extensionAudio("audio/ogg")]).toEqual(["webm", "m4a", "ogg"]);
});
