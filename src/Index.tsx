import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import SecondScreen from './voice/Voice';

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/voice" element={<SecondScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;