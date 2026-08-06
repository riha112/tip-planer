(function(mapHldSelector, locSelector, titleSelector) {
    const idPrefix = 'mmAp';
    let counter = 0;

    const map = {
        calculateCenter(markers) {
            let centerX = 0;
            let centerY = 0;

            markers.forEach((marker) => {
                centerX += marker.x;
                centerY += marker.y;
            });

            return [centerX / markers.length, centerY / markers.length];
        },
        createMap: function(id, markers) {
            const center = this.calculateCenter(markers);
            const map = L.map(id).setView(center, 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            markers.forEach((marker) => {
                L.marker([marker.x, marker.y])
                    .addTo(map)
                    .bindPopup(marker.title)
                    .openPopup();
            });
        },
        init: function() {
            const mapHolders = document.getElementsByClassName(mapHldSelector);
            if (!mapHolders) return;

            [...mapHolders].forEach((mapHld) => {
                mapHld.id = idPrefix + (counter++);
                const parent = mapHld.parentElement;
                const locations = parent.querySelectorAll(locSelector);
                if (!locations) return;

                const markers = [];
                [...locations].forEach((loc) => {
                    const titleDOM = loc.closest(titleSelector);
                    const title = titleDOM ? titleDOM.innerHtml : '';
                    markers.push({
                        x: +loc.getAttribute('data-x'),
                        y: +loc.getAttribute('data-y'),
                        title: title
                    });
                });
                if (!markers) return;

                this.createMap(mapHld.id, markers);
            });
        }
    }

    map.init();
})('group-map', '[data-map-location]', '.group-title');