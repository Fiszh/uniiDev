const CLIENT_ID = 't3kbxbtqduq1nunrzeg3s18vdhhc1m';
const REDIRECT_URI = 'https://unii.dev/chatStats';
const AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

const SCOPES = 'user:read:email';

const authButton = document.getElementById('login_button');

function setCookie(name, value, expiresInSeconds) {
    const expires = new Date(Date.now() + expiresInSeconds * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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

                setCookie("user_login", userData["login"], userData["expires_in"]);

                const return_url = getCookie("return_url");
                deleteCookie("return_url");

                window.location.href = return_url ? decodeURIComponent(return_url) : REDIRECT_URI;
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

let has_cookie = getCookie("user_login");

if (authButton) {
    const found_text = authButton.querySelector("#button_text");

    if (has_cookie && found_text) {
        found_text.textContent = "Logout";
    }

    authButton.addEventListener('click', async () => {
        if (has_cookie) {
            deleteCookie("user_login");
            const user_stats_data = document.getElementById("user_data");

            if (user_stats_data) {
                user_stats_data.style.display = "none";
            }

            if (found_text) {
                found_text.textContent = "Login";
            }

            has_cookie = false;
        } else {
            alert("Do not show on stream.");
            setCookie("return_url", encodeURIComponent(window.location.href), 86400);
            const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
            window.location = authUrl;
        }
    });
}