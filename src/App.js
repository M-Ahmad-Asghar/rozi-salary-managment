import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { EmployeeList } from './components/EmployeeList';
import { SalaryTracker } from './components/SalaryTracker';
import { Notifications } from './components/Notifications';
import { PaymentSchedule } from './components/PaymentSchedule';
import { Box, Flex } from '@chakra-ui/react';

function App() {
  return (
    <ChakraProvider>
      <AuthContextProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Flex width={"100%"}>
                    <Box pos={"relative"} zIndex={20}>
                    <Sidebar />
                    </Box>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/employees" element={<EmployeeList />} />
                      <Route path="/salary-tracker" element={<SalaryTracker />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/schedule" element={<PaymentSchedule />} />
                    </Routes>
                  </Flex>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Login />} />
          </Routes>
        </Router>
      </AuthContextProvider>
    </ChakraProvider>
  );
}

export default App;