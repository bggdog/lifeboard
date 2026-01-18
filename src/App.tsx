import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './components/Dashboard';
import WorkNotes from './components/WorkNotes';
import GymNotes from './components/GymNotes';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/work" element={<WorkNotes />} />
          <Route path="/gym" element={<GymNotes />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
