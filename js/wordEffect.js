(function() {
    const className = 'weBubble';

    function createWord(area, word) {
        const bubble = document.createElement("div");
        bubble.className = className;
        bubble.textContent = word;

        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 250;

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
        run: function(DOM, words) {
            if (!this.isHovering) return;
            const word = words[Math.floor(Math.random() * words.length)];
            createWord(DOM, word);
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
        }
    }
}());