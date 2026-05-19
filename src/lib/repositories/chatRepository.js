import db from '../db';

/**
 * ChatRepository
 * Abstracts all SurrealDB operations for KAi chats (wiki table records with typ = 'kai').
 */
export const chatRepository = {
  /**
   * Fetches all KAi chats sorted by pinned status and last modified time.
   */
  fetchChats: async () => {
    try {
      const res = await db.query(
        'SELECT * FROM wiki WHERE typ = "kai" ORDER BY pinned DESC, geaendert DESC'
      );
      const data = res[0]?.result || res[0] || [];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Subscribes to live changes on the wiki table.
   * Callback should handle action and result, filtering by typ = "kai".
   */
  subscribeChatsLive: async (callback) => {
    try {
      const liveQuery = await db.live('wiki', callback);
      return {
        data: () => {
          if (liveQuery && typeof liveQuery.kill === 'function') {
            liveQuery.kill().catch(() => {});
          }
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Loads related wiki context for a project to feed into the prompt context.
   */
  loadWikiContext: async (projectName) => {
    if (!projectName) return { data: [], error: null };
    try {
      const res = await db.query(
        'SELECT inhalt FROM wiki WHERE projekt = $name OR typ = "system" LIMIT 5',
        { name: projectName }
      );
      const data = res[0]?.result || res[0] || [];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Creates a new chat record.
   */
  createChat: async (projekt, titel, inhalt) => {
    try {
      const res = await db.query(
        `CREATE wiki SET
          projekt = $projekt,
          typ = "kai",
          titel = $titel,
          inhalt = $inhalt,
          status = "open",
          erstellt = time::now(),
          geaendert = time::now()`,
        { projekt, titel, inhalt }
      );
      const data = res[0]?.result?.[0] || res[0]?.[0];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Updates the serialized message history of a chat.
   */
  updateChatContent: async (id, inhalt) => {
    try {
      const res = await db.query(
        `UPDATE $id MERGE {
          inhalt: $inhalt,
          geaendert: time::now()
        }`,
        { id, inhalt }
      );
      const data = res[0]?.result?.[0] || res[0]?.[0];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Updates only the title of a chat.
   */
  updateChatTitle: async (id, titel) => {
    try {
      const res = await db.query('UPDATE $id MERGE { titel: $titel }', { id, titel });
      const data = res[0]?.result?.[0] || res[0]?.[0];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Toggles the pinned status of a chat.
   */
  toggleChatPin: async (id, pinned) => {
    try {
      const res = await db.query('UPDATE $id MERGE { pinned: $pinned }', { id, pinned });
      const data = res[0]?.result?.[0] || res[0]?.[0];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  /**
   * Deletes a chat record.
   */
  deleteChat: async (id) => {
    try {
      await db.query('DELETE $id', { id });
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  }
};
