(function(){
    
    getSongs(); // Get currently playing track/podcast and poll for changes.
    
    async function getSongs()
    {
        const refreshInterval = 30 * 1000;
    
        if (document.visibilityState === 'hidden')
        {
            return document.addEventListener('visibilitychange', () => {
                getSongs();
            }, { once: true });
        }
    
        await fetch('https://workers.nathanalbrecht.com/currently-playing').then(res => {
    
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
                            progress: json.progress_ms,
                            duration: json.item.duration_ms,
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
    
                        const remaining = json.item.duration_ms - json.progress_ms + 1000; // 1s delay to avoid hitting endpoint too soon.
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