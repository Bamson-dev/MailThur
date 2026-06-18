/**
 * IDOR PREVENTION PATTERN
 *
 * Every database query that fetches or modifies user-specific data MUST
 * filter by the authenticated user's identifier (userId or email).
 * NEVER trust an ID passed in the request alone — always scope queries
 * to the authenticated user.
 *
 * Example: To fetch a user's settings, always include userId in the WHERE clause:
 *   SELECT * FROM settings WHERE user_id = $authenticatedUserId
 *
 * NOT: SELECT * FROM settings WHERE id = $requestId
 *
 * The functions below demonstrate this pattern. Copy and adapt for every
 * real repository function built later.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Example: fetch a resource owned by the authenticated user.
 * The request may include a resourceId, but the query ALWAYS filters
 * by authenticatedUserId to prevent IDOR.
 */
export async function getUserResourceById(
  authenticatedUserId: string,
  resourceId: string
): Promise<{ id: string; userId: string; name: string } | null> {
  // IDOR prevention: always include authenticatedUserId in the filter.
  // Never query by resourceId alone.
  //
  // When a real database is connected, this becomes:
  //   return db.query(
  //     'SELECT id, user_id, name FROM resources WHERE id = $1 AND user_id = $2',
  //     [resourceId, authenticatedUserId]
  //   );
  //
  // The authenticatedUserId comes from the verified session/JWT,
  // never from request params or body.

  if (!authenticatedUserId || !resourceId) {
    return null;
  }

  // Stub: returns null until database is connected
  return null;
}

/**
 * Example: list all resources for the authenticated user.
 * No request-supplied user ID is accepted — only the authenticated identity.
 */
export async function listUserResources(
  authenticatedUserId: string
): Promise<Array<{ id: string; userId: string; name: string }>> {
  // IDOR prevention: query scoped exclusively to authenticatedUserId.
  //
  // When a real database is connected:
  //   return db.query(
  //     'SELECT id, user_id, name FROM resources WHERE user_id = $1',
  //     [authenticatedUserId]
  //   );

  if (!authenticatedUserId) {
    return [];
  }

  return [];
}
