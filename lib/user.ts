import { db } from "./db";
import type { User } from "./db/types";

export async function upsertUserFromGoogleProfile(
  googleId: string,
  email: string,
  name: string,
  picture: string,
): Promise<User> {
  const query = `
    INSERT INTO orange_users (google_id, email, name, picture)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (google_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      email = EXCLUDED.email
    RETURNING id, google_id, email, name, picture;
  `;
  try {
    const res = await db.query<User>(query, [googleId, email, name, picture]);
    return res.rows[0];
  } catch (error) {
    console.error(`Error upserting user: ${error}`);
    throw new Error("Could not create or update user profile.");
  }
}
