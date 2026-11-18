import { NextRequest, NextResponse } from "next/server";
import { TicketErrorKey } from "@/src/app/types/ticket.types";

// Utilidades compartidas por las rutas de /api/ticket (archivo privado: no es una ruta).

/** IP del cliente detrás del proxy de CapRover, para limitar a quien escribe sin sesión. */
export const clientIp = (request: NextRequest): string =>
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';

/** Error esperable: `message` es la clave que el cliente traduce (soporte.error.*). */
export const ticketError = (key: TicketErrorKey, status = 400) =>
    NextResponse.json({ success: false, message: key }, { status });

/** Texto recortado y sin espacios sobrantes; '' si no es un string. */
export const cleanText = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
