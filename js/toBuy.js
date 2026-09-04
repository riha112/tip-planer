(async function() {
    const PRIO_MAP = [
        { i: 1, l: 'Important' },
        { i: 5, l: 'Would Be Great' },
        { i: 10, l: 'Thinking' },
        { i: 15, l: 'Low Priority' },
    ];

    function rd(c = false, p = false, iHtml = false) {
        const dd = document.createElement('div');
        if (c) dd.className = c;
        if (p) p.appendChild(dd);
        if (iHtml) dd.innerHTML = iHtml;
        return dd;
    };

    function renderPrice(value) {
        const n = Number(value);
        if (isNaN(n)) {
            return '0.00';
        }

        return n.toFixed(2);
    }

    const CACHE = 'TB_CH';
    const BIN_ID = '6a8ddd3af5f4af5e29415027';
    const API = '$2a$10$5HXDXhg.59nAhDW8p45cu.0RhBu/Qh8Wx5GS47CrX5b0a3cT7C9ci';
    const publicToBuys = {
        cache: false,
        load: async function() {
            if(!window.crypt.getKey()) return {};
            if (this.cache) return this.cache;
            const data  = await fetch(
                "https://api.jsonbin.io/v3/b/" + BIN_ID + "/latest",
                {
                    headers: {"X-Access-Key": API}
                }
            ).then(r => r.json());

            if (!data) return {};
            const rawData = data.record.data;
            if (!rawData) return {};
            try {
                let jsonData = JSON.parse(JSON.parse(rawData));
                jsonData = await window.crypt.decrypt(jsonData, false, '', false);
                if (!jsonData) return {};
                this.cache = JSON.parse(jsonData);
                localStorage.setItem(CACHE, jsonData);
            } catch (e){
                console.debug(e);
                return {};
            }

            return this.cache;
        },
        save: async function(uid, toBuy) {
            if(!window.crypt.getKey()) return;
            if (!uid || !toBuy) return;

            this.cache = false;
            let toBuys = await this.load();
            if (!toBuys[uid]) toBuys[uid] = {
                uid: 0,
                items: []
            };

            if (!toBuys[uid].uid) toBuys[uid].uid = 1;
            const toBuyId = toBuys[uid].uid++;
            const cData = {
                id: toBuyId,
                ...toBuy
            };
            toBuys[uid].items.push(cData);
            await this.saveNewData(toBuys);
            this.cache = false;
            window.addMessage(
                'Item Added',
                'Item was added to shopping list successfully',
                NOT_TYPE.success
            );
        },
        saveNewData: async function (data) {
            if(!window.crypt.getKey()) return;
            let cryptData = await window.crypt.encrypt(JSON.stringify(data));
            if (!cryptData) return;
            cryptData = JSON.stringify(cryptData);
            await fetch("https://api.jsonbin.io/v3/b/" + BIN_ID, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Access-Key": API
                },
                body: JSON.stringify({
                    data: cryptData
                })
            });
        },
        updateItem: async function(uid, toBuy) {
            if(!window.crypt.getKey()) return;
            this.cache = false;
            let toBuys = await this.load();
            if (!toBuys[uid]) return;
            const idx = toBuys[uid].items.findIndex((c) => c.id === toBuy.id);
            if (idx < 0) return;
            toBuys[uid].items[idx] = toBuy;
            await this.saveNewData(toBuys);
            this.cache = false;
            window.addMessage(
                'Item Updated',
                'Item was updated successfully',
                NOT_TYPE.success
            );
        },
        delete: async function(uid, toBuyId) {
            if(!window.crypt.getKey()) return;
            this.cache = false;
            let toBuys = await this.load();
            if (!toBuys[uid]) return;
            let i = toBuys[uid].items.findIndex((c) => c.id === toBuyId);
            if (i < 0) return;
            toBuys[uid].items.splice(i, 1);
            await this.saveNewData(toBuys);
            this.cache = false;
            window.addMessage(
                'Item Removed',
                'Item was removed from shopping list successfully',
                NOT_TYPE.success
            );
        }
    };

    let cd = localStorage.getItem(CACHE);
    if (cd) {
        cd = JSON.parse(cd);
        window.toBuy = cd;
    }

    window.initShopData = function(uuidParent) {
        return {
            pMap: PRIO_MAP,
            uuid: uuidParent,
            name: '',
            price: 0,
            url: '',
            prio: PRIO_MAP[0].i,
            isOpen: true,
            isLoading: false,
            items: [],
            count: 0,
            init: function() {
                this.getItems();
                PIPE.subscribe(EVENTS.onToBuyUpdate, () => {
                    this.getItems();
                });
            },
            renderPrice: renderPrice,
            getAuthIcon: function(i) {
                if (i.a === 'Riha') return 'Ri';
                return 'Di';
            },
            getItems: function() {
                if (window.toBuy && window.toBuy[this.uuid]) {
                    this.items = window.toBuy[this.uuid].items;
                    this.items.sort((a, b) => {
                        if (a.isBought) return true;
                        if (b.isBought) return false;

                        let aPrio = +(a.prio ? a.prio : PRIO_MAP[0].i);
                        let bPrio = +(b.prio ? b.prio : PRIO_MAP[0].i);

                        if (aPrio === bPrio) {
                            if (a.a === b.a) return +a.id > +b.id;
                            return a.a > b.a;
                        };
                        return aPrio > bPrio;
                    });
                } else {
                    this.items = [];
                }
            },
            getLeftPrice: function(i) {
                if (!i.isBought) return (+this.renderPrice(i.price));
                return 0;
            },
            getTotal: function() {
                let total = 0, left = 0, amount = 0;
                this.items.forEach((i) => {
                    amount = +this.renderPrice(i.price);
                    total += amount;
                    if (!i.isBought) left += amount;
                });

                let label = `Total: ${this.renderPrice(total)} €`;

                if (total !== left) {
                    return`Left: ${this.renderPrice(left)} € (${label})`;
                }

                return label;

            },
            onToggle: async function (itemId) {
                this.isLoading = true;
                    const i = this.items.find((e) => e.id === itemId);
                    if (i) {
                        i.isBought = !i.isBought;
                        await publicToBuys.updateItem(uuidParent, i);
                        PIPE.invoke(EVENTS.onToBuyUpdate);
                    }
                this.isLoading = false;
            },
            onDelete: async function(itemId) {
                this.isLoading = true;
                    const idx = this.items.findIndex((i) => i.id === itemId);
                    if (idx >= 0) delete this.items[idx];
                    await publicToBuys.delete(uuidParent, itemId);
                    window.toBuy = await publicToBuys.load();
                    PIPE.invoke(EVENTS.onToBuyUpdate);
                this.isLoading = false;
            },
            onSubmit: async function() {
                if (!this.name) return;
                if (this.price && isNaN(Number(this.price))) return;

                const item = {
                    content: this.name,
                    url: this.url,
                    price: this.price,
                    isBought: false,
                    uuidParent: this.uuidParent,
                    prio: this.prio,
                    a: window.WHO
                };

                if (!this.uuid) return this.onClose();
                this.isLoading = true;
                    await publicToBuys.save(this.uuid, item);
                    window.toBuy = await publicToBuys.load();
                    PIPE.invoke(EVENTS.onToBuyUpdate);
                    this.name = '';
                    this.url = '';
                    this.price = 0;
                this.isLoading = false;
            }
        };
    };

    function initShopList() {
        const shops = document.querySelectorAll('.group-item:has(>.group-icon>.iShop)');

        shops.forEach((shop) => {
            const title = shop.querySelector('.group-title').innerText;
            const wrapper = rd('shop-list-form isClosed', shop, `
                <div class="shop-list-title" @click="isOpen = !isOpen">${ICONS.list} 
                    <span x-text="'Shopping Cart (' + items.length + ')'"></span> 
                </div>
                <template x-if="items && items.length">
                <div class="shop-list-list">
                    <template x-for="item in items">
                        <div class="shop-list-item" :data-prio="item.prio ? item.prio : pMap[0].i" :class="{'isBought': item.isBought}">
                            <div class="shop-list-item-author" x-html="getAuthIcon(item)">
                            </div>
                            <div class="shop-list-item-content" x-html="item.content">
                            </div>
                            <template x-if="item.url">
                            <a class="shop-list-item-link" :href="item.url">
                                ${ICONS.link} Link
                            </a>
                            </template>
                            <template x-if="item.price">
                            <div class="shop-list-item-price" :data-title="item.content" :data-auth="item.a" :data-leftprice="getLeftPrice(item)" x-text="renderPrice(item.price) + ' €'">
                            </div>
                            </template>
                            <div class="shop-list-item-actions">
                                <div @click="onToggle(item.id)" class="shop-list-item-action shop-list-item-toggle">
                                    ${ICONS.check}
                                </div>
                                <div @click="onDelete(item.id)" class="shop-list-item-action shop-list-item-remove">
                                    ${ICONS.trash}
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                </template>
                <template x-if="items && items.length">
                <div class="shop-list-summary">
                    <div class="shop-list-total" x-html="getTotal()">
                    </div>
                </div>
                </template>
                <div class="shop-list-action">
                    <div class="shop-list-inputs">
                        <div class="shop-list-input">
                            <input x-model="name" type="text" placeholder="Item name...">
                        </div>
                        <div class="shop-list-input isUrl">
                            <input x-model="url" type="text" placeholder="Ref URL...">
                        </div>
                        <div class="shop-list-input isPrice">
                            <input x-model="price" type="number" placeholder="Price">
                        </div>
                        <div class="shop-list-input isPrio">
                            <select x-model="prio" placeholder="Priority">
                                <template x-for="o in pMap">
                                <option x-text="o.l" :value="o.i">
                                </option>
                                </template>
                            </select>
                        </div>
                    </div>
                    <div @click="onSubmit" class="shop-list-add">
                        <span class="mobile-only">Add item</span> ${ICONS.add}
                    </div>
                </div>
                <div class="shop-list-loader" x-hide x-show="isLoading">
                    <div class="shop-list-spinner">
                        ${ICONS.spinner}
                    </div>
                </div>
                <div class="shop-list-notice" x-show="!isOpen">
                    Click to expand
                </div>
            `);
            wrapper.setAttribute('x-data', `initShopData("${title}")`);
            wrapper.setAttribute('x-init', `init`);
            wrapper.setAttribute(':class', '{"isClosed": !isOpen}');
        });
    }

    const initTotals = function() {
        const sections = document.querySelectorAll('.area-main>.group.gDefault');
        sections.forEach((section) => {
            const totalDom = document.createElement('div');
            section.append(totalDom);
            totalDom.className = "total-toBuy-section";
            PIPE.subscribe(EVENTS.onToBuyUpdate, () => {
                const prices = section.querySelectorAll('[data-leftprice]');
                let total = 0;
                let totalAuth = {};
                let pricesAuth = {};

                [...prices].forEach((p) => {
                    const pp = p.getAttribute('data-leftprice');
                    if (+pp === 0) return;
                    let a = p.getAttribute('data-auth');
                    let t = p.getAttribute('data-title');

                    total += (+pp);
                    if (!a) a = 'Didi';
                    if (!totalAuth[a]) totalAuth[a] = 0;
                    totalAuth[a] += (+pp);
                    if (!pricesAuth[a]) pricesAuth[a] = [];
                    pricesAuth[a].push({p: +pp, t});
                });
                let totalAuthDom = '';
                Object.keys(totalAuth).forEach((a) => {
                    totalAuthDom += `<div class="subData"><span class="auth">${a}:</span><span class="separator"></span><b>${renderPrice(totalAuth[a])} €</b></div>`;
                    if (pricesAuth[a]) {
                        let ttt = '<div class="subData-wrapper">';
                        pricesAuth[a].forEach((f) => {
                            ttt += `<div class="subData sub"><span class="subTitle">${f.t}:</span><span class="separator"></span><b>${renderPrice(f.p)} €</b></div>`;
                        });
                        ttt += '</div>';
                        totalAuthDom += ttt;
                    }
                });
                totalDom.innerHTML = `
                    <div class="mainData">Total amount for shopping: <b>${renderPrice(total)} €</b></div>
                    ${totalAuthDom}
                `;
            });
        });
    };

    window.initToBuy = async function() {
        initShopList();
        window.toBuy = await publicToBuys.load();
        initTotals();
        PIPE.invoke(EVENTS.onToBuyUpdate);
    }
})();