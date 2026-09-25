import { NextResponse } from "next/server"
import { ReportScheduler } from "@/lib/report-scheduler"

// Nunca se cachea: cada llamada tiene que mirar los pedidos del momento.
export const dynamic = "force-dynamic"

/**
 * Genera el reporte semanal. La llama el cron de Vercel los miercoles a las
 * 13:59 UTC, que son las 10:59 en Argentina.
 *
 * Si esta configurada CRON_SECRET, solo responde a quien la mande: asi nadie de
 * afuera puede disparar la generacion.
 *
 * Si no hay pedidos sin reportar, no genera nada. Por eso se puede llamar mas de
 * una vez sin duplicar: la segunda vez no encuentra pedidos y no hace nada.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET
  if (secreto && request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const reporte = await ReportScheduler.generateAutomaticReport()

    if (!reporte) {
      return NextResponse.json({
        ok: true,
        generado: false,
        motivo: "No hay pedidos sin reportar",
      })
    }

    return NextResponse.json({
      ok: true,
      generado: true,
      id: reporte.id,
      pedidos: reporte.pedidos_incluidos.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
