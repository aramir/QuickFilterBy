"use strict";

// Using a closure to not leak anything but the API to the outside world.
(function (exports) {

  const COL_SENDER = "senderCol";
  const COL_RECIPIENT = "recipientCol";
  const COL_SUBJECT = "subjectCol";

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
      setQuickFilter(win, col.id, cellText)
    }
  }

  function setQuickFilter(win, mode, value) {
    let filter = win.QuickFilterBarMuxer.maybeActiveFilterer;
    if (!filter) return;
    if (mode != COL_RECIPIENT && mode != COL_SENDER && mode != COL_SUBJECT) return;
    filter.filterValues.text.text = value;
    filter.filterValues.text.states.body = false;
    filter.filterValues.text.states.recipients = (mode == COL_RECIPIENT);
    filter.filterValues.text.states.sender = (mode == COL_SENDER);
    filter.filterValues.text.states.subject = (mode == COL_SUBJECT);
    win.QuickFilterBarMuxer._showFilterBar(true);
    win.QuickFilterBarMuxer.deferredUpdateSearch();
  }

  // Export the api by assigning in to the exports parameter of the anonymous closure
  // function, which is the global this.
  exports.MessagesListAdapter = MessagesListAdapter;

})(this)
