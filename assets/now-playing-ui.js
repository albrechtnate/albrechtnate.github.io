(function(){

    const nowPlaying = document.getElementById('now-playing');

    window.addEventListener('nowPlayingUpdate', event => {
        updateNowPlaying(event.detail);
    });

    function updateNowPlaying(data)
    {
        const content = '';

        if (data.active)
        {
            const metadata = data.metadata;

            if (metadata.type === 'track')
            {
                content = `🎵 Currently listening to ${metadata.title} by ${metadata.artist}. 🎶`;
            }
            else if (metadata.type === 'episode')
            {
                content = `🎵 Currently listening to ${metadata.title} from the ${metadata.podcast} podcast. 🎶`;
            }
        }

        nowPlaying.textContent = content;
    }

})();

