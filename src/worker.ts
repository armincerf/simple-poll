import { routePartykitRequest, getServerByName } from 'partyserver';
import { PollRoom } from './do/PollRoom';

export interface Env extends Record<string, unknown> {
  pollroom: DurableObjectNamespace;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    // Try PartyServer routing first
    const partyResponse = await routePartykitRequest(req, env);
    if (partyResponse) {
      return partyResponse;
    }

    // Route API requests directly to the appropriate PartyServer room
    if (pathname.startsWith('/api/')) {
      let pollId: number;
      
      if (pathname.startsWith('/api/vote')) {
        // For vote requests, get the poll ID from the request body
        const { id } = (await req.clone().json()) as { id: number };
        if (typeof id !== 'number') {
          return new Response('Missing or invalid poll ID', { status: 400 });
        }
        pollId = id;
      } else {
        // For other API requests, get the poll ID from query parameters
        const urlParams = new URL(req.url);
        pollId = Number.parseInt(urlParams.searchParams.get('id') || '1');
      }
      
      // Use PartyServer's getServerByName utility
      const room = await getServerByName(env.pollroom, String(pollId));
      return room.fetch(req);
    }

    // Handle static assets first
    if (pathname.startsWith('/assets/')) {
      if (env.ASSETS?.fetch) {
        try {
          return await env.ASSETS.fetch(req);
        } catch (e) {
          return new Response('Asset not found', { status: 404 });
        }
      } else {
        return new Response('Assets not available in local mode', { status: 404 });
      }
    }

    // For all other requests, pass through to the assets system
    if (env.ASSETS?.fetch) {
      return await env.ASSETS.fetch(req);
    }
    
    // Fallback if no assets system available
    return new Response('Not found', { status: 404 });
  },
};



export { PollRoom }; 