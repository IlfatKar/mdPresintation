class PresintationMD {
  constructor(el) {
    this.root = el;
    this._init();
  }
  dots = 0;
  nav = null;
  cards = null;
  currCard = null;
  activeDot = 0;
  commands = {
    "!sm": () => {
      const el = document.createElement("p");
      el.classList.add("smaller");
      return el;
    },
    "![": () => {
      const el = document.createElement("img");
      el.classList.add("border");
      return el;
    },
    "!fr": () => {
      const el = document.createElement("iframe");
      el.classList.add("border");
      return el;
    },
  };
  parse(text) {
    let buf = "";
    const trimmed = text.trim();
    Array.from(trimmed).forEach((ch, idx) => {
      buf += ch;
      if (ch === "\n" || idx === trimmed.length - 1) {
        this._parseStr(buf.trim());
        buf = "";
      }
    });
    this._finish();
  }

  _make2Cols() {
    const tmp = Array.from(this.currCard.children);

    for (let i = this.currCard.children.length - 1; i >= 0; i--) {
      const child = this.currCard.children[i];
      child.remove();
    }
    const div = document.createElement("div");
    for (let i = 0; i < tmp.length; i++) {
      const child = tmp[i];
      div.appendChild(child);
    }
    this.currCard.appendChild(div);

    this.currCard.classList.add("row");
  }

  _parseStr(str, parent) {
    if (str[0] === "#") {
      const regex = /#/g;
      const len = str.match(regex).length;

      const el = document.createElement("h" + len);
      el.textContent = str.slice(len + 1);
      if (parent) {
        parent.appendChild(el);
      }
      this._render(parent ? parent : el, len === 1);
      return;
    }
    if (str[0] === "!") {
      const arr = str.split(" ");
      const fn = this.commands[arr.length > 1 ? arr[0] : arr[0].slice(0, 2)];
      if (!(fn instanceof Function)) {
        return;
      }
      const el = fn();
      if (el.nodeName === "IMG") {
        this._make2Cols();
        const linkText = str.match(/\[(.*?)\]/);
        const link = str.match(/\((.*?)\)/);
        el.src = link[0].slice(1, -1);
        el.alt = linkText[0].slice(1, -1);
        this._render(el);
        return;
      }
      if (el.nodeName === "IFRAME") {
        this._make2Cols();
        el.src = arr[1];
      }

      const tail = arr.slice(1).join(" ");
      if (el instanceof Element) {
        return this._parseStr(tail, el);
      }
      return;
    }
    const parseLinks = (parent, str, isRec) => {
      const linkText = str.match(/\[(.*?)\]/);
      if (linkText) {
        const link = str.match(/\((.*?)\)/);

        const before = str.indexOf("[");
        const after = str.indexOf(")");
        const textBefore = str.slice(0, before);
        const textAfter = str.slice(after + 1);

        const a = document.createElement("a");
        a.href = link[0].slice(1, -1);
        a.textContent = linkText[0].slice(1, -1);
        parent.appendChild(document.createTextNode(textBefore));
        parent.appendChild(a);
        if (textAfter) {
          return parseLinks(parent, textAfter, true);
        }
        this._render(parent);
        return true;
      } else if (isRec) {
        parent.appendChild(document.createTextNode(str));
        this._render(parent);
        return true;
      } else {
        return false;
      }
    };
    if (parseLinks(parent || document.createElement("p"), str)) {
      return;
    }
    if (parent) {
      parent.appendChild(document.createTextNode(str));
      this._render(parent);
      return;
    }

    const el = document.createElement("p");
    el.textContent = str;
    this._render(el);
    return;
  }

  _render(el, isNew = false) {
    if (isNew) {
      this.dots++;
      const dot = document.createElement("div");
      dot.classList.add("dot");
      const fill = document.createElement("div");
      fill.classList.add("fill");
      dot.appendChild(fill);
      this.nav.appendChild(dot);

      const cardWrapper = document.createElement("div");
      cardWrapper.classList.add("card-wrapper");
      const card = document.createElement("div");
      card.classList.add("card");
      card.appendChild(el);
      cardWrapper.appendChild(card);
      this.cards.appendChild(cardWrapper);
      this.currCard = card;
      this.nav.style.top = `calc(50% - (15px * ${this.dots} + 20px * ${
        this.dots - 1
      }) / 2)`;
      return;
    }
    if (this.currCard) {
      this.currCard.appendChild(el);
    }
  }

  _init() {
    this.nav = document.createElement("nav");
    this.cards = document.createElement("div");
    this.cards.classList.add("cards");
    this.root.appendChild(this.nav);
    this.root.appendChild(this.cards);
  }

  _setActiveDot() {
    Array.from(this.nav.children).forEach((item, idx) => {
      item.classList.remove("active");
      if (idx === this.activeDot) {
        item.classList.add("active");
      }
    });
  }

  _finish() {
    this.nav.children[0].classList.add("active");
    let timestamp = 0;
    Array.from(this.nav.children).forEach((item, i) => {
      item.addEventListener("click", () => {
        this.activeDot = i;
        this._scroll();
        this._setActiveDot();
      });
    });
    this.root.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (Date.now() - timestamp < 250) {
        timestamp = Date.now();
        return;
      }
      timestamp = Date.now();
      let delta = 1;
      if (e.deltaY < 0) {
        delta = -1;
      }
      this.activeDot += delta;
      if (this.activeDot < 0) {
        this.activeDot = 0;
      }
      if (this.activeDot >= this.cards.children.length) {
        this.activeDot = this.cards.children.length - 1;
      }
      this._setActiveDot();
      this._scroll();
    });
    this.root.addEventListener("click", (e) => {
      if (this.activeDot < this.dots - 1) {
        this.activeDot++;
        this._setActiveDot();
        this._scroll();
      }
    });
    this.root.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (this.activeDot > 0) {
        this.activeDot--;
        this._setActiveDot();
        this._scroll();
      }
    });
  }
  _scroll() {
    this.cards.children[this.activeDot].scrollIntoView({
      behavior: "smooth",
    });
  }
}
