import { embedPresentation, srcIframe } from "./presentation";

test("Google Slides et fichier Drive", () => {
  expect(embedPresentation("https://docs.google.com/presentation/d/AbC_123-xyz/pub?start=false").src).toMatch(/presentation\/d\/AbC_123-xyz\/embed/);
  expect(embedPresentation("https://docs.google.com/presentation/d/1rbKociYSXcvVvmjyc7rhyA-1O2F1SkHE/edit?usp=drivesdk&ouid=1170&rtpof=true&sd=true").src).toBe("https://drive.google.com/file/d/1rbKociYSXcvVvmjyc7rhyA-1O2F1SkHE/preview");
  expect(embedPresentation("https://drive.google.com/file/d/1na2KJz0RuXa_fLayEtNFbgvS0shMMAxW/view?usp=sharing").src).toBe("https://drive.google.com/file/d/1na2KJz0RuXa_fLayEtNFbgvS0shMMAxW/preview");
});

test("OneDrive : lien d'intégration, code <iframe>, conversion des liens resid, sinon ouverture externe", () => {
  const code = '<iframe src="https://onedrive.live.com/embed?resid=ABC%21123&amp;authkey=%21XYZ&amp;em=2" width="402" height="327" frameborder="0" scrolling="no"></iframe>';
  expect(srcIframe(code)).toBe("https://onedrive.live.com/embed?resid=ABC%21123&authkey=%21XYZ&em=2");
  expect(embedPresentation(code)).toEqual({ src: "https://onedrive.live.com/embed?resid=ABC%21123&authkey=%21XYZ&em=2", hebergeur: "onedrive" });
  expect(embedPresentation("https://onedrive.live.com/redir?resid=ABC!123&authkey=!XYZ&ithint=file%2cpptx").src).toBe("https://onedrive.live.com/embed?resid=ABC!123&authkey=!XYZ&em=2");
  expect(embedPresentation("https://onedrive.live.com/?cid=ABC&id=ABC!456&authkey=!K").src).toMatch(/embed\?resid=ABC!456&authkey=!K&em=2$/);
  expect(embedPresentation("https://1drv.ms/p/s!AbCdEf123")).toEqual({ src: null, hebergeur: "onedrive" });
  expect(embedPresentation("https://x-my.sharepoint.com/:p:/g/personal/a/EaBc")).toEqual({ src: null, hebergeur: "onedrive" });
  expect(embedPresentation("https://x.sharepoint.com/sites/s/_layouts/15/Doc.aspx?sourcedoc={1}&file=a.pptx").src).toMatch(/action=embedview$/);
});

test("Canva, autres liens et saisies invalides", () => {
  expect(embedPresentation("https://www.canva.com/design/DAF/view?embed").hebergeur).toBe("canva");
  expect(embedPresentation("https://exemple.cd/cours.pdf")).toEqual({ src: "https://exemple.cd/cours.pdf", hebergeur: "autre" });
  expect(embedPresentation("pas un lien").src).toBe(null);
});
