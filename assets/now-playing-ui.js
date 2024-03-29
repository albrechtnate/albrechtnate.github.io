(function(){

    const nowPlaying = document.getElementById('now-playing');
    const defaultText = nowPlaying.textContent;

    let progressAbortController = null;
    const progressElement = document.createElement('span');
    nowPlaying.after(progressElement);

    window.addEventListener('nowPlayingUpdate', event => {
        updateNowPlaying(event.detail);
    });

    function updateNowPlaying(data)
    {
        if (progressAbortController !== null) progressAbortController.abort();

        let content = defaultText;

        if (data.active)
        {
            const metadata = data.metadata;

            if (metadata.type === 'track')
            {
                content = `Currently listening to “${metadata.title}” by ${metadata.artist}`;
            }
            else if (metadata.type === 'episode')
            {
                content = `Currently listening to “${metadata.title}” from the ${metadata.podcast} podcast`;
            }

            progressAbortController = startProgressClock(metadata.progress, metadata.duration);
        }
        else
        {
            progressElement.textContent = '';
        }

        nowPlaying.textContent = content;
    }

    function startProgressClock(progress, duration)
    {
        const controller = new AbortController();

        const callback = () => {
            const progressString = formatProgress(progress, duration);
            progressElement.textContent = ` (${progressString})`;
            if ( progress > duration )
            {
                return controller.abort();
            }
            progress += 1000;
        };

        callback();
        animationInterval(1000, controller.signal, callback);
        return controller;
    }

    function formatProgress(progressMs, durationMs)
    {
        progressMs = Math.min(progressMs, durationMs);
        return `${formatMs(progressMs)}/${formatMs(durationMs)}`;
    }

    function formatMs(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }
    
    function animationInterval(ms, signal, callback) {
        // Prefer currentTime, as it'll better sync animtions queued in the
        // same frame, but if it isn't supported, performance.now() is fine.
        const start = document.timeline ? document.timeline.currentTime : performance.now();
        
        function frame(time) {
            if (signal.aborted) return;
            callback(time);
            scheduleFrame(time);
        }
        
        function scheduleFrame(time) {
            const elapsed = time - start;
            const roundedElapsed = Math.round(elapsed / ms) * ms;
            const targetNext = start + roundedElapsed + ms;
            const delay = targetNext - performance.now();
            setTimeout(() => requestAnimationFrame(frame), delay);
        }
        
        scheduleFrame(start);
    }

})();

