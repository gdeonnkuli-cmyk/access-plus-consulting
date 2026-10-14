"""Carrousel TikTok (3 images 1080x1920) pour annoncer l'application Cantiques Nyembo.

Usage : python3 tools/visuels_tiktok.py dossier_sortie capture_liste.png capture_cantique.png
"""
import os
import sys

import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ICI = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(os.path.dirname(ICI), "assets", "icon-only.png")
LIEN = "https://github.com/gdeonnkuli-cmyk/access-plus-consulting/releases/download/nyembo-latest/Nyembo.apk"

W, H = 1080, 1920
NAVY, NAVY2 = (2, 37, 86), (1, 20, 52)
GOLD, CREAM, WHITE, MUTED = (232, 176, 74), (251, 241, 220), (255, 255, 255), (168, 182, 210)
F = "/usr/share/fonts/truetype/"
def font(nom, t):
    return ImageFont.truetype(F + {"b": "liberation/LiberationSans-Bold.ttf", "r": "liberation/LiberationSans-Regular.ttf",
                                   "s": "liberation/LiberationSerif-BoldItalic.ttf", "si": "liberation/LiberationSerif-Italic.ttf"}[nom], t)


def fond():
    """Dégradé bleu nuit + halo doré discret."""
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(NAVY[i] * (1 - k) + NAVY2[i] * k) for i in range(3)))
    halo = Image.new("L", (W, H), 0)
    ImageDraw.Draw(halo).ellipse((W * .1, -300, W * .9, 700), fill=70)
    halo = halo.filter(ImageFilter.GaussianBlur(160))
    im.paste(Image.new("RGB", (W, H), GOLD), (0, 0), halo.point(lambda v: v // 3))
    return im


def centre(d, y, texte, f, couleur):
    w = d.textlength(texte, font=f)
    d.text(((W - w) / 2, y), texte, font=f, fill=couleur)


def logo(im, taille, y):
    lg = Image.open(LOGO).convert("RGBA").resize((taille, taille), Image.LANCZOS)
    masque = Image.new("L", (taille, taille), 0)
    ImageDraw.Draw(masque).rounded_rectangle((0, 0, taille, taille), radius=int(taille * .22), fill=255)
    ombre = Image.new("RGBA", (taille + 80, taille + 80), (0, 0, 0, 0))
    ImageDraw.Draw(ombre).rounded_rectangle((40, 50, taille + 40, taille + 50), radius=int(taille * .22), fill=(0, 0, 0, 110))
    ombre = ombre.filter(ImageFilter.GaussianBlur(22))
    x = (W - taille) // 2
    im.paste(ombre, (x - 40, y - 40), ombre)
    im.paste(lg, (x, y), masque)
    # liseré doré
    ImageDraw.Draw(im).rounded_rectangle((x - 3, y - 3, x + taille + 3, y + taille + 3), radius=int(taille * .22) + 3,
                                         outline=GOLD, width=3)


def telephone(im, capture, x, y, largeur):
    sc = Image.open(capture).convert("RGB")
    h = int(sc.height * largeur / sc.width)
    sc = sc.resize((largeur, h), Image.LANCZOS)
    b = 22
    cadre = Image.new("RGBA", (largeur + 2 * b, h + 2 * b), (0, 0, 0, 0))
    ImageDraw.Draw(cadre).rounded_rectangle((0, 0, largeur + 2 * b - 1, h + 2 * b - 1), radius=70, fill=(12, 16, 28))
    m = Image.new("L", (largeur, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, largeur, h), radius=50, fill=255)
    cadre.paste(sc, (b, b), m)
    ombre = Image.new("RGBA", (cadre.width + 120, cadre.height + 120), (0, 0, 0, 0))
    ImageDraw.Draw(ombre).rounded_rectangle((60, 75, cadre.width + 60, cadre.height + 75), radius=70, fill=(0, 0, 0, 140))
    ombre = ombre.filter(ImageFilter.GaussianBlur(30))
    im.paste(ombre, (x - 60, y - 60), ombre)
    im.paste(cadre, (x, y), cadre)


def coche(d, x, y, r=26):
    d.ellipse((x, y, x + 2 * r, y + 2 * r), fill=GOLD)
    d.line([(x + r * .55, y + r * 1.02), (x + r * .88, y + r * 1.38), (x + r * 1.5, y + r * .62)], fill=NAVY, width=7)


def pied(d, texte="Cantiques Nyembo  •  Application Android"):
    centre(d, 1630, texte, font("r", 30), MUTED)


def diapo1(sortie):
    im = fond()
    logo(im, 380, 150)
    d = ImageDraw.Draw(im)
    centre(d, 590, "Mbote na bino bandeko !", font("si", 52), CREAM)
    centre(d, 680, "ÉQUATEUR", font("b", 112), GOLD)
    centre(d, 800, "BIKORO", font("b", 150), WHITE)
    d.rectangle((W / 2 - 110, 985, W / 2 + 110, 991), fill=GOLD)
    for i, l in enumerate(["Nos cantiques Nyembo", "sont maintenant", "dans votre téléphone !"]):
        centre(d, 1030 + i * 78, l, font("b", 64), CREAM)
    centre(d, 1290, "450 cantiques  •  dans notre langue  •  sans internet", font("r", 36), MUTED)
    d.rounded_rectangle((W / 2 - 300, 1410, W / 2 + 300, 1530), radius=60, fill=GOLD)
    centre(d, 1440, "Glissez pour découvrir  →", font("b", 46), NAVY)
    pied(d)
    im.save(sortie, quality=95)


def diapo2(sortie, capture):
    im = fond()
    d = ImageDraw.Draw(im)
    lg = Image.open(LOGO).convert("RGBA").resize((130, 130), Image.LANCZOS)
    mk = Image.new("L", (130, 130), 0)
    ImageDraw.Draw(mk).rounded_rectangle((0, 0, 130, 130), radius=30, fill=255)
    im.paste(lg, (70, 90), mk)
    d.text((230, 100), "Tout le recueil", font=font("b", 66), fill=WHITE)
    d.text((230, 175), "dans votre poche", font=font("s", 58), fill=GOLD)
    telephone(im, capture, 560, 330, 400)
    items = [("450 cantiques", "en langue originale"), ("Recherche", "par numéro, titre ou paroles"),
             ("Sans internet", "une fois installée"), ("Écoutez", "solistes et chorales"),
             ("Chantez !", "enregistrez votre voix et partagez")]
    y = 400
    for t, s in items:
        coche(d, 60, y + 4)
        d.text((140, y - 2), t, font=font("b", 46), fill=WHITE)
        y2 = y + 56
        for ligne in _couper(d, s, font("r", 32), 400):
            d.text((140, y2), ligne, font=font("r", 32), fill=MUTED)
            y2 += 40
        y = y2 + 62
    centre(d, 1330, "Pour la chorale, la famille, le culte", font("si", 46), CREAM)
    centre(d, 1395, "et la louange à la maison.", font("si", 46), CREAM)
    pied(d)
    im.save(sortie, quality=95)


def _couper(d, texte, f, largeur):
    mots, lignes, cur = texte.split(), [], ""
    for m in mots:
        t = (cur + " " + m).strip()
        if d.textlength(t, font=f) <= largeur:
            cur = t
        else:
            lignes.append(cur)
            cur = m
    return lignes + [cur]


def diapo3(sortie):
    im = fond()
    d = ImageDraw.Draw(im)
    logo(im, 170, 100)
    centre(d, 310, "Téléchargez", font("b", 92), WHITE)
    centre(d, 415, "l'application maintenant", font("s", 62), GOLD)
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=12)
    q.add_data(LIEN)
    q.make(fit=True)
    qi = q.make_image(fill_color=NAVY, back_color="white").convert("RGB").resize((500, 500), Image.NEAREST)
    cx, cy = (W - 560) // 2, 530
    d.rounded_rectangle((cx, cy, cx + 560, cy + 560), radius=44, fill=WHITE)
    im.paste(qi, (cx + 30, cy + 30))
    centre(d, cy + 585, "Scannez avec l'appareil photo", font("r", 34), MUTED)
    etapes = ["Scannez le code QR", "Ouvrez le fichier « Nyembo.apk »", "Touchez « Installer »"]
    y = 1200
    for i, e in enumerate(etapes, 1):
        d.ellipse((110, y, 170, y + 60), fill=GOLD)
        n = str(i)
        d.text((140 - d.textlength(n, font=font("b", 38)) / 2, y + 9), n, font=font("b", 38), fill=NAVY)
        d.text((195, y + 8), e, font=font("b", 40), fill=WHITE)
        y += 82
    d.rounded_rectangle((70, 1460, W - 70, 1580), radius=30, outline=GOLD, width=3)
    centre(d, 1478, "Accès complet aux 450 cantiques :", font("b", 34), CREAM)
    centre(d, 1525, "code par SMS au 0894 405 989", font("r", 34), CREAM)
    pied(d, "Lien de téléchargement dans la description")
    im.save(sortie, quality=95)


if __name__ == "__main__":
    out, liste, _cantique = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(out, exist_ok=True)
    diapo1(os.path.join(out, "Nyembo-TikTok-1.png"))
    diapo2(os.path.join(out, "Nyembo-TikTok-2.png"), liste)
    diapo3(os.path.join(out, "Nyembo-TikTok-3.png"))
