export const sleep = (ms:number) => new Promise((resolve) => setTimeout(resolve, ms));

export function generatePassword(length = 10) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

export function isNumber(valor: string): boolean {
  // Convierte el string a número y verifica que sea un número válido y no esté vacío
  return !isNaN(Number(valor)) && valor.trim() !== '';
}

export const divideInBLocks = <T>(arr: T[], tamaño: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / tamaño) }, (_, i) =>
    arr.slice(i * tamaño, i * tamaño + tamaño)
  );
};

// Código numérico único para un pack nuevo: fecha/hora (YYYYMMDDHHmmss) + 3 dígitos al azar,
// para evitar choques si se crean dos packs en el mismo segundo. Mismo formato que ya usan los packs existentes.
export function generatePackCode(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${timestamp}${random}`;
}

// Convierte un nombre en un slug para URL: minúsculas, sin tildes, espacios y símbolos como "-".
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
/** 'YYYY-MM-DD' → 'DD/MM/YYYY' sin pasar por Date (evita corrimientos por zona horaria). */
export function formatDay(value: string): string {
  return value.split('-').reverse().join('/');
}
