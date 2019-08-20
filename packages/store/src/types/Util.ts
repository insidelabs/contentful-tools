import { Content } from './Content';

export namespace Util {
    export type GetContentTypeId<E extends Content.Entry> = E['sys']['contentType']['sys']['id'];
}
