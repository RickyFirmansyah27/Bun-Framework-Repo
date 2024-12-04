import { routes } from '@stricjs/app';

export default routes()
    .get('/', () => new Response('Hi'));