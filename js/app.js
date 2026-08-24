(function(appId, plansHldId, plansSelectorHldId) {
    const URL_PLAN_KEY = 'pID';
    const appDOM = document.getElementById(appId);
    const plansDOM = document.getElementById(plansHldId);
    const plansSelDOM = document.getElementById(plansSelectorHldId);

    let isPlanSelectorView = false;
    let titleCounter = 0;
    const titlePrefix = 'aTtl';

    let sections = [];

    const app = {
        menu: [],
        renderMenu: function() {
            if (!this.menu) return '';
            let output = '';

            this.menu.forEach((item) => {
                const cls = 'depth-' + item.depth;
                output += '<li class="menu-item"><a class="menu-link ' + cls + '" href="#' + item.id + '">'
                    + item.label
                    + '</a></li>';
            });

            return '<div class="menu"><ul class="menu-list">' + output + '</ul></div>'
        },
        renderImg: function(data) {
            let style = data.style ? data.style : '';
            return '<img style="' + style + '" src="' + data.src + '"/>';
        },
        renderWeChat: function(data) {
            let label = data.label ? data.label : 'Show QR code';
            let labelIcon = data.labelIcon ? data.labelIcon : '';
            let output = '<div class="wechat-label">' + labelIcon + label + '</div>';

            data.img.src = './img/wechat/' + data.img.src;
            output += '<div class="wechat-img">' + this.renderImg(data.img) + '</div>';

            return '<div class="wechat">' + output + '</div>';
        },
        renderGallery: function(data) {
            const pathPrefix = './img/gallery/' + data.path + '/';
            let output = '';

            data.imgs.forEach((img) => {
                img.src = pathPrefix + img.src;
                output += '<div class="gal-img">'
                    + this.renderImg(img)
                    + '</div>';
            });

            return '<div class="gal"><div class="gal-wrapper">' + output + '</div></div>';
        },
        renderByKey: function (key, data, depth = '') {
            if (!data || ['type'].includes(key)) return '';
            let id = '';

            if (key === 'time') {
                if (data.from && data.till) {
                    data = '<span class="time time-from">' + data.from + '</span>'
                        + ' - <span class="time time-till">' + data.till + '</span>';

                } else if (data.from) {
                    data = '<span class="time">' + data.from + '</span>';
                } else {
                    return '';
                }
            } else if (key === 'links') {
                let ol = '';
                data.forEach((link) => {
                    let icon = link.icon ? link.icon : ICONS.link;
                    ol += '<a target="_blank" href="' + link.url + '">' + icon + link.label + '</a>';
                });
                data = ol;
            } else if (key === 'img') {
                data = this.renderImg(data);
            } else if (key === 'gallery') {
                data = this.renderGallery(data);
            } else if (key === 'transportationTime') {
                let type = data.type ? data.type : 'Default';
                let icon = data.icon ? data.icon : '';
                data = icon + '<span class="time t' + type + '">' + data.amount + '<span>'; 
            } else if (key === 'wechat') {
                data = this.renderWeChat(data);
            } else if (key === 'location') {
                data = '<a target="_blank" href="' + data + '">' + ICONS.location + ' <span>Location</span></a>';
            } else if (key === 'mapLoc') {
                data = '<span data-map-location data-x="'+data.x+'" data-y="'+data.y+'"></span>';
            } else if (key === 'title') {
                id = titlePrefix + (titleCounter++);
                this.menu.push({
                    id,
                    label: depth + ' ' + data,
                    depth: depth.length
                });
            }

            const idAtt = id ? 'id="' + id + '"' : '';
            let hashAtt = '';

            if (!['icon'].includes(key)) {
                const hash = window.hash(data);
                hashAtt = '  data-hash="' + hash + '"';
            }

            return '<div ' + idAtt + hashAtt + '" class="group-' + key + '">' + data + '</div>'
        },
        renderParse: function (outputParse) {
            let output = '';

            ['icon', 'time', 'transportationTime', 'title',
             'content', 'content2', 'content3', 'content4',
             'price', 'priceTransportation', 'location',
             'links', 'items', 'afterItems',
             'img', 'gallery', 'wechat', 'map', 'mapLoc'].forEach((key) => {
                if (!outputParse[key]) return;
                output += outputParse[key];
            });

            return output;
        },
        renderGroup: function (items, gType = 'Default', depth = '') {
            let rendered = '';

            items.forEach((item) => {
                let outputParse = {};

                Object.keys(item).forEach((key) => {
                    if (key === 'items') outputParse[key] = this.renderGroup(item.items, (item.groupType ? item.groupType : 'Default'), depth + '-');
                    else outputParse[key] = this.renderByKey(key, item[key], depth);
                });

                rendered += '<div class="group-item">' + this.renderParse(outputParse) + '</div>';
            });

            return '<div class="group g' + gType + '">' + rendered + "</div>";
        },
        switchView: function(isPlanSelectorView) {
            plansDOM.classList.toggle('isVisible', !isPlanSelectorView);
            plansSelDOM.classList.toggle('isVisible', isPlanSelectorView);

            if (!isPlanSelectorView) {
                this.updateUrlParm('');
            }
        },
        readUrl: function() {
            const params = new URLSearchParams(window.location.search);
            const value = params.get(URL_PLAN_KEY);

            if (!value) {
                this.switchView(true);
            } else {
                this.switchPlan(value);
            }
        },
        updateUrlParm: function(key) {
            const url = new URL(window.location.href);
            url.searchParams.set(URL_PLAN_KEY, key);
            window.history.pushState({}, "", url);
        },
        switchPlan: function(key) {
            sections.forEach((sec) => sec.classList.remove('isVisible'));
            document.getElementById('plan-' + key).classList.add('isVisible');
            this.switchView(false);
            this.updateUrlParm(key);
        },
        renderPlansSelector: function (key, item) {
            const { title, icon, bg, dates, words } = item;
            const sDom = document.createElement('div');
            sDom.classList.add('plan-selector');
            sDom.addEventListener('click', () => {
                this.switchPlan(key);
            });

            sDom.innerHTML = `
                <div class="plan-selector-bg">
                    <img class="plan-selector-bg-img" src="./img/${bg}">
                </div>
                <div class="plan-selector-content">
                    <img class="plan-selector-icon" src="./img/${icon}">
                    <div class="plan-selector-title">${title}</div>
                    <div class="plan-selector-dates">${dates}</div>
                </div>
            `;

            if (window.wordEffect) {
                window.wordEffect.init(sDom, words);
            }

            return sDom;
        },
        renderPlans: function (items) {
            Object.keys(items).forEach((id) => {
                const item = items[id];
                const { header, plan } = item;

                const iWrapper = document.createElement('div');
                iWrapper.id = 'plan-' + id;
                iWrapper.classList.add('plan-item');
                sections.push(iWrapper);

                const groupHtml = '<div class="area-main"><H1>' + header + '</H1>' + this.renderGroup(plan) + '</div>';
                const menuHtml = '<div class="area-menu">' + ICONS.menu + '<input class="menu-toggle" type="checkbox"/>' +  this.renderMenu() + '</div>';
                iWrapper.innerHTML = menuHtml + groupHtml;

                plansDOM.appendChild(iWrapper);
                plansSelDOM.appendChild(this.renderPlansSelector(id, item));
            });
        },
        run: async function (decrypt = false) {
            let jsonData = '';
            if (!decrypt) jsonData = PLAN;
            else {
                jsonData = await window.crypt.decrypt(PLAN_EN)
                jsonData = JSON.parse(jsonData);
            }

            this.renderPlans(jsonData);
            this.readUrl();

            window.addEventListener("popstate", () => {
                this.readUrl();
            });
        }
    };

    app.run(false || location.href.includes('riha112.github'));
})('App', 'Plans', 'PlanSelector');