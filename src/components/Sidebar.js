import {
  Box,
  VStack,
  Icon,
  Text,
  Flex,
  Link,
  Divider,
  Button,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiDollarSign, 
  FiUsers, 
  FiBell,
  FiCalendar,
  FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const menuItems = [
    { icon: FiHome, text: 'Dashboard', path: '/dashboard' },
    { icon: FiUsers, text: 'Employees', path: '/employees' },
    { icon: FiDollarSign, text: 'Salary Tracker', path: '/salary-tracker' },
    // { icon: FiBell, text: 'Notifications', path: '/notifications' },
    { icon: FiCalendar, text: 'Payment Schedule', path: '/schedule' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error logging out',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg="white"
      w="250px"
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      shadow="lg"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={1} align="stretch" py={5} flex="1">
        <Box px={4} py={4}>
          <Text fontSize="xl" fontWeight="bold">
            Salary Management
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {user?.email}
          </Text>
        </Box>
        <Divider />
        <VStack spacing={1} align="stretch" pt={4}>
          {menuItems.map((item) => (
            <Link
              as={RouterLink}
              to={item.path}
              key={item.path}
              _hover={{ textDecoration: 'none' }}
            >
              <Flex
                align="center"
                px={4}
                py={3}
                cursor="pointer"
                bg={location.pathname === item.path ? 'blue.50' : 'transparent'}
                color={location.pathname === item.path ? 'blue.500' : 'gray.700'}
                _hover={{ bg: 'blue.50', color: 'blue.500' }}
              >
                <Icon as={item.icon} mr={3} />
                <Text>{item.text}</Text>
              </Flex>
            </Link>
          ))}
        </VStack>
      </VStack>

      {/* Logout button at bottom */}
      <Box p={4} borderTop="1px" borderColor="gray.200">
        <Button
          leftIcon={<FiLogOut />}
          variant="ghost"
          width="full"
          justifyContent="flex-start"
          onClick={handleLogout}
          color="gray.700"
          _hover={{ bg: 'red.50', color: 'red.500' }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};