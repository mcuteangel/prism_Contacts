// ===== NEW FILE (src/services/AuthRepository.ts) =====
import { db } from './database';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';

class AuthRepository {
  /**
   * Reads the auth state from the local database.
   * @returns The stored session and profile, or null if not found.
   */
  async getAuthState() {
    // We always use id=1 because it's a singleton state
    return await db.auth_state.get(1);
  }

  /**
   * Saves the user's session and profile to the local database.
   * @param session - The user's Supabase session object.
   * @param profile - The user's profile data.
   */
  async saveAuthState(session: Session, profile: Profile) {
    await db.auth_state.put({
      id: 1, // Singleton pattern - only one auth state exists
      session,
      profile,
      lastAuthenticated: new Date(),
    });
  }

  /**
   * Clears the authentication state from the local database on logout.
   */
  async clearAuthState() {
    await db.auth_state.clear();
  }
}

export const authRepository = new AuthRepository();
