import { Route, Switch } from 'wouter';
import Home from './pages/Home';
import { ComparePage, FavoritesPage, ForecastPage, LiveLayerPage } from './pages/WeatherRoute';

export default function App() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/forecast" component={ForecastPage} />
    <Route path="/map" component={LiveLayerPage} />
    <Route path="/favorites" component={FavoritesPage} />
    <Route path="/compare" component={ComparePage} />
    <Route path="/weather/:city" component={Home} />
    <Route component={Home} />
  </Switch>;
}
