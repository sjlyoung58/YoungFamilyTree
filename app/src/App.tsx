import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import PersonDetail from './pages/PersonDetail';
import Timeline from './pages/Timeline';
import Sources from './pages/Sources';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="people" element={<People />} />
        <Route path="people/:id" element={<PersonDetail />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="sources" element={<Sources />} />
      </Route>
    </Routes>
  );
}
