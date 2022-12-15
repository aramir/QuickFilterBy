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
