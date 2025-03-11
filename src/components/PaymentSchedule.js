import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  VStack,
  Icon,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiClock, FiUser, FiCalendar } from 'react-icons/fi';
import { supabase } from '../supabase/config';
export const PaymentSchedule = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const currentUser = 'ZamanTariq'; // Replace with dynamic user data

  // Update current date time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now
        .toISOString()
        .replace('T', ' ')
        .split('.')[0];
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        // Create date range for selected month
        const year = new Date().getFullYear();
        const startDate = new Date(year, selectedMonth - 1, 1).toISOString();
        const endDate = new Date(year, selectedMonth, 0).toISOString();

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .gte('nextSalaryDate', startDate)
          .lte('nextSalaryDate', endDate)
          .order('nextSalaryDate', { ascending: true });

        if (error) throw error;

        setScheduleData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedMonth]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  const getPaymentStatus = (date) => {
    if (!date) return { label: 'Unknown', color: 'gray' };
    
    const now = new Date();
    const paymentDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(paymentDate.getTime())) {
      return { label: 'Invalid Date', color: 'gray' };
    }
    
    if (paymentDate < now) {
      return { label: 'Overdue', color: 'red' };
    } else if (paymentDate.toDateString() === now.toDateString()) {
      return { label: 'Due Today', color: 'orange' };
    } else {
      return { label: 'Upcoming', color: 'green' };
    }
  };

  if (loading) {
    return (
      <Box ml="250px" p={8}>
        <VStack spacing={4} align="center">
          <Spinner size="xl" />
          <Text>Loading payment schedule...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box ml="250px" p={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box ml="250px" width={"100%"} p={8}>
      {/* Header Section */}
      <Box mb={6} bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="blue.100">
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FiCalendar} boxSize={6} color="blue.500" />
              <Heading size="lg">Payment Schedule</Heading>
            </HStack>
            <VStack align="flex-end" spacing={2}>
              <HStack spacing={3}>
                <Icon as={FiClock} color="gray.500" />
                <Text fontFamily="mono" fontSize="sm" color="gray.600">
                  Current Date and Time: {currentDateTime}
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
          <HStack justify="space-between">
            <Text color="gray.600">
              Total Scheduled Payments: {scheduleData.length}
            </Text>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              w="200px"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </Select>
          </HStack>
        </VStack>
      </Box>

      {/* Table Section */}
      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="blue.100">
        {scheduleData.length === 0 ? (
          <VStack py={8} spacing={3}>
            <Icon as={FiCalendar} boxSize={8} color="gray.400" />
            <Text color="gray.500" fontSize="lg">No scheduled payments for this month</Text>
            <Text color="gray.400" fontSize="sm">Select a different month or add new payments</Text>
          </VStack>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Employee</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {scheduleData.map((schedule) => {
                const status = getPaymentStatus(schedule.nextSalaryDate);
                return (
                  <Tr key={schedule.id}>
                    <Td>{formatDate(schedule.nextSalaryDate)}</Td>
                    <Td fontWeight="medium">{schedule.name}</Td>
                    <Td>PKR {schedule.gross_salary?.toLocaleString()}</Td>
                    <Td>
                      <Badge colorScheme={status.color}>
                        {status.label}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
};

export default PaymentSchedule;