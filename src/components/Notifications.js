import {
  Box,
  Heading,
  VStack,
  Text,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiClock, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../supabase/config';
export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('sentAt', { ascending: false })
          .limit(20);

        if (error) throw error;

        setNotifications(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'today_payment':
        return FiCheck;
      case 'tomorrow_payment':
        return FiClock;
      case 'overdue_payment':
        return FiAlertTriangle;
      default:
        return FiClock;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'today_payment':
        return 'green';
      case 'tomorrow_payment':
        return 'blue';
      case 'overdue_payment':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) return <Box ml="250px" p={8}><Spinner /></Box>;
  if (error) return (
    <Box ml="250px" p={8}>
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    </Box>
  );

  return (
    <Box ml="250px" p={8}>
      <Heading size="lg" mb={6}>Notifications</Heading>
      <VStack spacing={4} align="stretch">
        {notifications.length === 0 ? (
          <Card>
            <CardBody>
              <Text>No notifications available</Text>
            </CardBody>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <CardHeader>
                <HStack spacing={3}>
                  <Icon 
                    as={getNotificationIcon(notification.type)} 
                    color={`${getNotificationColor(notification.type)}.500`}
                  />
                  <Text fontWeight="bold">
                    {notification.title}
                    <Badge 
                      ml={2} 
                      colorScheme={getNotificationColor(notification.type)}
                    >
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody>
                <Text>{notification.employeeData.employeeName} - PKR{notification.employeeData.amount.toLocaleString()}</Text>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {new Date(notification.sentAt).toLocaleString()}
                </Text>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>
    </Box>
  );
};