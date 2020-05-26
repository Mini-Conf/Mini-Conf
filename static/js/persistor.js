class Persistor {
  constructor(storageID) {
    this.storageID = storageID;
    this.canStore = typeof Storage !== "undefined";
  }

  getAll() {
    if (this.canStore) {
      return JSON.parse(window.localStorage.getItem(this.storageID)) || {};
    }
    return {};
  }

  setAll(store) {
    if (this.canStore) {
      window.localStorage.setItem(this.storageID, JSON.stringify(store));
      return true;
    }
    return false;
  }

  set(property, value) {
    const store = this.getAll() || {};
    const old = store[property];
    if (value) store[property] = value;
    else delete store[property];
    this.setAll(store);
    return old;
  }

  get(property) {
    const store = this.getAll() || {};
    return store[property];
  }

  cleanup() {
    if (this.canStore) {
      window.localStorage.removeItem(this.storageID);
    }
  }
}
