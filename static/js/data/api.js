class API {
  static getConfig() {
    return $.get("serve_config.json");
  }

  static getCalendar() {
    return $.get("serve_main_calendar.json");
  }

  static getPapers() {
    return $.get("papers.json");
  }

  static getPapersAndProjection() {
    return Promise.all([
      $.get("papers.json"),
      $.get("serve_papers_projection.json"),
    ]);
  }
}
