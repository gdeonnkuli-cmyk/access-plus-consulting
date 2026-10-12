"""Génère le recueil imprimable (PDF A4, deux colonnes) à partir de www/data/cantiques.json.

Usage : python3 tools/generer_pdf.py sortie.pdf [mot_de_passe]
"""
import json
import os
import secrets
import sys
import unicodedata
from io import BytesIO
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from pypdf.constants import UserAccessPermissions as P
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether, NextPageTemplate,
                                PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle)

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
DATA = os.path.join(RACINE, "www", "data", "cantiques.json")
LOGO = os.path.join(RACINE, "assets", "icon-only.png")
LIEN_APP = "https://github.com/gdeonnkuli-cmyk/access-plus-consulting/releases/download/nyembo-latest/Nyembo.apk"
TEL = "0894 405 989"
EMAIL = "gnkuli@outlook.fr"

NAVY, GOLD, GOLD_D, GREY, LINE = HexColor("#022556"), HexColor("#E8B04A"), HexColor("#A8761C"), HexColor("#5B6680"), HexColor("#D9DEE8")

F = "/usr/share/fonts/truetype/liberation/"
for nom, fichier in [("Serif", "LiberationSerif-Regular"), ("Serif-B", "LiberationSerif-Bold"),
                     ("Serif-I", "LiberationSerif-Italic"), ("Serif-BI", "LiberationSerif-BoldItalic"),
                     ("Sans", "LiberationSans-Regular"), ("Sans-B", "LiberationSans-Bold")]:
    pdfmetrics.registerFont(TTFont(nom, F + fichier + ".ttf"))
pdfmetrics.registerFontFamily("Serif", normal="Serif", bold="Serif-B", italic="Serif-I", boldItalic="Serif-BI")

W, H = A4
MARGE_X, MARGE_HAUT, MARGE_BAS = 15 * mm, 18 * mm, 15 * mm
GOUTTIERE = 9 * mm

S = {
    "num": ParagraphStyle("num", fontName="Sans-B", fontSize=7.5, textColor=GOLD_D, leading=9, spaceAfter=1),
    "titre": ParagraphStyle("titre", fontName="Serif-B", fontSize=12.5, textColor=NAVY, leading=15),
    "melodie": ParagraphStyle("melodie", fontName="Serif-I", fontSize=8, textColor=GREY, leading=10, spaceAfter=5),
    "sn": ParagraphStyle("sn", fontName="Sans-B", fontSize=9, textColor=GOLD_D, leading=13.2, alignment=TA_RIGHT),
    "vers": ParagraphStyle("vers", fontName="Serif", fontSize=10.5, leading=13.2, textColor=HexColor("#14213D")),
    "refrain": ParagraphStyle("refrain", fontName="Serif-I", fontSize=10.5, leading=13.2, textColor=HexColor("#14213D")),
    "reflabel": ParagraphStyle("reflabel", fontName="Sans-B", fontSize=6.5, textColor=GOLD_D, leading=8),
    "auteur": ParagraphStyle("auteur", fontName="Sans", fontSize=7, textColor=GREY, alignment=TA_RIGHT, leading=9),
    "h1": ParagraphStyle("h1", fontName="Serif-B", fontSize=16, textColor=NAVY, leading=20, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName="Sans-B", fontSize=9, textColor=GOLD_D, leading=12, spaceBefore=8, spaceAfter=3),
    "txt": ParagraphStyle("txt", fontName="Serif", fontSize=10, leading=13.5, textColor=HexColor("#14213D"), spaceAfter=5),
    "petit": ParagraphStyle("petit", fontName="Sans", fontSize=7.5, leading=10, textColor=GREY),
    "idx": ParagraphStyle("idx", fontName="Serif", fontSize=8.2, leading=10.2, leftIndent=8, firstLineIndent=-8),
    "lettre": ParagraphStyle("lettre", fontName="Sans-B", fontSize=10, textColor=GOLD_D, leading=13, spaceBefore=4),
    "rub": ParagraphStyle("rub", fontName="Serif", fontSize=9.5, leading=11.5),
}


def sans_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


