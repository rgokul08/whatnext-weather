import React from "react";
import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import { ComparePage, FavoritesPage, ForecastPage, LiveLayerPage } from "./pages/WeatherRoute";
function App() {
  return /* @__PURE__ */ React.createElement(Switch, null, /* @__PURE__ */ React.createElement(Route, { path: "/", component: Home }), /* @__PURE__ */ React.createElement(Route, { path: "/forecast", component: ForecastPage }), /* @__PURE__ */ React.createElement(Route, { path: "/map", component: LiveLayerPage }), /* @__PURE__ */ React.createElement(Route, { path: "/favorites", component: FavoritesPage }), /* @__PURE__ */ React.createElement(Route, { path: "/compare", component: ComparePage }), /* @__PURE__ */ React.createElement(Route, { path: "/weather/:city", component: Home }), /* @__PURE__ */ React.createElement(Route, { component: Home }));
}
export {
  App as default
};
