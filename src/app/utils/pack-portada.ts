// Servidor: arma la portada de un pack (incluida su URL). Igual que en las páginas: un anónimo ve la
// versión censurada (pública) de una página gratis; un usuario logueado, la del bucket privado sin censura.
// Si la portada no es una página gratis (el pack no tiene ninguna), solo existe sin censura: a un anónimo
// se le devuelve url vacía y los componentes muestran un hueco en su lugar.
import { packImageUrl } from './pack-images';
import { PAGE_TYPE } from './page-access';

interface IPortadaPage {
    num: string
    page_type_id: number
    page_size: { size: { extension: string, name: string } }[]
}

/** Portada de un pack a partir de la página elegida en los repositorios (gratis primero, luego la de menor número). */
export async function packPortada(code: string, page: IPortadaPage, loggedIn: boolean) {
    const { extension, name } = page.page_size[0].size;
    const free = page.page_type_id === PAGE_TYPE.FREE;
    return {
        extension,
        name,
        num: page.num,
        url: !loggedIn && !free
            ? ''
            : await packImageUrl({ code, size: name, num: page.num, extension, censored: !loggedIn && free }),
    };
}