class Marque(Flowable):
    """Repère invisible : numéro de cantique (en-tête de page) et signet."""
    def __init__(self, n=None, titre=None, section=None):
        super().__init__()
        self.n, self.titre, self.section = n, titre, section
        self.width = self.height = 0

    def draw(self):
        c = self.canv
        if self.section:
            cle = "s" + str(abs(hash(self.section)))
            c.bookmarkPage(cle)
            c.addOutlineEntry(self.section.title(), cle, level=0)
            c._sec_vu = True
        if self.n:
            cle = f"c{self.n}"
            c.bookmarkPage(cle)
            c.addOutlineEntry(f"{self.n}. {self.titre}", cle, level=1 if getattr(c, "_sec_vu", False) else 0)
            c._nums.append(self.n)


class Bandeau(Flowable):
    """Titre de rubrique : bandeau bleu nuit, texte doré."""
    def __init__(self, texte, largeur):
        super().__init__()
        self.texte, self.width, self.height = texte, largeur, 12 * mm

    def draw(self):
        c = self.canv
        c.setFillColor(NAVY)
        c.roundRect(0, 2 * mm, self.width, 9 * mm, 2 * mm, stroke=0, fill=1)
        c.setFillColor(GOLD)
        c.setFont("Sans-B", 8.5 if len(self.texte) < 45 else 7)
        c.drawCentredString(self.width / 2, 5.3 * mm, self.texte.upper())


class Filet(Flowable):
    def __init__(self, largeur):
        super().__init__()
        self.width, self.height = largeur, 5 * mm

    def draw(self):
        c, m = self.canv, self.width / 2
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.line(m - 22 * mm, 2.5 * mm, m - 3 * mm, 2.5 * mm)
        c.line(m + 3 * mm, 2.5 * mm, m + 22 * mm, 2.5 * mm)
        c.setFillColor(GOLD)
        c.circle(m, 2.5 * mm, 0.9 * mm, stroke=0, fill=1)


def lignes(t):
    return "<br/>".join(escape(l) for l in t.split("\n"))


