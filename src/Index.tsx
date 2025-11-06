import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import Shortcuts from './shortcuts/Shortcuts';
import SecondScreen from './voice/Voice';
import { ThemeProvider } from "./components/theme-provider";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Home />
          </ThemeProvider>
        } />
        <Route path="/shortcuts" element={
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Shortcuts />
          </ThemeProvider>
        } />
        <Route path="/voice" element={<SecondScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;