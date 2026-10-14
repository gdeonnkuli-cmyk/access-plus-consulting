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


def fond(W=W, H=H):
    """Dégradé bleu nuit + halo doré discret."""
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(NAVY[i] * (1 - k) + NAVY2[i] * k) for i in range(3)))
    halo = Image.new("L", (W, H), 0)
    ImageDraw.Draw(halo).ellipse((W * .1, -300 * H / 1920, W * .9, 700 * H / 1920), fill=70)
    halo = halo.filter(ImageFilter.GaussianBlur(160))
    im.paste(Image.new("RGB", (W, H), GOLD), (0, 0), halo.point(lambda v: v // 3))
    return im


def centre(d, y, texte, f, couleur, cx=None):
    w = d.textlength(texte, font=f)
    d.text(((cx if cx is not None else W / 2) - w / 2, y), texte, font=f, fill=couleur)


def logo(im, taille, y, x=None):
    lg = Image.open(LOGO).convert("RGBA").resize((taille, taille), Image.LANCZOS)
    masque = Image.new("L", (taille, taille), 0)
    ImageDraw.Draw(masque).rounded_rectangle((0, 0, taille, taille), radius=int(taille * .22), fill=255)
    ombre = Image.new("RGBA", (taille + 80, taille + 80), (0, 0, 0, 0))
    ImageDraw.Draw(ombre).rounded_rectangle((40, 50, taille + 40, taille + 50), radius=int(taille * .22), fill=(0, 0, 0, 110))
    ombre = ombre.filter(ImageFilter.GaussianBlur(22))
    x = (im.width - taille) // 2 if x is None else x
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
    mots, lignes, cur = texte.split(" "), [], ""  # les espaces insécables restent collés
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


# ── Formats carrés (Facebook, WhatsApp) ────────────────────────────────────
C = 1080


def qr_carte(im, x, y, taille):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=12)
    q.add_data(LIEN)
    q.make(fit=True)
    m = int(taille * .055)
    qi = q.make_image(fill_color=NAVY, back_color="white").convert("RGB").resize((taille - 2 * m, taille - 2 * m), Image.NEAREST)
    ImageDraw.Draw(im).rounded_rectangle((x, y, x + taille, y + taille), radius=int(taille * .08), fill=WHITE)
    im.paste(qi, (x + m, y + m))


def carre_affiche(sortie):
    """Affiche tout-en-un : message + QR code + SMS."""
    im = fond(C, C)
    d = ImageDraw.Draw(im)
    logo(im, 190, 60, 70)
    d.text((300, 70), "Mbote na bino bandeko !", font=font("si", 40), fill=CREAM)
    d.text((300, 120), "ÉQUATEUR • BIKORO", font=font("b", 58), fill=GOLD)
    d.text((300, 195), "Nos cantiques Nyembo", font=font("b", 44), fill=WHITE)
    d.text((300, 245), "dans votre téléphone !", font=font("b", 44), fill=WHITE)
    d.rectangle((70, 330, C - 70, 333), fill=GOLD)
    # colonne gauche : atouts
    y = 385
    for t in ["450 cantiques", "Dans notre langue", "Sans internet", "Chorales & solistes", "Enregistrez votre voix"]:
        coche(d, 70, y, 22)
        d.text((125, y - 2), t, font=font("b", 38), fill=WHITE)
        y += 78
    # colonne droite : QR
    qr_carte(im, 640, 370, 370)
    centre(d, 752, "Scannez pour installer", font("r", 28), MUTED, cx=825)
    # bandeau bas
    d.rounded_rectangle((70, 820, C - 70, 940), radius=30, fill=GOLD)
    centre(d, 838, "Application Android  •  Accès complet par SMS", font("b", 34), NAVY)
    centre(d, 885, "0894 405 989", font("b", 42), NAVY)
    centre(d, 975, "Partagez à toute la famille !", font("si", 36), CREAM)
    im.save(sortie, quality=95)


def carre1(sortie):
    im = fond(C, C)
    d = ImageDraw.Draw(im)
    logo(im, 330, 70)
    centre(d, 445, "Mbote na bino bandeko !", font("si", 46), CREAM)
    centre(d, 515, "ÉQUATEUR", font("b", 90), GOLD)
    centre(d, 615, "BIKORO", font("b", 120), WHITE)
    d.rectangle((C / 2 - 100, 768, C / 2 + 100, 773), fill=GOLD)
    centre(d, 800, "Nos cantiques Nyembo sont maintenant", font("b", 46), CREAM)
    centre(d, 860, "dans votre téléphone !", font("b", 46), CREAM)
    centre(d, 960, "450 cantiques  •  dans notre langue  •  sans internet", font("r", 32), MUTED)
    im.save(sortie, quality=95)


def carre2(sortie, capture):
    im = fond(C, C)
    d = ImageDraw.Draw(im)
    d.text((70, 70), "Tout le recueil", font=font("b", 64), fill=WHITE)
    d.text((70, 145), "dans votre poche", font=font("s", 56), fill=GOLD)
    sc = Image.open(capture)
    larg = 340
    haut = int(sc.height * larg / sc.width)
    # téléphone recadré dans le carré
    tmp = Image.new("RGB", (C, C + 400))
    tmp.paste(im, (0, 0))
    telephone(tmp, capture, 680, 90, larg)
    im = tmp.crop((0, 0, C, C))
    d = ImageDraw.Draw(im)
    y = 280
    for t, sub in [("450 cantiques", "en langue originale"), ("Recherche", "numéro, titre ou paroles"),
                   ("Sans internet", "une fois installée"), ("Écoutez", "solistes et chorales"),
                   ("Chantez !", "enregistrez et partagez")]:
        coche(d, 70, y + 2, 24)
        d.text((130, y - 4), t, font=font("b", 42), fill=WHITE)
        d.text((130, y + 46), sub, font=font("r", 30), fill=MUTED)
        y += 140
    # dégradé de fondu sous le téléphone
    fondu = Image.new("L", (C, 220), 0)
    for i in range(220):
        ImageDraw.Draw(fondu).line([(0, i), (C, i)], fill=int(255 * i / 220))
    im.paste(Image.new("RGB", (C, 220), NAVY2), (0, C - 220), fondu)
    centre(d := ImageDraw.Draw(im), 1000, "Pour la chorale, la famille et le culte", font("si", 38), CREAM)
    im.save(sortie, quality=95)


def carre3(sortie):
    im = fond(C, C)
    d = ImageDraw.Draw(im)
    logo(im, 130, 60, 70)
    d.text((230, 65), "Téléchargez", font=font("b", 66), fill=WHITE)
    d.text((230, 140), "l'application maintenant", font=font("s", 44), fill=GOLD)
    qr_carte(im, 70, 260, 470)
    centre(d, 745, "Scannez avec l'appareil photo", font("r", 28), MUTED, cx=305)
    y = 290
    for i, e in enumerate(["Scannez le code\u00a0QR", "Ouvrez «\u00a0Nyembo.apk\u00a0»", "Touchez «\u00a0Installer\u00a0»"], 1):
        d.ellipse((590, y, 646, y + 56), fill=GOLD)
        d.text((618 - d.textlength(str(i), font=font("b", 36)) / 2, y + 8), str(i), font=font("b", 36), fill=NAVY)
        for k, l in enumerate(_couper(d, e, font("b", 36), 340)):
            d.text((665, y + 8 + k * 44), l, font=font("b", 36), fill=WHITE)
        y += 140
    d.rounded_rectangle((70, 820, C - 70, 960), radius=30, outline=GOLD, width=3)
    centre(d, 840, "Accès complet aux 450 cantiques :", font("b", 36), CREAM)
    centre(d, 892, "code par SMS au 0894 405 989", font("r", 38), CREAM)
    centre(d, 990, "Cantiques Nyembo  •  Application Android", font("r", 28), MUTED)
    im.save(sortie, quality=95)


if __name__ == "__main__":
    out, liste, _cantique = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(out, exist_ok=True)
    diapo1(os.path.join(out, "Nyembo-TikTok-1.png"))
    diapo2(os.path.join(out, "Nyembo-TikTok-2.png"), liste)
    diapo3(os.path.join(out, "Nyembo-TikTok-3.png"))
    carre_affiche(os.path.join(out, "Nyembo-Carre-Affiche.png"))
    carre1(os.path.join(out, "Nyembo-Carre-1.png"))
    carre2(os.path.join(out, "Nyembo-Carre-2.png"), liste)
    carre3(os.path.join(out, "Nyembo-Carre-3.png"))
