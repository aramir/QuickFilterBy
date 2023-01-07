"use strict";

// Using a closure to not leak anything but the API to the outside world.
(function (exports) {

  // Get various parts of the WebExtension framework that we need.
  var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
  var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

  const listenerThreadPanes = new Set();

  class MessagesListAdapter extends ExtensionCommon.ExtensionAPI {
    onStartup() {
      //console.log("QFB: MessagesListAdapter Init 5")
    }

    onShutdown(isAppShutdown) {
      if (isAppShutdown) {
        return; // the application gets unloaded anyway
      }
      //removing previously set onClick listeners
      for (const threadPane of listenerThreadPanes.values()) {
        threadPane.removeEventListener("click", onMessageListClick, true);
      }
      // Flush all caches
      Services.obs.notifyObservers(null, "startupcache-invalidate");
    }

    getAPI(context) {
      return {
        MessagesListAdapter: {
          initWindow: async function (windowId) {
            //console.log("QFB: MessagesListAdapter Window Init")
            let win = context.extension.windowManager.get(windowId).window;
            let type = win.document.documentElement.getAttribute('windowtype');
            if (!["mail:3pane", "mailnews:virtualFolderList"].includes(type)) {
              return;
            }
            if (type == 'mail:3pane') {
              let threadPane = win.document.getElementById("threadTree");
              if (threadPane) {
                threadPane.addEventListener("click", onMessageListClick,true);
                listenerThreadPanes.add(threadPane);
              }
            }
          }
        },
      };
    }
  };

  function onMessageListClick(event) {
    if (event.button == 0 && event.altKey) {
      let win = (event.view || event.currentTarget.ownerDocument.defaultView);
      let target = event.composedTarget;
      if (!target) return;
      let box = target.parentNode;
      let cell = box.getCellAt(event.clientX, event.clientY); // row => 1755, col => { id : 'sizeCol', columns : array }
      let row = cell.row;
      let col = cell.col;
      let cellText = box.view.getCellText(row, col);
      setFilter(win.QuickFilterBarMuxer.maybeActiveFilterer, col.id, cellText)
      win.QuickFilterBarMuxer._showFilterBar(true);
      win.QuickFilterBarMuxer.deferredUpdateSearch();
    }
  }

  function setFilter(filter, mode, value) {
    if (!filter) return;
    filter.filterValues.text.text = value;
    filter.filterValues.text.states.body = false;
    filter.filterValues.text.states.recipients = (mode == "recepientCol");
    filter.filterValues.text.states.sender = (mode == "senderCol");
    filter.filterValues.text.states.subject = (mode == "subjectCol");
  }

  // Export the api by assigning in to the exports parameter of the anonymous closure
  // function, which is the global this.
  exports.MessagesListAdapter = MessagesListAdapter;

})(this)