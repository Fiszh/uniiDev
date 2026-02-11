interface validatedUser {
    login: string;
    id: string;
}

interface validateData {
    client_id: string;
    login: string;
    scopes: string[];
    user_id: string,
    expires_in: number
}

export async function validateToken(token: string): Promise<validatedUser | false> {
    const res = await fetch("https://id.twitch.tv/oauth2/validate", {
        headers: {
            "Authorization": `OAuth ${token}`
        }
    })

    if (!res.ok) return false;

    const data = await res.json() as validateData;

    return {
        login: data.login,
        id: data.user_id
    }
}