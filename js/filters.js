(function() {
    let filterables = [];
    let activeFilters = {};
    let isIn = false;
    let svg = null;
    let sKey = null;

    const filterFn = function() {
        if(!filterables || !filterables.length) {
            filterables = [...document.querySelectorAll('.group-icon')];
        }

        const aFilters = Object.keys(activeFilters);

        filterables.forEach((el) => {
            const parent = el.parentElement;
            svg = el.querySelector('svg');
            sKey = svg.classList.toString();

            if (!aFilters || !aFilters.length) {
                parent.classList.remove('filterable-hidden');
                parent.classList.remove('filterable-visible');
            } else {
                isIn = aFilters.includes(sKey);
                parent.classList.toggle('filterable-hidden', !isIn);
                parent.classList.toggle('filterable-visible', isIn);
            }
        });
    }

    window.initFilters = function(selector) {
        document.querySelectorAll(selector).forEach((i) => {
            const s = i.querySelector('svg');
            const key = s.classList.toString();
            i.addEventListener('click', () => {
                if (i.classList.toggle('isActive')) {
                    activeFilters[key] = true;
                } else {
                    delete activeFilters[key];
                }

                filterFn();
            });
        });
    }
})();