import { estMasculine, lireReglagesVoix } from "./LecteurAudio";

test("repérage des voix masculines", () => {
  expect(estMasculine({ name: "Microsoft Paul - French (France)" })).toBe(true);
  expect(estMasculine({ name: "Google français" })).toBe(false);
  expect(estMasculine({ name: "Microsoft Hortense - French (France)" })).toBe(false);
  expect(estMasculine({ name: "French France", voiceURI: "fr-fr-x-frd-local" })).toBe(true);
  expect(estMasculine(null)).toBe(false);
});

test("réglage par défaut : voix d’homme", () => {
  localStorage.removeItem("ec_audio_voix");
  expect(lireReglagesVoix()).toEqual({ mode: "homme", voix: "" });
  localStorage.setItem("ec_audio_voix", JSON.stringify({ mode: "femme", voix: "X" }));
  expect(lireReglagesVoix()).toEqual({ mode: "femme", voix: "X" });
});
