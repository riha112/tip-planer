(async function() {    
    function rd(c = false, p = false, iHtml = false) {
        const dd = document.createElement('div');
        if (c) dd.className = c;
        if (p) p.appendChild(dd);
        if (iHtml) dd.innerHTML = iHtml;
        return dd;
    };

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
            } catch (e){
                console.debug(e);
                return {};
            }

            return this.cache;
        },
        save: async function(uid, toBuy) {
            if(!window.crypt.getKey()) return;
            if (!uid || !toBuy) return;

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
        delete: async function(uid, toBuyId) {
            if(!window.crypt.getKey()) return;
            let toBuys = await this.load();
            if (!toBuys[uid]) return;
            let i = toBuys[uid].items.findIndex((c) => c.id === toBuyId);
            if (i < 0) return;
            toBuys[uid].items.splice(i, 1);
            await this.saveNewData(toBuys);
            this.cache = false;
        }
    };

    window.initShopData = function(uuidParent) {
        return {
            uuid: uuidParent,
            name: '',
            price: 0,
            url: '',
            isOpen: false,
            isLoading: false,
            items: [],
            count: 0,
            init: function() {
                this.getItems();
                PIPE.subscribe(EVENTS.onToBuyUpdate, () => {
                    this.getItems();
                });
            },
            getItems: function() {
                if (window.toBuy && window.toBuy[this.uuid]) {
                    this.items = [...window.toBuy[this.uuid].items];
                    console.debug([this.items]);
                } else {
                    this.items = [];
                }
            },
            getTotal: function() {
                let total = 0;
                this.items.forEach((i) => total += (+(i.price ? i.price : 0)));
                return `Total: ${total} €`;
            },
            onDelete: async function(itemId) {
                this.isLoading = true;
                    await publicToBuys.delete(uuidParent, itemId);
                    PIPE.invoke(EVENTS.onToBuyUpdate);
                this.isLoading = false;
            },
            onSubmit: async function() {
                const item = {
                    content: this.name,
                    url: this.url,
                    price: this.price,
                    isBought: false,
                    uuidParent: this.uuidParent
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
                <div class="shop-list-list">
                    <template x-for="item in items">
                        <div class="shop-list-item" :class="{'isBought': item.isBought}">
                            <div class="shop-list-item-content" x-html="item.content">
                            </div>
                            <template x-if="item.url">
                            <a class="shop-list-item-link" :href="item.url">
            ${ICONS.link} Link
                            </a>
                            </template>
                            <div class="shop-list-item-price" x-html="(item.price ? item.price : 0) + ' €'">
                            </div>
                            <div class="shop-list-item-actions">
                                <div class="shop-list-item-action shop-list-item-toggle">
                                    ${ICONS.check}
                                </div>
                                <div @click="onDelete(item.id)" class="shop-list-item-action shop-list-item-remove">
                                    ${ICONS.trash}
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                <div class="shop-list-summary">
                    <div class="shop-list-total" x-html="getTotal()">
                    </div>
                </div>
                <div class="shop-list-action">
                    <div class="shop-list-input" style="flex: 2">
                        <input x-model="name" type="text" placeholder="Item name...">
                    </div>
                    <div class="shop-list-input" style="flex: 1">
                        <input x-model="url" type="text" placeholder="Ref URL...">
                    </div>
                    <div class="shop-list-input">
                        <input x-model="price" type="number" placeholder="Price">
                    </div>
                    <div @click="onSubmit" class="shop-list-add">
                        ${ICONS.add}
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

    window.initToBuy = async function() {
        initShopList();
        window.toBuy = await publicToBuys.load();
        PIPE.invoke(EVENTS.onToBuyUpdate);
    }
})();