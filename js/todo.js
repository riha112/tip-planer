(async function() {
    function rd(c = false, p = false, iHtml = false) {
        const dd = document.createElement('div');
        if (c) dd.className = c;
        if (p) p.prepend(dd);
        if (iHtml) dd.innerHTML = iHtml;
        return dd;
    };

    const CACHE = 'TODO_CH';
    const BIN_ID = '6a97d3f7f5f4af5e295fe11b';
    const API = '$2a$10$5HXDXhg.59nAhDW8p45cu.0RhBu/Qh8Wx5GS47CrX5b0a3cT7C9ci';
    const publicToDo = {
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
        save: async function(uid, toDo) {
            if(!window.crypt.getKey()) return;
            if (!uid || !toDo) return;

            this.cache = false;
            let toToDo = await this.load();
            if (!toToDo[uid]) toToDo[uid] = {
                uid: 0,
                items: []
            };

            if (!toToDo[uid].uid) toToDo[uid].uid = 1;
            const toDoId = toToDo[uid].uid++;
            const cData = {
                id: toDoId,
                ...toDo
            };
            toToDo[uid].items.push(cData);
            await this.saveNewData(toToDo);
            this.cache = false;
            window.addMessage(
                'Item Added',
                'Item was added to todo list successfully',
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
        updateItem: async function(uid, toDo) {
            if(!window.crypt.getKey()) return;
            this.cache = false;
            let toToDo = await this.load();
            if (!toToDo[uid]) return;
            const idx = toToDo[uid].items.findIndex((c) => c.id === toDo.id);
            if (idx < 0) return;
            toToDo[uid].items[idx] = toDo;
            await this.saveNewData(toToDo);
            this.cache = false;
            window.addMessage(
                'Item Updated',
                'Item was updated successfully',
                NOT_TYPE.success
            );
        },
        delete: async function(uid, toDoId) {
            if(!window.crypt.getKey()) return;
            this.cache = false;
            let toToDo = await this.load();
            if (!toToDo[uid]) return;
            let i = toToDo[uid].items.findIndex((c) => c.id === toDoId);
            if (i < 0) return;
            toToDo[uid].items.splice(i, 1);
            await this.saveNewData(toToDo);
            this.cache = false;
            window.addMessage(
                'Item Removed',
                'Item was removed from todo list successfully',
                NOT_TYPE.success
            );
        }
    };

    let cd = localStorage.getItem(CACHE);
    if (cd) {
        cd = JSON.parse(cd);
        window.toDo = cd;
    }

    window.initToDoList = function(uuidParent) {
        return {
            uuid: uuidParent,
            name: '',
            isLoading: false,
            items: [],
            count: 0,
            init: function() {
                this.getItems();
                PIPE.subscribe(EVENTS.onToDoUpdate, () => {
                    this.getItems();
                });
            },
            getAuthIcon: function(i) {
                if (i.a === 'Riha') return 'Ri';
                return 'Di';
            },
            getItems: function() {
                if (window.toDo && window.toDo[this.uuid]) {
                    this.items = window.toDo[this.uuid].items;
                    this.items.sort((a, b) => {
                        if (a.isDone) return true;
                        if (b.isDone) return false;

                        if (a.a === b.a) return +a.id > +b.id;
                        return a.a > b.a;
                    });
                } else {
                    this.items = [];
                }
            },
            onToggle: async function (itemId) {
                this.isLoading = true;
                    const i = this.items.find((e) => e.id === itemId);
                    if (i) {
                        i.isDone = !i.isDone;
                        await publicToDo.updateItem(uuidParent, i);
                        PIPE.invoke(EVENTS.onToDoUpdate);
                    }
                this.isLoading = false;
            },
            onDelete: async function(itemId) {
                this.isLoading = true;
                    const idx = this.items.findIndex((i) => i.id === itemId);
                    if (idx >= 0) delete this.items[idx];
                    await publicToDo.delete(uuidParent, itemId);
                    window.toDo = await publicToDo.load();
                    PIPE.invoke(EVENTS.onToDoUpdate);
                this.isLoading = false;
            },
            onSubmit: async function() {
                if (!this.name) return;

                const item = {
                    content: this.name,
                    isDone: false,
                    uuidParent: this.uuidParent,
                    a: window.WHO
                };

                if (!this.uuid) return this.onClose();
                this.isLoading = true;
                    await publicToDo.save(this.uuid, item);
                    window.toDo = await publicToDo.load();
                    PIPE.invoke(EVENTS.onToDoUpdate);
                    this.name = '';
                    this.url = '';
                    this.price = 0;
                this.isLoading = false;
            }
        };
    };

    function initToDoListRenderer() {
        const sections = document.querySelectorAll('.area-main>.group.gDefault');

        sections.forEach((section) => {
            const title = section.parentNode.querySelector('H1').innerText;
            const wrapper = rd('todo-form', section, `
                <div class="todo-title">${ICONS.list} 
                    <span x-text="'To Do (' + items.length + ')'"></span> 
                </div>
                <template x-if="items && items.length">
                <div class="todo-list">
                    <template x-for="item in items">
                        <div class="todo-item" :class="{'isDone': item.isDone}">
                            <div class="todo-item-author" x-html="getAuthIcon(item)">
                            </div>
                            <div class="todo-item-content" x-html="item.content">
                            </div>
                            <div class="todo-item-actions">
                                <div @click="onToggle(item.id)" class="todo-item-action todo-item-toggle">
                                    ${ICONS.check}
                                </div>
                                <div @click="onDelete(item.id)" class="todo-item-action todo-item-remove">
                                    ${ICONS.trash}
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                </template>
                <div class="todo-action">
                    <div class="todo-inputs">
                        <div class="todo-input">
                            <input x-model="name" type="text" placeholder="Item name...">
                        </div>
                    </div>
                    <div @click="onSubmit" class="todo-add">
                        <span class="mobile-only">Add item</span> ${ICONS.add}
                    </div>
                </div>
                <div class="todo-loader" x-hide x-show="isLoading">
                    <div class="todo-spinner">
                        ${ICONS.spinner}
                    </div>
                </div>
            `);
            wrapper.setAttribute('x-data', `initToDoList("${title}")`);
        });
    }

    window.initToDo = async function() {
        initToDoListRenderer();
        window.toDo = await publicToDo.load();
        PIPE.invoke(EVENTS.onToDoUpdate);
    }
})();