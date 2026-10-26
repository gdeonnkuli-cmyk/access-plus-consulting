import { apercuValidation, estPublie, lienGoogle, pVid } from "./contenu";

test("contenus visibles des apprenants", () => {
  expect(estPublie({ titre: "Vidéo de l'admin" })).toBe(true);
  expect(estPublie({ status: "approved", on: true })).toBe(true);
  expect(estPublie({ status: "draft" })).toBe(false);
  expect(estPublie({ status: "pending" })).toBe(false);
  expect(estPublie({ status: "rejected" })).toBe(false);
  expect(estPublie({ on: false })).toBe(false);
  expect(estPublie(null)).toBe(false);
});

test("aperçu des liens à valider", () => {
  expect(apercuValidation("https://youtu.be/dQw4w9WgXcQ", true)).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0");
  expect(apercuValidation("https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing", true)).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMn/preview");
  expect(apercuValidation("https://exemple.cd/video.mp4", true)).toBe(null);
  expect(apercuValidation("https://docs.google.com/presentation/d/1rbKociYSXcvVvmjyc7rhyA-1O2F1SkHE/edit?usp=drivesdk&rtpof=true&sd=true", false))
    .toBe("https://drive.google.com/file/d/1rbKociYSXcvVvmjyc7rhyA-1O2F1SkHE/preview");
  expect(apercuValidation("", false)).toBe(null);
  expect(lienGoogle("https://docs.google.com/presentation/d/x")).toBe(true);
  expect(lienGoogle("https://youtu.be/x")).toBe(false);
  expect(pVid("https://vimeo.com/123456").src).toBe("https://player.vimeo.com/video/123456");
});
