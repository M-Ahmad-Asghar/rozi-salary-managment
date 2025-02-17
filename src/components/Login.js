import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    useToast,
  } from '@chakra-ui/react';
  import { useState } from 'react';
  import { useAuth } from '../context/AuthContext';
  import { useNavigate } from 'react-router-dom';
  
  export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
  
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Box w="400px" p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
          <VStack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Login
            </Text>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <Button colorScheme="blue" width="full" onClick={handleSubmit}>
              Login
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  };