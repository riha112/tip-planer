(function() {
    let filterables = [];
    let activeFilters = {};
    let isIn = false;
    let svg = null;
    let sKey = null;
    let filters = null;

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

    const resetFn = () => {
        activeFilters = {};
        filterFn();
        filters.forEach((i) =>  i.classList.remove('isActive'));
    };

    PIPE.subscribe(EVENTS.onPlanChange, resetFn);

    window.initFilters = function(selector) {
        filters = document.querySelectorAll(selector);
        filters.forEach((i) => {
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