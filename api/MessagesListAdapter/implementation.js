"use strict";

// Using a closure to not leak anything but the API to the outside world.
(function (exports) {

  // Get various parts of the WebExtension framework that we need.
  var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

  const listenerThreadPanes = new Set();
  const messageListListener = new ExtensionCommon.EventEmitter();

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
        if (threadPane) {
          threadPane.treeTable.removeEventListener("click", onMessageListClick, true);
        }
      }
      // Flush all caches
      Services.obs.notifyObservers(null, "startupcache-invalidate");
    }


    getAPI(context) {
      return {
        MessagesListAdapter: {
          onMessageListClick: new ExtensionCommon.EventManager({
            context,
            name: "MessagesListAdapter.onMessageListClick",
            register(fire) {
              function callback(event, columnName, columnText) {
                return fire.async(columnName, columnText);
              }
              messageListListener.on("messagelist-clicked", callback);
              return function () {
                messageListListener.off("messagelist-clicked", callback);
              };
            },
          }).api(),

          initTab: async function (tabId) {
            let { nativeTab } = context.extension.tabManager.get(tabId);
            let about3PaneWindow = getAbout3PaneWindow(nativeTab);
            if (!about3PaneWindow) {
              return
            }
            let threadPane = about3PaneWindow.threadPane
            if (threadPane) {
              threadPane.treeTable.addEventListener("click", onMessageListClick, true);
              listenerThreadPanes.add(threadPane);
            }
          }
        },
      };
    }
  };

  function getAbout3PaneWindow(nativeTab) {
    if (nativeTab.mode && nativeTab.mode.name == "mail3PaneTab") {
      return nativeTab.chromeBrowser.contentWindow
    }
    return null;
  }

  function onMessageListClick(event) {
    if (event.button == 0 && event.altKey) {
      // We do not use the window/tab, but rely on setQuickfilter updating the
      // currently displayed tab, if no tab is specified.
      // let win = (event.view || event.currentTarget.ownerDocument.defaultView);
      
      let target = event.composedTarget;
      if (!target) return;

      let box = target.closest("td");
      let columnName = [...box.classList.values()].find(e => e.endsWith("-column"))
      let columnText = box.title || box.textContent;

      if (columnName) {
        // Let us forward the information back to the WebExtension through a
        // WebExtension event, so that the background can use the mailTabs API
        // to set the quickfilter.
        messageListListener.emit("messagelist-clicked", columnName, columnText);
      }
    }
  }

  // Export the api by assigning in to the exports parameter of the anonymous closure
  // function, which is the global this.
  exports.MessagesListAdapter = MessagesListAdapter;

})(this)
