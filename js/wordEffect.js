(function() {
    const className = 'weBubble';

    function createWord(area, word) {
        const bubble = document.createElement("div");
        bubble.className = className;
        bubble.textContent = word;

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200;

        const x =
            area.offsetWidth / 2 +
            Math.cos(angle) * distance;

        const y =
            area.offsetHeight / 2 +
            Math.sin(angle) * distance;

        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;

        // Slightly randomize size
        bubble.style.fontSize = `${14 + Math.random() * 7}px`;

        area.appendChild(bubble);

        bubble.addEventListener("animationend", () => {
            bubble.remove();
        });
    };

    window.wordEffect = {
        interval: false,
        isHovering: false,
        lastWord: '',
        getWord: function(words) {
            let word = words[Math.floor(Math.random() * words.length)];
            if (word == this.lastWord) word = this.getWord(words);
            this.lastWord = word;
            return word;
        },
        run: function(DOM, words) {
            if (!this.isHovering) return;
            createWord(DOM, this.getWord(words));
        },
        init: function(DOM, words) {
            if (!DOM || !words) return;

            DOM.addEventListener("mouseenter", () => {
                this.isHovering = true;

                // Create one immediately
                this.run(DOM, words);

                // Then continue creating them
                this.interval = setInterval(this.run.bind(this, DOM, words), 750);
            });

            DOM.addEventListener("mouseleave", () => {
                this.isHovering = false;
                clearInterval(this.interval);
            });

            PIPE.subscribe(EVENTS.onPlanChange, () => {
                this.isHovering = false;
                clearInterval(this.interval);
            });
        }
    }
}());