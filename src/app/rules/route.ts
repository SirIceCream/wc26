import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const RULES_FILE = "Regelwerk Online Jackpotspiel Fussball WM 2026 V5.pdf";

export async function GET() {
  const file = await readFile(join(process.cwd(), "rules", RULES_FILE));

  return new NextResponse(file, {
    headers: {
      "Content-Disposition": `inline; filename="${RULES_FILE}"`,
      "Content-Type": "application/pdf",
    },
  });
}
