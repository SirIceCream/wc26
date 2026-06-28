export type ActiveChangelog = {
  body: string;
  items: string[];
  key: string;
  title: string;
};

export const ACTIVE_CHANGELOG: ActiveChangelog = {
  key: "knockout-start-2026-06-28",
  title: "Die K.o.-Phase startet",
  body: "Die Gruppenphase ist vorbei und alle Top-32-Spiele sind jetzt tippbar. Bitte vergesst nicht, eure Tipps rechtzeitig vor Anpfiff abzugeben.",
  items: [
    "Falls Achtelfinal-Paarungen bekannt werden, werden sie tippbar und visuell getrennt angezeigt.",
    "Die Torwette zeigt jetzt einen Prediction Meter mit Hochrechnung.",
    "Kleine UI-Polishes wurden verbessert.",
  ],
};
