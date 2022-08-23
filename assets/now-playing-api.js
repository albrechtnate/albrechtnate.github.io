(function(){

    let accessToken;
    let authErrors = 0;
    
    getSongs(); // Get currently playing track/podcast and poll for changes.
    
    async function refreshAccessToken(force = false)
    {
        const endpoint = new URL('https://api.nathanalbrecht.com/spotify_refresh_low_priviledge_access_token');
    
        if (force) endpoint.searchParams.set('refresh', 'true');
    
        accessToken = await fetch(endpoint.toString())
            .then(res => res.text())
            .catch(err => err.message);
    };
    
    async function getSongs()
    {
        const refreshInterval = 30 * 1000;
    
        if (document.visibilityState === 'hidden')
        {
            return document.addEventListener('visibilitychange', () => {
                getSongs();
            }, { once: true });
        }
    
        if (accessToken === undefined)
        {
            await refreshAccessToken();
        }
    
        await fetch("https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode", {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            credentials: 'same-origin'
        }).then(res => {
    
            if (res.status !== 401)
            {
                authErrors = 0;
            }
    
            if (res.status === 200)
            {
                res.json().then(json => {
    
                    if (! json.is_playing || json.item === null)
                    {
                        // Not listening to anything.
                        updateNowPlaying();
                        setTimeout(getSongs, refreshInterval);
                    }
                    else
                    {
                        const data = {
                            id: json.item.id,
                            title: json.item.name,
                            msRemaining: json.item.duration_ms - json.progress_ms,
                        };
    
                        if (json.currently_playing_type === 'track')
                        {
                            const listStrings = arr => {
                                if (arr.length <= 1) return arr[0];
                                return arr.slice(0, -1).join(', ') + ' and ' + arr.at(-1);
                            }

                            Object.assign(data, {
                                type: 'track',
                                artist: listStrings(json.item.artists.map(artist => artist.name)),
                            });
                        }
                        else if (json.currently_playing_type === 'episode')
                        {
                            Object.assign(data, {
                                type: 'episode',
                                podcast: json.item.show.name,
                            });
                        }
    
                        updateNowPlaying(data);
    
                        const remaining = data.msRemaining + 1000; // 1s delay to avoid hitting endpoint too soon.
                        const interval = remaining - refreshInterval <= refreshInterval / 2 ? remaining : refreshInterval;
    
                        setTimeout(getSongs, interval);
                    }
                });
            }
            else
            {
                if (res.status === 204)
                {
                    // Not listening to anything.
                    updateNowPlaying();
                    setTimeout(getSongs, refreshInterval);
                }
    
                if (res.status === 401)
                {
                    authErrors++;
                    setTimeout(
                        () => { refreshAccessToken(authErrors > 1).then(() => getSongs()) },
                        (authErrors - 1) * 10 * 1000
                    );
                }
            }
    
        })
        .catch(err => err.message);
    };
    
    function updateNowPlaying(data = null)
    {
        const event = new CustomEvent('nowPlayingUpdate', { detail: {
            active: data !== null,
            metadata: data
        }});
        window.dispatchEvent(event);
    }

})();