"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { cn } from "@/lib/utils"

export type TimelineItem = {
  /** id del elemento DOM de la sección a la que hay que saltar. */
  id: string
  /** Nombre del mes tal como se muestra (ej: "agosto 2026"). */
  label: string
}

interface TimelineScrubberProps {
  items: TimelineItem[]
}

// Distancia (px) desde el borde superior para decidir cuál es el mes activo.
// Deja libre la barra de navegación pegajosa.
const UMBRAL_MES_ACTIVO = 128

// Cuánto queda visible el rótulo flotante después de dejar de scrollear.
const MS_ROTULO = 1200

/**
 * Barra de desplazamiento cronológica estilo Google Fotos.
 * Va pegada al borde derecho y permite saltar entre los meses de la lista.
 */
export function TimelineScrubber({ items }: TimelineScrubberProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showLabel, setShowLabel] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const hideTimeoutRef = useRef<number | null>(null)
  const dragRef = useRef({ active: false, moved: false, startY: 0, index: 0 })

  // Firma estable de los meses: el efecto depende de esto y no de la
  // identidad del array, que cambia en cada render del padre.
  const idsKey = items.map((item) => item.id).join("|")

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior) => {
    const item = itemsRef.current[index]
    if (!item) return
    const el = document.getElementById(item.id)
    if (!el) return
    el.scrollIntoView({ behavior, block: "start" })
  }, [])

  // Traduce la posición vertical del puntero a un índice de mes.
  const indexFromPointer = useCallback((clientY: number) => {
    const el = trackRef.current
    const total = itemsRef.current.length
    if (!el || total === 0) return 0
    const rect = el.getBoundingClientRect()
    const ratio = rect.height === 0 ? 0 : (clientY - rect.top) / rect.height
    const clamped = Math.min(1, Math.max(0, ratio))
    return Math.round(clamped * (total - 1))
  }, [])

  // Seguimiento del mes activo + rótulo flotante con listener de scroll,
  // throttled con requestAnimationFrame para no re-renderizar de más.
  useEffect(() => {
    const update = (mostrarRotulo: boolean) => {
      const list = itemsRef.current
      if (list.length === 0) return

      let current = 0
      list.forEach((item, index) => {
        const el = document.getElementById(item.id)
        if (!el) return
        if (el.getBoundingClientRect().top - UMBRAL_MES_ACTIVO <= 0) {
          current = index
        }
      })

      // En el fondo la última sección puede no llegar al umbral.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) current = list.length - 1

      setActiveIndex(current)

      if (!mostrarRotulo) return
      setShowLabel(true)
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowLabel(false)
      }, MS_ROTULO)
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        update(true)
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    update(false)

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [idsKey])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (itemsRef.current.length === 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      moved: false,
      startY: event.clientY,
      index: indexFromPointer(event.clientY),
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active) return

    // Un pequeño desplazamiento distingue el click (saltar suave) del drag.
    if (!drag.moved && Math.abs(event.clientY - drag.startY) > 3) {
      drag.moved = true
    }
    if (!drag.moved) return

    const index = indexFromPointer(event.clientY)
    if (index === drag.index) return
    drag.index = index
    setActiveIndex(index)
    setShowLabel(true)
    scrollToIndex(index, "auto")
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active) return
    drag.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const index = indexFromPointer(event.clientY)
    setActiveIndex(index)
    if (!drag.moved) {
      scrollToIndex(index, "smooth")
    }
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  if (items.length === 0) return null

  const safeIndex = Math.min(activeIndex, items.length - 1)
  const activePct = items.length <= 1 ? 50 : (safeIndex / (items.length - 1)) * 100

  return (
    <div className="group fixed right-0 top-1/2 z-40 -translate-y-1/2 select-none">
      {/* Rótulo flotante del mes activo, se desvanece solo al dejar de scrollear */}
      <div
        aria-hidden={!showLabel}
        style={{ top: `${activePct}%` }}
        className={cn(
          "pointer-events-none absolute right-full z-10 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white shadow-md transition-opacity duration-500",
          showLabel ? "opacity-100" : "opacity-0",
        )}
      >
        {items[safeIndex]?.label}
      </div>

      {/* Pista: recibe los eventos de puntero para click y drag */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="flex h-[70vh] min-h-[260px] max-h-[720px] cursor-pointer touch-none flex-col items-end justify-between py-1 pr-1"
      >
        {items.map((item, index) => (
          <div key={item.id} className="group/tick relative flex w-full items-center justify-end">
            {/* Nombre del mes de ESTA marca, solo al pasar el mouse por encima (desktop) */}
            <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-[11px] font-medium text-brand-700 opacity-0 shadow-sm ring-1 ring-border transition-opacity duration-150 group-hover/tick:opacity-100 md:block">
              {item.label}
            </span>
            <span
              className={cn(
                "block rounded-full transition-all duration-200",
                index === safeIndex
                  ? "h-1.5 w-7 bg-brand-600"
                  : "h-[3px] w-4 bg-brand-100 group-hover:w-6",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
