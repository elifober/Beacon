export interface AuthSession {
    isAuthenticated: boolean,
    userName: string | null,
    email: string | null,
    roles: string[],
    /** Present when the Identity user is linked to a `Supporter` row (`IdentityUserId`). */
    supporterId?: number | null,
}