(function(){

    const nowPlaying = document.getElementById('now-playing');
    const defaultText = nowPlaying.textContent;

    window.addEventListener('nowPlayingUpdate', event => {
        updateNowPlaying(event.detail);
    });

    function updateNowPlaying(data)
    {
        let content = defaultText;

        if (data.active)
        {
            const metadata = data.metadata;

            if (metadata.type === 'track')
            {
                content = `Currently listening to “${metadata.title}” by ${metadata.artist}.`;
            }
            else if (metadata.type === 'episode')
            {
                content = `Currently listening to “${metadata.title}” from the ${metadata.podcast} podcast.`;
            }
        }

        nowPlaying.textContent = content;
    }

})();

