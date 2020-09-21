/* eslint-disable no-underscore-dangle */
class API {
  static getConfig() {
    if (API.configCache == null) {
      API.configCache = $.get("serve_config.json");
    }
    console.log("-hen-- cache Hit");
    return API.configCache;
  }

  static getCalendar() {
    return $.get("serve_main_calendar.json");
  }

  static getPapers() {
    if (API.paperCache == null) {
      API.paperCache = $.get("papers.json");
    }
    return API.paperCache;
  }

  static getPapersAndProjection() {
    return Promise.all([
      API.getPapers(),
      $.get("serve_papers_projection.json"),
    ]);
  }

  static get persistorRead() {
    if (API._persistorReadCache == null){
      API._persistorReadCache = new Persistor(`miniconf-${API.getConfig().name}-read`);
    }
    return API._persistorReadCache;
  }

  static readPaperAll() {
    return new Promise((resolve) => resolve(API.persistorRead.getAll()));
  }

  static async readPaperSet(paperID, read = true) {
    return this.persistorRead.set(paperID, read);
  }
}

API.configCache = null;
API.paperCache = null;
API._persistorReadCache = null;
API.persistorWanted = null;
// new Persistor(
//   `miniconf-${API.getConfig().name}-interested`
// );
