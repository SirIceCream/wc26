export type ActiveChangelog = {
  body: string;
  items: string[];
  key: string;
  title: string;
};

export const ACTIVE_CHANGELOG: ActiveChangelog = {
  key: "dashboard-updates-2026-06-18",
  title: "Changelog",
  body: "Hallo, der erste Spieltag aller Gruppen ist vorbei. Bitte vergesst nicht, eure Tipps rechtzeitig vor Anpfiff abzugeben. Es gibt ein paar Updates:",
  items: [
    "Tipps können in der Match-Detailansicht jetzt als Excel-Datei heruntergeladen werden. Klickt dafür in einem Spiel einfach auf das XLSX-Symbol.",
    "In der Rangliste könnt ihr jetzt auf die Namen der Mitspieler klicken und deren Profil ansehen. So seht ihr, woher die Gewinne kommen oder mit welchen argen Tipps jemand immer noch nichts gewonnen hat.",
    "Für Feature Requests oder Feedback könnt ihr Jack Bot direkt über das neue WhatsApp-Symbol in der Topbar anschreiben.",
  ],
};
