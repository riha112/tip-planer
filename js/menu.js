(function() {
    let items = [...document.getElementsByClassName('newMenu-item')];
    const menuDom = document.getElementById('newMenuMenu');
    
    let plans = ['china', 'korea'];
    let activePlanId = 0;

    const fns = {
        onMenu: function(isActive, item) {
            menuDom.classList.toggle('isActive', isActive);
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
        menuDom.classList.remove('isActive');
        const ee = document.getElementById('menuMenu');
        ee.classList.toggle('isDisabled', isDisabled);
        ee.classList.remove('isActive');
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
        console.debug([key, PLAN[key].title]);
        disableAll();
        const e = document.getElementById('planMenu');
        e.querySelector('.newMenu-itemText').innerText = PLAN[key].title;
        e.classList.add('isActive');
        setMenuState(false);

        document.querySelectorAll('.menu').forEach((m) => {
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