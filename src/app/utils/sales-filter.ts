import { isSaleMethod, ISalesFilter } from "../types/sales.types";
import { isNumber } from "./other";

// Filtro de /admin/sales y de su CSV a partir de la query string:
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD (ambos incluidos) &pack=<pack_id> &method=paypal|coupon
//   ?all=1 → sin filtro de fechas. Sin from/to ni all: el mes en curso.
// Las fechas se interpretan en la hora del servidor.

export interface SalesQuery {
    from?: string
    to?: string
    pack?: string
    method?: string
    all?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' de una fecha (hora del servidor). */
export const toDateInput = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDay = (value: string | undefined): Date | null => {
    if (!value || !DATE_RE.test(value)) {
        return null;
    }
    const date = new Date(`${value}T00:00:00`);
    return isNaN(date.getTime()) ? null : date;
}

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export interface ParsedSalesFilter {
    filter: ISalesFilter
    /** Valores normalizados para los campos del formulario y los enlaces ('' = sin valor). */
    values: { from: string, to: string, pack: string, method: string, all: boolean }
    /** Query string equivalente (para la paginación y el CSV). */
    query: Record<string, string>
}

export function parseSalesFilter(params: SalesQuery, now: Date = new Date()): ParsedSalesFilter {
    const all = params.all === '1';
    let from = parseDay(params.from);
    let to = parseDay(params.to);
    if (!all && from === null && to === null) {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = addDays(new Date(now.getFullYear(), now.getMonth() + 1, 1), -1);
    }
    const pack_id = params.pack !== undefined && isNumber(params.pack) ? Number(params.pack) : undefined;
    const method = isSaleMethod(params.method) ? params.method : undefined;

    const values = {
        from: !all && from ? toDateInput(from) : '',
        to: !all && to ? toDateInput(to) : '',
        pack: pack_id !== undefined ? String(pack_id) : '',
        method: method ?? '',
        all,
    };
    const query: Record<string, string> = {};
    if (all) query.all = '1';
    if (values.from) query.from = values.from;
    if (values.to) query.to = values.to;
    if (values.pack) query.pack = values.pack;
    if (values.method) query.method = values.method;

    return {
        filter: {
            from: all ? undefined : from ?? undefined,
            // `to` es inclusive en la URL: se filtra hasta el inicio del día siguiente.
            to: all || to === null ? undefined : addDays(to, 1),
            pack_id,
            method,
        },
        values,
        query,
    };
}

/** Rangos rápidos de la vista. */
export function salesPresets(now: Date = new Date()): { label: string, query: Record<string, string> }[] {
    const firstThis = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return [
        { label: 'Este mes', query: { from: toDateInput(firstThis), to: toDateInput(addDays(new Date(now.getFullYear(), now.getMonth() + 1, 1), -1)) } },
        { label: 'Mes anterior', query: { from: toDateInput(firstPrev), to: toDateInput(addDays(firstThis, -1)) } },
        { label: 'Últimos 30 días', query: { from: toDateInput(addDays(now, -29)), to: toDateInput(now) } },
        { label: 'Este año', query: { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` } },
        { label: 'Todo', query: { all: '1' } },
    ];
}
