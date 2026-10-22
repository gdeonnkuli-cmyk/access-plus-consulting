import { OFFRES, offresAvecPrix, parMois, nouveauCodeOffert, estCodeOffert, numerosRenseignes, utiliserCodeOffert } from "./acces";
import { texteInvitation } from "./AdminAcces";

test("les trois offres et leurs prix par défaut (5, 12, 40 USD)", () => {
  expect(OFFRES.map(o => [o.id, o.dureeId, o.prix])).toEqual([["m", "1m", 5], ["t", "3m", 12], ["a", "1a", 40]]);
  const o = offresAvecPrix({ prix: { m: 6, t: 0, a: "45" } });
  expect(o.map(x => x.prix)).toEqual([6, 12, 45]);
  expect(parMois(o[1])).toBe(4);
  expect(parMois(offresAvecPrix(null)[2])).toBe(3.33);
});

test("codes offerts : format OF- et alphabet sans caractères ambigus", () => {
  for (let i = 0; i < 200; i++) {
    const c = nouveauCodeOffert();
    expect(estCodeOffert(c)).toBe(true);
    expect(c.slice(3)).not.toMatch(/[01IO]/);
  }
  expect(estCodeOffert(" of-abcdefgh ")).toBe(true);
  expect(estCodeOffert("EC-ABCDEFGH")).toBe(false);
  expect(estCodeOffert("OF-ABC")).toBe(false);
});

test("seuls les numéros renseignés sont affichés", () => {
  expect(numerosRenseignes({ mpesa: "+243 81", airtel: " ", orange: "" }).map(o => o.k)).toEqual(["mpesa"]);
});

test("un code mal formé est refusé sans appel à la base", async () => {
  const r = await utiliserCodeOffert(null, "u1", {}, "XX-123");
  expect(r.ok).toBe(false);
});

test("le message d'invitation contient le code, la durée et le lien", () => {
  const t = texteInvitation("OF-ABCDEFGH", "3 mois");
  expect(t).toContain("OF-ABCDEFGH");
  expect(t).toContain("3 mois");
  expect(t).toContain("https://eco-campus-rdc.vercel.app");
});
