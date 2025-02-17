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
  Spinner,
  Text,
  Alert,
  AlertIcon,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  Flex,
  Divider,
  Icon,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { FiImage, FiClock, FiUser, FiDollarSign, FiTrash2 } from "react-icons/fi";
import { deleteSalaryTransaction } from "../firebase/employeeService";
import {
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

export const SalaryTracker = () => {
  const [salaryData, setSalaryData] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  console.log("salaryData", salaryData);
  
  const cancelRef = React.useRef();
  const toast = useToast();

  // Add this function to handle delete
  const handleDeleteTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Add this function to confirm deletion
  const confirmDelete = async () => {
    setIsDeletingTransaction(true);
    try {
      await deleteSalaryTransaction(
        selectedTransaction.id,
        selectedTransaction.employeeId
      );
      toast({
        title: "Transaction deleted",
        description: "The salary transaction has been successfully deleted.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error deleting transaction",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingTransaction(false);
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const { user } = useAuth();
  const currentUser = user?.email;

  // Update current date time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now
        .toISOString()
        .replace("T", " ")
        .split(".")[0]; // YYYY-MM-DD HH:MM:SS
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesSnapshot = await getDocs(collection(db, "employees"));
        const employeesMap = {};
        employeesSnapshot.forEach((doc) => {
          employeesMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        setEmployees(employeesMap);
      } catch (err) {
        setError("Error fetching employees: " + err.message);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch salary transactions
  useEffect(() => {
    if (!Object.keys(employees).length) return;

    const fetchSalaryData = () => {
      try {
        const q = query(
          collection(db, "salaryTransactions"),
          orderBy("transactionDate", "desc")
        );

        return onSnapshot(q, (querySnapshot) => {
          const salaries = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const employee = employees[data.employeeId] || {};
            return {
              id: doc.id,
              ...data,
              employeeName: employee.name || "Unknown Employee",
              designation: employee.designation || "N/A",
            };
          });
          setSalaryData(salaries);
          setLoading(false);
        });
      } catch (err) {
        setError("Error fetching salary data: " + err.message);
        setLoading(false);
      }
    };

    const unsubscribe = fetchSalaryData();
    return () => unsubscribe && unsubscribe();
  }, [employees]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    onOpen();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "green",
      pending: "yellow",
      overdue: "red",
    };
    return colors[status] || "gray";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const ImagePreviewModal = () => (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      isCentered
      motionPreset="none"
    >
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent maxW="90vw" maxH="90vh" bg="transparent">
        <ModalHeader bg="rgba(0,0,0,0.8)" color="white" borderTopRadius="md">
          Receipt Preview
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody p={0} bg="black">
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Receipt"
              w="100%"
              h="80vh"
              objectFit="contain"
              loading="eager"
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  if (loading) {
    return (
      <Box ml="250px" p={8}>
        <VStack spacing={4} align="center">
          <Spinner size="xl" />
          <Text>Loading salary data...</Text>
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
    <Box ml="250px" width={"calc(100% - 250px)"} p={8}>
      {/* Header Section */}
      <Box mb={6} bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="blue.100">
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FiDollarSign} boxSize={6} color="blue.500" />
              <Heading size="lg">Salary Tracker</Heading>
            </HStack>
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
          <HStack justify="space-between" px={2}>
            <HStack spacing={8}>
              <Box>
                <Text color="gray.500" fontSize="sm">
                  Total Transactions
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  {salaryData.length}
                </Text>
              </Box>
              <Box>
                <Text color="gray.500" fontSize="sm">
                  Active Employees
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  {Object.keys(employees).length}
                </Text>
              </Box>
            </HStack>
          </HStack>
        </VStack>
      </Box>
  
      {/* Table Section */}
      <Box 
        bg="white" 
        p={6} 
        borderRadius="lg" 
        boxShadow="sm" 
        border="1px solid" 
        borderColor="blue.100"
        position="relative"
      >
        <Box overflowX={"auto"}>
          {loading ? (
            <VStack py={8} width="100%">
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Loading salary transactions...</Text>
            </VStack>
          ) : salaryData.length === 0 ? (
            <VStack py={8} width="100%">
              <Icon as={FiDollarSign} boxSize={8} color="gray.400" />
              <Text color="gray.500" fontSize="lg">
                No salary records found
              </Text>
              <Text color="gray.400" fontSize="sm">
                Transactions will appear here once they are recorded
              </Text>
            </VStack>
          ) : (
            <Table  variant="simple" sx={{ minWidth: '1200px' }}>
              <Thead>
                <Tr>
                  <Th>Employee</Th>
                  <Th>Designation</Th>
                  <Th>Transaction Date</Th>
                  <Th isNumeric>Amount</Th>
                  <Th>Transaction #</Th>
                  {/* <Th>Next Due Date</Th> */}
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {salaryData.map((salary) => (
                  <Tr key={salary.id}>
                    <Td fontWeight="medium">{salary.employeeName}</Td>
                    <Td>{salary.designation}</Td>
                    <Td>
                      {salary.transactionDate?.seconds
                        ? new Date(salary.transactionDate.seconds * 1000)
                            .toISOString()
                            .replace("T", " ")
                            .split(".")[0]
                        : "N/A"}
                    </Td>
                    <Td isNumeric fontWeight="bold">
                      {formatCurrency(salary.transactionAmount || 0)}
                    </Td>
                    <Td>
                      <Text as="code" fontSize="sm">
                        {salary.transactionNumber}
                      </Text>
                    </Td>
                    {/* <Td>
                      {salary.nextSalaryDate?.seconds
                        ? new Date(salary.nextSalaryDate.seconds * 1000)
                            .toISOString()
                            .split("T")[0]
                        : "N/A"}
                    </Td> */}
                    <Td>
                      <Badge colorScheme={getStatusColor(salary.status)}>
                        {salary.status || 'N/A'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {salary.receiptUrl ? (
                          <Box
                            position="relative"
                            width="40px"
                            height="40px"
                            role="group"
                          >
                            <Image
                              src={salary.receiptUrl}
                              alt="Receipt thumbnail"
                              boxSize="40px"
                              objectFit="cover"
                              borderRadius="md"
                              cursor="pointer"
                              onClick={() => handleImageClick(salary.receiptUrl)}
                              _groupHover={{ opacity: 0.7 }}
                              transition="opacity 0.2s"
                            />
                            <IconButton
                              icon={<FiImage />}
                              size="sm"
                              position="absolute"
                              top="50%"
                              left="50%"
                              transform="translate(-50%, -50%)"
                              opacity="0"
                              _groupHover={{ opacity: 1 }}
                              onClick={() => handleImageClick(salary.receiptUrl)}
                              aria-label="View receipt"
                              colorScheme="blue"
                            />
                          </Box>
                        ) : (
                          <Text color="gray.500" fontSize="sm">
                            No receipt
                          </Text>
                        )}
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(salary)}
                          aria-label="Delete transaction"
                          isDisabled={isDeletingTransaction}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>
  
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => !isDeletingTransaction && setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Transaction
            </AlertDialogHeader>
  
            <AlertDialogBody>
              Are you sure you want to delete this salary transaction? This action
              cannot be undone.
              <VStack align="start" mt={4} spacing={2}>
                <Text>
                  <strong>Employee:</strong> {selectedTransaction?.employeeName}
                </Text>
                <Text>
                  <strong>Amount:</strong>{" "}
                  {selectedTransaction &&
                    formatCurrency(selectedTransaction.transactionAmount)}
                </Text>
                <Text>
                  <strong>Transaction #:</strong>{" "}
                  {selectedTransaction?.transactionNumber}
                </Text>
              </VStack>
            </AlertDialogBody>
  
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => setIsDeleteDialogOpen(false)}
                isDisabled={isDeletingTransaction}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDelete} 
                ml={3}
                isLoading={isDeletingTransaction}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
  
      {/* Image Preview Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        isCentered
        motionPreset="none"
      >
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent maxW="90vw" maxH="90vh" bg="transparent">
          <ModalHeader bg="rgba(0,0,0,0.8)" color="white" borderTopRadius="md">
            Receipt Preview
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={0} bg="black">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Receipt"
                w="100%"
                h="80vh"
                objectFit="contain"
                loading="eager"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SalaryTracker;
