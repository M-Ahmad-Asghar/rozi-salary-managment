import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  HStack,
  VStack,
  Icon,
  Divider,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiClock, FiUser, FiAlertCircle, FiDollarSign } from 'react-icons/fi';
import { getSalaryAlerts } from '../firebase/employeeService';
import { Timestamp } from 'firebase/firestore';
import { SalaryPaymentForm } from './forms/SalaryPaymentForm';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const [salaryAlerts, setSalaryAlerts] = useState({ upcoming: [], overdue: [] });
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();
  const currentUser = user?.email;

  // Update current date time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now.toISOString()
        .replace('T', ' ')
        .split('.')[0];
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch salary alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = await getSalaryAlerts();
        setSalaryAlerts(alerts);
      } catch (error) {
        toast({
          title: 'Error fetching salary alerts',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchAlerts();
  }, [toast]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const handlePaySalary = (employee) => {
    setSelectedEmployee(employee);
    onPayOpen();
  };

  return (
    <Box ml="250px" width={"100%"} p={8}>
      {/* Header Section */}
      <Box mb={6} bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="blue.100">
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between" align="center">
            <Heading size="lg">Dashboard</Heading>
            <VStack align="flex-end" spacing={2}>
              <HStack spacing={3}>
                <Icon as={FiClock} color="gray.500" />
                <Text fontFamily="mono" fontSize="sm" color="gray.600">
                  Current Date and Time : {currentDateTime}
                </Text>
              </HStack>
              <HStack spacing={3}>
                <Icon as={FiUser} color="gray.500" />
                <Text fontWeight="medium" fontSize="sm" color="gray.600">
                  Current User's Login: {currentUser}
                </Text>
              </HStack>
            </VStack>
          </Flex>
          <Divider />
        </VStack>
      </Box>

      {/* Stats Grid */}
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <Stat bg="white" border="1px solid" borderColor="blue.100" p={5} borderRadius="lg" boxShadow="sm">
          <StatLabel>Upcoming Salary Payments</StatLabel>
          <StatNumber>{salaryAlerts.upcoming.length}</StatNumber>
          <StatHelpText>Next 7 Days</StatHelpText>
        </Stat>
        <Stat bg="white" border="1px solid" borderColor="blue.100" p={5} borderRadius="lg" boxShadow="sm">
          <StatLabel>Overdue Salary Payments</StatLabel>
          <StatNumber color="red.500">{salaryAlerts.overdue.length}</StatNumber>
          <StatHelpText>Need Immediate Attention</StatHelpText>
        </Stat>
      </Grid>

      {/* Upcoming Payments Table */}
      {salaryAlerts.upcoming.length > 0 && (
        <Box mt={8} bg="white" p={5} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="blue.100">
          <HStack mb={4} spacing={2}>
            <Icon as={FiAlertCircle} color="yellow.500" />
            <Heading size="md">Upcoming Salary Payments</Heading>
          </HStack>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Employee Name</Th>
                <Th>Due Date</Th>
                <Th>Days Until Due</Th>
                <Th>Expected Amount</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {salaryAlerts.upcoming.map((alert) => (
                <Tr key={alert.id}>
                  <Td fontWeight="medium">{alert.name}</Td>
                  <Td>{formatDate(alert.nextSalaryDate)}</Td>
                  <Td>{alert.daysUntilDue}</Td>
                  <Td isNumeric>
                    {alert.grossSalary?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'PKR'
                    })}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handlePaySalary(alert)}
                    >
                      Pay Salary
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Overdue Payments Table */}
      {salaryAlerts.overdue.length > 0 && (
        <Box mt={8} bg="red.50" p={5} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="red.200">
          <HStack mb={4} spacing={2}>
            <Icon as={FiAlertCircle} color="red.500" />
            <Heading size="md" color="red.500">Overdue Salary Payments</Heading>
          </HStack>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Employee Name</Th>
                <Th>Due Date</Th>
                <Th>Days Overdue</Th>
                <Th>Expected Amount</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {salaryAlerts.overdue.map((alert) => (
                <Tr key={alert.id}>
                  <Td fontWeight="medium">{alert.name}</Td>
                  <Td>{formatDate(alert.nextSalaryDate)}</Td>
                  <Td color="red.500" fontWeight="bold">
                    {alert.daysOverdue}
                  </Td>
                  <Td isNumeric>
                    {alert.grossSalary?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'PKR'
                    })}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handlePaySalary(alert)}
                    >
                      Pay Salary
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Salary Payment Form */}
      {selectedEmployee && (
        <SalaryPaymentForm 
          isOpen={isPayOpen} 
          onClose={() => {
            onPayClose();
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
        />
      )}
    </Box>
  );
};