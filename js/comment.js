(function(commentSelector, wysiwygSelector) {
    const commentDom = document.getElementById(commentSelector);
    const wysDom = document.getElementById(wysiwygSelector);
    
    Wysi({
        el: '#' + wysiwygSelector,
        tools: [
            'bold', 'italic', 'underline', 'strike', '|', 
            'ul', 'ol', '|', 
            'link', 'image', '|', 
            'removeFormat'
        ],
    });

    const rd = function(c = false, p = false, iHtml = false) {
        const dd = document.createElement('div');
        if (c) dd.classList.add(c);
        if (p) p.appendChild(dd);
        if (iHtml) dd.innerHTML = iHtml;
        return dd;
    };

    const LOC_CMNT_KEY = 'lCmtK';

    const localComments = {
        load: function() {
            const data = localStorage.getItem(LOC_CMNT_KEY);
            if (!data) return {};
            return JSON.parse(data);
        },
        save: function(uid, comment) {
            if (!uid || !comment) return;

            let comments = this.load();
            if (!comments[uid]) comments[uid] = {
                uid: 0,
                items: []
            };

            const commentId = comments[uid].uid++;
            const cData = {
                msg: comment,
                id: commentId,
                type: 'local'
            };
            comments[uid].items.push(cData);

            localStorage.setItem(LOC_CMNT_KEY, JSON.stringify(comments));

            return cData;
        },
        delete: function(uid, commentId) {
            let comments = this.load();
            if (!comments[uid]) return;
            let i = comments[uid].items.findIndex((c) => c.id === commentId);
            if (i < 0) return;
            comments[uid].items.splice(i, 1);
            localStorage.setItem(LOC_CMNT_KEY, JSON.stringify(comments));
        }
    };

    const BIN_ID = '6a762a84f5f4af5e29f8d5c8';
    const API = '$2a$10$5HXDXhg.59nAhDW8p45cu.0RhBu/Qh8Wx5GS47CrX5b0a3cT7C9ci';
    const publicComments = {
        cache: false,
        load: async function() {
            return {};
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
        save: async function(uid, comment) {
            if(!window.crypt.getKey()) return;
            if (!uid || !comment) return;

            let comments = await this.load();
            if (!comments[uid]) comments[uid] = {
                uid: 0,
                items: []
            };

            if (!comments[uid].uid) comments[uid].uid = 1;
            const commentId = comments[uid].uid++;
            const cData = {
                msg: comment,
                id: commentId,
                type: 'public'
            };
            comments[uid].items.push(cData);
            await this.saveNewData(comments);
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
        delete: async function(uid, commentId) {
            if(!window.crypt.getKey()) return;
            let comments = await this.load();
            if (!comments[uid]) return;
            let i = comments[uid].items.findIndex((c) => c.id === commentId);
            if (i < 0) return;
            comments[uid].items.splice(i, 1);
            await this.saveNewData(comments);
            this.cache = false;
        }
    };

    const ALLOWED_ATTRIBUTES = ['id', 'class', 'href', 'target', 'src', 'alt', 'style'];
    safeDOM = function(parent) {
        let nonAllowed = parent.querySelectorAll('script, style, link, input, button, form');
        nonAllowed.forEach((d) => d.remove());

        const nodes = parent.querySelectorAll('*');
        nodes.forEach((node) => {
            [...node.attributes].forEach(attr => {
                if (!ALLOWED_ATTRIBUTES.includes(attr.name)) {
                    console.debug(['removing', attr.name]);
                    node.removeAttribute(attr.name);
                }
            });
        });
    };

    const commentManager = {
        comments: {},
        getComments: async function() {
            let lc = localComments.load();
            let pc = await publicComments.load();
            this.comments = lc;
            Object.keys(pc).forEach((k) => {
                if (!this.comments[k]) this.comments[k] = pc[k];
                else {
                    this.comments[k].items.push(...pc[k].items);
                }
            })
        },
        removeOldComments: function() {
            [...document.querySelectorAll('.comments-msgs')].forEach((c) => {
                c.remove();
            });
        },
        renderComments: async function() {
            await this.getComments();
            this.removeOldComments();
            const detachedComments = [];
            Object.keys(this.comments).forEach((key) => {
                const el = document.querySelector('[data-hash="' + key + '"]');
                const items =  this.comments[key].items;

                if (!el) {
                    items.forEach((i) => detachedComments.push(i));
                    return;
                }

                if (!items || !items.length) return;

                el.classList.add('comment-holder-dom');
                let domWrapper = rd('comments-msgs');

                let domToggle = rd('comments-toggle', domWrapper);
                domToggle.addEventListener('click', () => {
                    let isVis = domWrapper.classList.contains('isVisible');
                    document.querySelectorAll('.comments-msgs').forEach((e) => e.classList.remove('isVisible'));
                    if (!isVis) domWrapper.classList.toggle('isVisible');
                });

                let domCount = rd('comments-count', domToggle, items.length);
                let domWrapperList = rd('comments-msgs-list', domWrapper);

                items.forEach((c) => {
                    let commentDom = rd('comment-msg', domWrapperList);
                    let commentMsgDom = rd('comment-msg-content', commentDom, c.msg);
                    safeDOM(commentMsgDom);
                    commentMsgDom.classList.add(c.type);

                    let deleteMsgDom = rd('comment-msg-delete', commentDom, ICONS.trash);
                    deleteMsgDom.addEventListener('click', function() {
                        if (c.type === 'local') localComments.delete(key, c.id);
                        else publicComments.delete(key, c.id);
                        commentManager.renderComments();
                    });
                });
                
                el.appendChild(domWrapper);
            });

            window.setDetachedComments(detachedComments);
        }
    };

    window.initComment = function() {
        return {
            uid: '',
            isHidden: true,
            isLoading: false,
            detachedComments: [],
            init: function() {
                window.setDetachedComments = this.setDetachedComments();
            },
            setDetachedComments: function(comments) {
                this.detachedComments = comments;
            },
            onShow: function(uid) {
                this.uid = uid;
                this.isHidden = false;
            },
            onSubmit: async function() {
                if (!this.uid) return this.onClose();
                this.isLoading = true;
                    const comment = wysDom.value;
                    await publicComments.save(this.uid, comment);
                    Wysi.setContent('#' + wysiwygSelector, '');
                    this.onClose();
                    commentManager.renderComments();
                this.isLoading = false;
            },
            onSubmitLocal: function() {
                if (!this.uid) return this.onClose();

                this.isLoading = true;
                    const comment = wysDom.value;
                    localComments.save(this.uid, comment);
                    Wysi.setContent('#' + wysiwygSelector, '');
                    this.onClose();
                    commentManager.renderComments();
                this.isLoading = false;
            },
            onClose: function() {
                this.isHidden = true;
            }
        };
    };

    document.body.addEventListener("contextmenu", (event) => {
        if (!window.commentMode) return;

        const target = event.target.closest('[data-hash]');
        if (!target) {
            return;
        }

        const uid = target.getAttribute('data-hash');
        if (!uid) {
            return;
        }

        event.preventDefault();
        window.dispatchEvent(new CustomEvent('showcommentform', { detail: { uid } }));
    });

    commentManager.renderComments();
})('Comment', 'CommentWysiwyg');