def cantique(h, largeur, avant=()):
    tete = [*avant, Spacer(1, 7), Marque(h["n"], h["titre"]),
            Paragraph(f"CANTIQUE {h['n']}", S["num"]),
            Paragraph(escape(h["titre"]), S["titre"]),
            Paragraph(escape(h["melodie"]), S["melodie"]) if h.get("melodie") else Spacer(1, 4)]
    parties = []
    for p in h["parties"]:
        if p["type"] == "strophe":
            t = Table([[Paragraph(str(p["n"]), S["sn"]), Paragraph(lignes(p["texte"]), S["vers"])]],
                      colWidths=[7 * mm, largeur - 7 * mm])
            t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (0, 0), 3 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                                   ("TOPPADDING", (0, 0), (-1, -1), 0)]))
        else:
            t = Table([[Paragraph("REFRAIN", S["reflabel"])], [Paragraph(lignes(p["texte"]), S["refrain"])]],
                      colWidths=[largeur - 12 * mm])
            t.setStyle(TableStyle([("LINEBEFORE", (0, 0), (0, -1), 1.6, GOLD), ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                                   ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
            t.hAlign = "RIGHT"
        parties.append(t)
    fin = [Paragraph(escape(h["auteur"]), S["auteur"])] if h.get("auteur") else []
    nb_lignes = sum(len(p["texte"].split("\n")) + 1 for p in h["parties"])
    if nb_lignes <= 18:  # cantique court : jamais coupé
        return [KeepTogether(tete + parties + fin)]
    # cantique long : coupé seulement entre deux strophes, jamais après le titre ni avant l'auteur
    if fin:
        parties[-1] = KeepTogether([parties[-1]] + fin)
    return [KeepTogether(tete + parties[:1])] + parties[1:]


def qr(url, taille):
    w = QrCodeWidget(url)
    x0, y0, x1, y1 = w.getBounds()
    d = Drawing(taille, taille, transform=[taille / (x1 - x0), 0, 0, taille / (y1 - y0), 0, 0])
    d.add(w)
    return d


class Recueil(BaseDocTemplate):
    def __init__(self, cible, **kw):
        super().__init__(cible, pagesize=A4, title="Recueil de cantiques Nyembo", author="Gédéon Nkuli",
                         subject="450 cantiques — édition imprimable", **kw)
        cw = W - 2 * MARGE_X
        fh = H - MARGE_HAUT - MARGE_BAS
        col = (cw - GOUTTIERE) / 2
        self.largeur, self.colonne = cw, col
        deux = lambda p: [Frame(MARGE_X, MARGE_BAS, col, fh, id=p + "1", leftPadding=0, rightPadding=0),
                          Frame(MARGE_X + col + GOUTTIERE, MARGE_BAS, col, fh, id=p + "2", leftPadding=0, rightPadding=0)]
        self.addPageTemplates([
            PageTemplate("couverture", [Frame(0, 0, W, H, id="c")], onPage=self.couverture),
            PageTemplate("simple", [Frame(MARGE_X + 20 * mm, MARGE_BAS, cw - 40 * mm, fh, id="s", leftPadding=0, rightPadding=0)],
                         onPage=self.debut_page, onPageEnd=self.fin_page),
            PageTemplate("texte", deux("t"), onPage=self.debut_page, onPageEnd=self.fin_page),
            PageTemplate("index", [Frame(MARGE_X + i * (cw + 6 * mm) / 3, MARGE_BAS, (cw - 12 * mm) / 3, fh, id=f"i{i}",
                                         leftPadding=0, rightPadding=0) for i in range(3)],
                         onPage=self.debut_page, onPageEnd=self.fin_page),
        ])

    def couverture(self, c, doc):
        c.setFillColor(NAVY)
        c.rect(0, 0, W, H, stroke=0, fill=1)
        t = 130 * mm
        c.drawImage(LOGO, (W - t) / 2, H - 45 * mm - t, t, t, mask="auto")
        c.setFillColor(GOLD)
        c.rect(W / 2 - 25 * mm, 100 * mm, 50 * mm, 0.8 * mm, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Sans-B", 19)
        c.drawCentredString(W / 2, 85 * mm, "RECUEIL DE CANTIQUES")
        c.setFont("Serif-I", 14)
        c.setFillColor(HexColor("#FBF1DC"))
        c.drawCentredString(W / 2, 74 * mm, "450 cantiques · textes en langue originale")
        c.setFillColor(GOLD)
        c.setFont("Sans", 11)
        c.drawCentredString(W / 2, 30 * mm, "CHANTER  •  CÉLÉBRER  •  TRANSMETTRE")
        c.setFillColor(HexColor("#9AA6BF"))
        c.setFont("Sans", 9)
        c.drawCentredString(W / 2, 20 * mm, "Édition communautaire")

    def debut_page(self, c, doc):
        c._nums = []

    def fin_page(self, c, doc):
        p = c.getPageNumber()
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.5)
        c.line(MARGE_X, H - 11 * mm, W - MARGE_X, H - 11 * mm)
        c.setFont("Sans-B", 7)
        c.setFillColor(NAVY)
        c.drawString(MARGE_X, H - 9.5 * mm, "NYEMBO")
        nums = getattr(c, "_nums", [])
        if nums:
            c.setFillColor(GOLD_D)
            c.setFont("Sans-B", 8)
            r = str(nums[0]) if len(nums) == 1 else f"{nums[0]} – {nums[-1]}"
            c.drawRightString(W - MARGE_X, H - 9.5 * mm, r)
        c.setFont("Sans", 7.5)
        c.setFillColor(GREY)
        c.drawCentredString(W / 2, 8 * mm, str(p))


def construire(cantiques):
    buf = BytesIO()
    doc = Recueil(buf, leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0)
    lw = doc.largeur - 40 * mm   # pages d'introduction (une colonne centrée)
    cw = doc.colonne              # colonnes des cantiques
    st = [NextPageTemplate("simple"), PageBreak()]

    # Page de présentation
    st += [Paragraph("Recueil de cantiques Nyembo", S["h1"]),
           Paragraph("Ce recueil réunit les <b>450 cantiques</b> de l'édition communautaire Nyembo, conservés dans leur "
                     "langue originale : paroles, mélodies de référence, refrains et auteurs.", S["txt"]),
           Paragraph("L'APPLICATION « CANTIQUES NYEMBO »", S["h2"]),
           Paragraph("Retrouvez tout le recueil sur votre téléphone Android : recherche par numéro, titre ou paroles, "
                     "favoris, lecture hors connexion, et les <b>enregistrements</b> des solistes et chorales.", S["txt"])]
    t = Table([[qr(LIEN_APP, 30 * mm),
                Paragraph("Scannez pour télécharger l'application, puis ouvrez le fichier et touchez « Installer ».<br/><br/>"
                          f"<b>Accès complet</b> (450 cantiques et enregistrements) : demandez votre code par SMS au <b>{TEL}</b>.",
                          S["petit"])]], colWidths=[34 * mm, lw - 34 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F5F7FB")),
                           ("LEFTPADDING", (1, 0), (1, 0), 3 * mm), ("RIGHTPADDING", (1, 0), (1, 0), 3 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 2 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm)]))
    st += [Spacer(1, 4), t,
           Paragraph("SOUTENIR LE PROJET", S["h2"]),
           Paragraph(f"Toute contribution à la réalisation et aux mises à jour est la bienvenue par <b>Orange Money : {TEL}</b> "
                     "(Gédéon Nkuli). Merci pour votre générosité.", S["txt"]),
           Paragraph("REMARQUES ET CORRECTIONS", S["h2"]),
           Paragraph(f"Une erreur dans les paroles, une proposition ? Écrivez à <b>{EMAIL}</b>.", S["txt"])]

    # Table des rubriques
    rubs = []
    for h in cantiques:
        s = h.get("section") or ""
        if not rubs or rubs[-1][0] != s:
            rubs.append([s, h["n"], h["n"]])
        else:
            rubs[-1][2] = h["n"]
    st += [PageBreak(), Paragraph("Rubriques", S["h1"])]
    rows = [[Paragraph(escape(s.capitalize()) if s else "<i>Cantiques sans rubrique</i>", S["rub"]),
             Paragraph(f"{a}" + (f" – {b}" if b != a else ""), ParagraphStyle("r", parent=S["rub"], alignment=TA_RIGHT,
                                                                                textColor=GOLD_D, fontName="Sans-B"))]
            for s, a, b in rubs]
    t = Table(rows, colWidths=[lw - 22 * mm, 22 * mm])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1.6),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 1.6), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    st += [t, NextPageTemplate("texte"), PageBreak()]

    # Cantiques
    section = object()
    for h in cantiques:
        s = h.get("section") or ""
        if s != section:
            section = s
            # le bandeau de rubrique reste toujours collé à son premier cantique
            st += cantique(h, cw, [Marque(section=s), Bandeau(s, cw)] if s else ())
        else:
            st += cantique(h, cw)

    # Index alphabétique (deux colonnes)
    st += [NextPageTemplate("index"), PageBreak(), Paragraph("Index alphabétique", S["h1"])]
    lettre = None
    for h in sorted(cantiques, key=lambda x: sans_accents(x["titre"]).upper().lstrip("“\"'« ")):
        l0 = sans_accents(h["titre"]).upper().lstrip("“\"'« ")[:1]
        if l0 != lettre:
            lettre = l0
            st.append(Paragraph(lettre, S["lettre"]))
        st.append(Paragraph(f"{escape(h['titre'])} <font name='Sans-B' color='#A8761C'>{h['n']}</font>", S["idx"]))
    doc.build(st)
    return buf.getvalue()


def main():
    sortie = sys.argv[1]
    mdp = sys.argv[2] if len(sys.argv) > 2 else None
    with open(DATA, encoding="utf-8") as f:
        cantiques = json.load(f)
    brut = construire(cantiques)
    if not mdp:
        open(sortie, "wb").write(brut)
        return
    lecteur = PdfReader(BytesIO(brut))
    w = PdfWriter(clone_from=lecteur)
    proprio = secrets.token_urlsafe(12)
    # Ouverture protégée par mot de passe ; impression autorisée, modification et copie interdites
    w.encrypt(user_password=mdp, owner_password=proprio, algorithm="AES-256",
              permissions_flag=P.PRINT | P.PRINT_TO_REPRESENTATION)
    with open(sortie, "wb") as f:
        w.write(f)
    print(f"Mot de passe propriétaire (modification) : {proprio}")


if __name__ == "__main__":
    main()
