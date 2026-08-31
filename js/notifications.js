const NOT_TYPE = {
    info: 'info',
    error: 'error',
    success: 'success',
};

(function() {
    const LIFE_SPAN = 5;

    window.initNotifications = {
        uuid: 0,
        messages: [],
        init: function() {
            window.addMessage = this.addMessage.bind(this);
        },
        addMessage: function(title, content, type = NOT_TYPE.info,  action = false) {
            const uuid = this.uuid++;
            this.messages.push({
                uuid,
                type,
                title,
                content,
                action
            });

            setTimeout(() => {
                const idx = this.messages.findIndex((msg) => msg.uuid === uuid);
                if (idx >= 0) {
                    this.messages.splice(idx, 1);
                }
            }, LIFE_SPAN * 1000);
        }
    };
})();