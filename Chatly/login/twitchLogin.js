const CLIENT_ID = '21qux3t2dcl32rsxazz912b4kuulof';
const REDIRECT_URI = 'https://unii.dev/uchat/login/';
const AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

const SCOPES = 'user:read:chat user:write:chat user:read:follows user:read:emotes user:read:blocked_users user:manage:blocked_users chat:read chat:edit channel:moderate whispers:read whispers:edit';

const authButton = document.getElementById('login_button');
const copied_info = document.getElementById('copied');

function setCookie(name, value) {
    const expires = new Date(Date.now() + 3600 * 1000).toUTCString(); // EXPIRE THE COOKIE IN 1 HOUR
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [key, value] = cookie.split('=');
        if (key === name) return value;
    }
    return null;
}

async function handleToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        try {
            const userDataResponse = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            if (userDataResponse.ok) {
                const userData = await userDataResponse.json();

                console.log('User Data:', userData);

                setCookie("token_data", JSON.stringify({ "auth": accessToken, ...userData }));

                window.location.href = REDIRECT_URI;
            } else {
                alert('Failed to fetch user data');
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            console.error('Error processing access token:', error);
        }
    } else {

    }
}

handleToken();

const token_data = getCookie("token_data")

if (token_data) {
    copied_info.style.display = "unset";
}

copied_info.addEventListener("click", () => {
    navigator.clipboard.writeText(token_data)
        .then(() => copied_info.innerHTML = "Login information copied to clipboard.")
        .catch(() => copied_info.innerHTML = "Unable to copy login information.")
})

if (authButton) {
    authButton.addEventListener('click', async () => {
        const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
        window.location = authUrl;
    });
}