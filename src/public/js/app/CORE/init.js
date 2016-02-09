/**
 * Загружає всі необхідні модулі CORE. Якщо якийсь із модулів згенерував помилку, подальша робота припиняється
 */



define(["storage", "session", "appRouter", "webitelConnector", "roleChecker"], function(storage, session, appRouter, webitelConnector, roleChecker) {

    // закриваємо доступ до деяких розділів
    roleChecker.sectionPanel.changeVisibilityLeftPanel();
});