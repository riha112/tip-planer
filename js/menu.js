(function() {
    let items = [...document.getElementsByClassName('newMenu-item')];
    const menuDom = document.getElementById('newMenuMenu');
    const filterDom = document.getElementById('newMenuFilter');
    const configDom = document.getElementById('newMenuConfig');

    const menuItemDom = document.getElementById('menuMenu');
    const filterItemDom = document.getElementById('filterMenu');
    const configItemDom = document.getElementById('configMenu');
    
    let plans = ['china', 'korea'];
    let activePlanId = 0;

    const fns = {
        onMenu: function(isActive, item) {
            menuDom.classList.toggle('isActive', isActive);

            if (isActive) {
                [filterDom, filterItemDom, configDom, configItemDom].forEach(
                    (i) => i.classList.remove('isActive')
                );
            }
        },
        onConfig: function(isActive, item) {
            configDom.classList.toggle('isActive', isActive);

            if (isActive) {
                [menuDom, menuItemDom, filterDom, filterItemDom].forEach(
                    (i) => i.classList.remove('isActive')
                );
            }
        },
        onFilter: function(isActive, item) {
            filterDom.classList.toggle('isActive', isActive);

            if (isActive) {
                [menuDom, menuItemDom, configDom, configItemDom].forEach(
                    (i) => i.classList.remove('isActive')
                );
            }
        },
        onComments: function(isActive, item) {
            window.commentMode = isActive;
            document.body.classList.toggle('comment-mode-active', isActive);
        },
        onHome: function(isActive, item) {
            if (isActive) {
                window.onHome(isActive);
                setMenuState(true);
            }
        },
        onPlan: function(isActive, item, key = false) {
            if (isActive) {
                if (!key) {
                    key = plans[activePlanId];
                    if(++activePlanId >= plans.length) {
                        activePlanId = 0;
                    };
                }

                window.onPlan(key);
                item.querySelector('.newMenu-itemText').innerText = PLAN[key].title;
                setMenuState(false);
            }
        },
    };

    const setMenuState = function(isDisabled) {
        filterDom.classList.remove('isActive')
        menuDom.classList.remove('isActive');

        menuItemDom.classList.toggle('isDisabled', isDisabled);
        menuItemDom.classList.remove('isActive');
    
        filterItemDom.classList.toggle('isDisabled', isDisabled);
        filterItemDom.classList.remove('isActive');

        configItemDom.classList.toggle('isDisabled', isDisabled);
        configItemDom.classList.remove('isActive');
    };

    const disableAll = function() {
        items.forEach((i) => {
            const iIsToggle = i.getAttribute('data-toggle');
            if (!iIsToggle) {
                i.classList.remove('isActive');
            }
        });
    };

    PIPE.subscribe(EVENTS.onHome, () => {
        disableAll();
        const e = document.getElementById('homeMenu');
        e.classList.add('isActive');
        setMenuState(true);
    });

    PIPE.subscribe(EVENTS.onPlanChange, (key) => {
        disableAll();
        const e = document.getElementById('planMenu');
        e.querySelector('.newMenu-itemText').innerText = PLAN[key].title;
        e.classList.add('isActive');
        setMenuState(false);

        document.querySelectorAll('[data-plan]').forEach((m) => {
            m.classList.toggle('isActive', m.getAttribute('data-plan') == key);
        });
    });

    items.forEach((item) => {
        item.addEventListener('click', function() {
            const isToggle = item.getAttribute('data-toggle');
            const fnName = item.getAttribute('data-fn');

            if (!isToggle) { 
                disableAll();
                item.classList.add('isActive');
            } else {
                item.classList.toggle('isActive');
            };

            if (fnName && fns[fnName]) {
                fns[fnName](item.classList.contains('isActive'), item);
            }
        });
    });

    document.addEventListener('click', function(e) {
        const href = e.target.getAttribute('data-href');
        if (!href) return;

        e.preventDefault();
        e.stopPropagation();
        const target = document.querySelector(href);
        if (!target) return;
        target.scrollIntoView({
            behavior: "smooth"
        });
    });

    PIPE.invoke(EVENTS.onMenuLoaded);
})();

(function() {
    const searchBar = document.getElementById('newMenuSearch');
    let searchables = [];
    
    const searchFn = function() { 
        const searchable = searchBar.value;
        if (!searchables || !searchables.length) {
           searchables = [...document.querySelectorAll('.menu-item')];
        }

        searchables.forEach((el) => {
            const parent = el;// el.parentElement;

            if (searchable) {
                if (el.innerText.toLowerCase().indexOf(searchable.toLowerCase()) >= 0) {
                    parent.classList.add('searchable-visible');
                    parent.classList.remove('searchable-hidden');
                } else {
                    parent.classList.add('searchable-hidden');
                    parent.classList.remove('searchable-visible');
                }
            } else {
                parent.classList.remove('searchable-hidden');
                parent.classList.remove('searchable-visible');
            }
        })
    };

    searchBar.addEventListener('input', searchFn);
})();