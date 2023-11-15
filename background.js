browser.menus.create({
  id: "sender",
  title: browser.i18n.getMessage("sender"),
  contexts: ["message_list"],
  async onclick(info) {
    let message = info.selectedMessages.messages[0];
    await browser.mailTabs.setQuickFilter({
      text: {
        text: message.author,
        author: true,
      },
    });
  },
});
browser.menus.create({
  id: "recipient",
  title: browser.i18n.getMessage("recipient"),
  contexts: ["message_list"],
  async onclick(info) {
    let message = info.selectedMessages.messages[0];
    await browser.mailTabs.setQuickFilter({
      text: {
        text: message.recipients.join(", "),
        recipients: true,
      },
    });
  },
});
browser.menus.create({
  id: "recipients",
  title: browser.i18n.getMessage("recipients"),
  contexts: ["message_list"],
  async onclick(info) {
    let message = info.selectedMessages.messages[0];
    await browser.mailTabs.setQuickFilter({
      text: {
        text: message.recipients.join(", "),
        recipients: true,
      },
    });
  },
});
browser.menus.create({
  id: "subject",
  title: browser.i18n.getMessage("subject"),
  contexts: ["message_list"],
  async onclick(info) {
    let message = info.selectedMessages.messages[0];
    await browser.mailTabs.setQuickFilter({
      text: {
        text: message.subject,
        subject: true,
      },
    });
  },
});

browser.menus.onShown.addListener((info) => {
  let oneMessage = info.selectedMessages && info.selectedMessages.messages.length == 1;
  browser.menus.update("sender", { visible: oneMessage });
  browser.menus.update("recipient", { visible: oneMessage });
  browser.menus.update("recipients", { visible: oneMessage });
  browser.menus.update("subject", { visible: oneMessage });
  browser.menus.refresh();
});

browser.MessagesListAdapter.onMessageListClick.addListener((columnName, columnText) => {
  // Our event forwards the raw column names. But since this add-on maintains
  // the Experiment, it does not really matter where we have to adjust the column
  // names if core changes them.
  browser.mailTabs.setQuickFilter({
    text: {
      text: columnText,
      subject: columnName == "subjectcol-column",
      recipients: columnName == "recipientcol-column",
      author: (columnName == "sendercol-column" || columnName == "correspondentcol-column")
    },
  })
});

async function main() {
  messenger.tabs.onCreated.addListener((tab) => {
    messenger.MessagesListAdapter.initTab(tab.id);
  });
  
  let tabs = await browser.tabs.query({})
  for (let tab of tabs) {
    messenger.MessagesListAdapter.initTab(tab.id);
  }
}

main();
