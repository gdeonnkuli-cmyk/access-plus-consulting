import { tirerSerie } from "./tirage";

const banque = Array.from({ length: 15 }, (_, i) => ({ q: `Q${i}`, r: [`bonne ${i}`, "x", "y", "z"], b: 0, e: "", art: "" }));

test("une série compte 10 questions distinctes, propositions mélangées sans perdre la bonne réponse", () => {
  const s = tirerSerie(banque);
  expect(s).toHaveLength(10);
  expect(new Set(s.map(q => q.idx)).size).toBe(10);
  s.forEach(q => { expect(q.r[q.b]).toBe(`bonne ${q.idx}`); expect([...q.r].sort()).toEqual([`bonne ${q.idx}`, "x", "y", "z"].sort()); });
});

test("à chaque nouvel essai, au moins 30 % des questions changent", () => {
  let prec = tirerSerie(banque).map(q => q.idx);
  for (let k = 0; k < 200; k++) {
    const s = tirerSerie(banque, prec).map(q => q.idx);
    expect(s.filter(i => !prec.includes(i)).length).toBeGreaterThanOrEqual(3);
    prec = s;
  }
});

test("la bonne réponse ne reste pas toujours à la même place", () => {
  const places = new Set(Array.from({ length: 50 }, () => tirerSerie(banque).map(q => q.b)).flat());
  expect(places.size).toBe(4);
});

test("une banque de 10 questions est simplement mélangée", () => {
  const s = tirerSerie(banque.slice(0, 10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(s).toHaveLength(10);
});
