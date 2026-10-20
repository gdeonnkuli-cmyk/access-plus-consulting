# E-mails Éco-Campus (EmailJS)

Le design des e-mails est produit par l'application (`src/emails.js`) et envoyé à EmailJS dans la variable `html`.
Dans le tableau de bord EmailJS, les deux modèles contiennent uniquement :

```
{{{html}}}
```

- `template_3v1a6i6` : code d'accès
- `template_aisjy5e` : notifications
- **From Name** des deux modèles : `Éco-Campus RDC`

Les fichiers `code-acces.html` et `notification.html` sont des versions autonomes du même design, à utiliser
seulement si l'on revient à des modèles EmailJS sans `{{{html}}}`.
