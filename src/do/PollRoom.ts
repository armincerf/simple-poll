import { Server } from 'partyserver';

export class PollRoom extends Server {
  sql: any;

  override async onStart() {
    this.sql = this.ctx.storage.sql;
    await this.initializeSchema();
  }

  async initializeSchema() {
    await this.sql.exec(`
      CREATE TABLE IF NOT EXISTS votes (
        id      INTEGER,
        answer  TEXT,
        session TEXT,
        ts      INTEGER
      );
      CREATE INDEX IF NOT EXISTS vote_idx ON votes(id, session);
    `);
  }

  override async onConnect(connection: any) {
    console.log('🔌 New connection:', connection.id);
    
    // Extract poll ID from the room name and send initial tally
    const pollId = Number(this.name);
    if (pollId) {
      try {
        const tally = await this.tally(pollId);
        connection.send(JSON.stringify(tally));
        console.log('📊 Sent initial tally to connection:', tally);
      } catch (error) {
        console.error('Error sending initial tally:', error);
      }
    }
  }

  override async onMessage(connection: any, message: string) {
    // Handle any incoming messages if needed
    console.log('📨 Message from', connection.id, ':', message);
  }

  override async onClose(connection: any, code: number, reason: string, wasClean: boolean) {
    console.log(`🔌 Connection ${connection.id} closed: ${code} ${reason} (clean: ${wasClean})`);
  }

  override async onError(connection: any, error: any) {
    console.error('❌ Connection error:', error);
  }

  override async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith('/api/vote')) {
      try {
        const body = await request.json() as { id: number; answer: string; session: string };
        const { id, answer, session } = body;
        await this.addVote(id, answer, session);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'content-type': 'application/json' },
        });
      } catch (error) {
        return new Response(`Invalid request body: ${error}`, { status: 400 });
      }
    }

    if (pathname.startsWith('/api/tally')) {
      try {
        const url = new URL(request.url);
        const pollId = Number.parseInt(url.searchParams.get('id') || '1');
        const tally = await this.tally(pollId);
        return new Response(JSON.stringify(tally), {
          headers: { 'content-type': 'application/json' },
        });
      } catch (error) {
        return new Response(`Error getting tally: ${error}`, { status: 500 });
      }
    }

    if (pathname.startsWith('/api/cleanup')) {
      try {
        const url = new URL(request.url);
        const pollId = Number.parseInt(url.searchParams.get('id') || '999');
        await this.cleanup(pollId);
        return new Response(JSON.stringify({ success: true, message: `Cleaned up poll ${pollId}` }), {
          headers: { 'content-type': 'application/json' },
        });
      } catch (error) {
        return new Response(`Error during cleanup: ${error}`, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }

  async addVote(id: number, answer: string, sess: string): Promise<void> {
    // Use direct exec for INSERT operations
    await this.sql.exec('INSERT INTO votes (id, answer, session, ts) VALUES (?, ?, ?, ?)', 
                        id, answer, sess, Date.now());

    const newTally = await this.tally(id);
    // Use PartyServer's broadcast method
    this.broadcast(JSON.stringify(newTally));
    console.log('📢 Broadcasted updated tally:', newTally);
  }

  async tally(id: number): Promise<Record<string, number>> {
    // Use direct exec for SELECT operations
    const results = await this.sql.exec('SELECT answer, COUNT(*) AS count FROM votes WHERE id = ? GROUP BY answer', id);
    
    const tally: Record<string, number> = {};
    // Handle the results array directly
    for (const row of results) {
      tally[row.answer as string] = row.count as number;
    }
    return tally;
  }

  async cleanup(id: number): Promise<void> {
    // Delete all votes for a specific poll ID
    await this.sql.exec('DELETE FROM votes WHERE id = ?', id);
  }
} 