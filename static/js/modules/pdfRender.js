(function () {
  let currentPageIndex = 0;
  const pageMode = 1;
  let cursorIndex = Math.floor(currentPageIndex / pageMode);
  let pdfInstance = null;
  let totalPagesCount = 0;

  let viewport = null;

  /**
   * render one page
   * @param page
   */
  function renderPage(page) {
    let pdfViewport = page.getViewport(1);

    const container =
      viewport.children[page.pageIndex - cursorIndex * pageMode];
    pdfViewport = page.getViewport(
      (2 * container.offsetWidth) / pdfViewport.width
    );
    const canvas = container.children[0];
    const context = canvas.getContext("2d");
    canvas.height = pdfViewport.height;
    canvas.width = pdfViewport.width;

    page.render({
      canvasContext: context,
      viewport: pdfViewport,
    });
  }

  /**
   * render PDF
   */
  function render() {
    cursorIndex = Math.floor(currentPageIndex / pageMode);
    const startPageIndex = cursorIndex * pageMode;
    const endPageIndex =
      startPageIndex + pageMode < totalPagesCount
        ? startPageIndex + pageMode - 1
        : totalPagesCount - 1;

    const renderPagesPromises = [];
    for (let i = startPageIndex; i <= endPageIndex; i += 1) {
      renderPagesPromises.push(pdfInstance.getPage(i + 1));
    }

    Promise.all(renderPagesPromises).then((pages) => {
      const pagesHTML = `<div style="width: ${
        pageMode > 1 ? "50%" : "100%"
      }"><canvas style="width:100%"></canvas></div>`.repeat(pages.length);
      viewport.innerHTML = pagesHTML;
      pages.forEach(renderPage);
    });
  }

  function onPagerButtonsClick(event) {
    const action = event.target.getAttribute("data-pager");
    if (action === "prev") {
      if (currentPageIndex === 0) {
        return;
      }
      currentPageIndex -= pageMode;
      if (currentPageIndex < 0) {
        currentPageIndex = 0;
      }
      render();
    }
    if (action === "next") {
      if (currentPageIndex === totalPagesCount - 1) {
        return;
      }
      currentPageIndex += pageMode;
      if (currentPageIndex > totalPagesCount - 1) {
        currentPageIndex = totalPagesCount - 1;
      }
      render();
    }
  }

  /**
   * init PDF viewer and first render page
   * @param pdfURL -- url for PDF
   * @param selector -- css selector for container DIV
   */
  window.initPDFViewer = function (pdfURL, selector) {
    selector = selector || "#pdf_view";
    viewport = document.querySelector(selector);

    pdfjsLib.getDocument(pdfURL).then((pdf) => {
      pdfInstance = pdf;
      totalPagesCount = 1;
      render();
    });
  };
})();
