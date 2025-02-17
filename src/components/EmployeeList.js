import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Heading,
  HStack,
  VStack,
  useDisclosure,
  Badge,
  Icon,
  Text,
  Flex,
  Divider,
  useToast,
  ButtonGroup,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { AddEmployeeForm } from "./forms/AddEmployeeForm";
import { SalaryPaymentForm } from "./forms/SalaryPaymentForm";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FiClock,
  FiUser,
  FiUsers,
  FiTrash2,
  FiSearch,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export const EmployeeList = () => {
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isPayOpen,
    onOpen: onPayOpen,
    onClose: onPayClose,
  } = useDisclosure();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const toast = useToast();
  const { user } = useAuth();
  const currentUser = user?.email;

  // Update current date time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now
        .toISOString()
        .replace("T", " ")
        .split(".")[0];
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date helper function
  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime())
      ? "Invalid Date"
      : dateObj.toLocaleDateString();
  };

  // Sorting function
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      if (key === "nextSalaryDate" || key === "dateOfJoining") {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (key === "grossSalary") {
        return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
      }
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Handle sort
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  // Filter and sort employees
  useEffect(() => {
    let result = [...employees];

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const now = new Date();
      result = result.filter((employee) => {
        const nextSalaryDate = new Date(employee.nextSalaryDate);
        if (filterStatus === "overdue") {
          return nextSalaryDate < now;
        }
        return nextSalaryDate >= now;
      });
    }

    // Apply sorting
    result = sortData(result, sortConfig.key, sortConfig.direction);

    setFilteredEmployees(result);
  }, [employees, searchTerm, filterStatus, sortConfig]);

  // Fetch employees
  useEffect(() => {
    const q = query(collection(db, "employees"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const employeesData = [];
      querySnapshot.forEach((doc) => {
        employeesData.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(employeesData);
    });

    return () => unsubscribe();
  }, []);

  const handlePaySalary = (employee) => {
    setSelectedEmployee(employee);
    onPayOpen();
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteDoc(doc(db, "employees", employeeId));
        toast({
          title: "Employee deleted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Error deleting employee",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? <FiChevronUp /> : <FiChevronDown />;
  };

  return (
    <Box ml="250px" width="100%" p={8}>
      {/* Header Section */}
      <Box
        mb={6}
        bg="white"
        p={6}
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="blue.100"
      >
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FiUsers} boxSize={6} color="blue.500" />
              <Heading size="lg">Employees</Heading>
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

          {/* Search and Filter Section */}
          <Flex justify="space-between" align="center" gap={4}>
            <HStack spacing={4} flex={1}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              {/* <Select
                maxW="200px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Employees</option>
                <option value="current">Current</option>
                <option value="overdue">Overdue Salary</option>
              </Select> */}
            </HStack>
            <HStack>
              <Text color="gray.600">
                Total Results: {filteredEmployees.length}
              </Text>
              <Button colorScheme="blue" onClick={onAddOpen}>
                Add Employee
              </Button>
            </HStack>
          </Flex>
        </VStack>
      </Box>

      {/* Employees Table */}
      <Box
        bg="white"
        p={5}
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="blue.100"
      >
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort("name")}>
                <HStack spacing={2}>
                  <Text>Name</Text>
                  <SortIcon columnKey="name" />
                </HStack>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("designation")}>
                <HStack spacing={2}>
                  <Text>Designation</Text>
                  <SortIcon columnKey="designation" />
                </HStack>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("dateOfJoining")}>
                <HStack spacing={2}>
                  <Text>Date of Joining</Text>
                  <SortIcon columnKey="dateOfJoining" />
                </HStack>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("grossSalary")}>
                <HStack spacing={2}>
                  <Text>Gross Salary</Text>
                  <SortIcon columnKey="grossSalary" />
                </HStack>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("nextSalaryDate")}>
                <HStack spacing={2}>
                  <Text>Next Salary Date</Text>
                  <SortIcon columnKey="nextSalaryDate" />
                </HStack>
              </Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredEmployees.map((employee) => (
              <Tr key={employee.id}>
                <Td fontWeight="medium">{employee.name}</Td>
                <Td>{employee.designation}</Td>
                <Td>{formatDate(employee.dateOfJoining)}</Td>
                <Td>PKR{employee.grossSalary?.toLocaleString()}</Td>
                <Td>
                  {employee.nextSalaryDate && (
                    <Badge
                      colorScheme={
                        new Date(employee.nextSalaryDate) < new Date()
                          ? "red"
                          : "green"
                      }
                    >
                      {formatDate(employee.nextSalaryDate)}
                    </Badge>
                  )}
                </Td>
                <Td>
                  <ButtonGroup size="sm" spacing={2}>
                    <Button
                      colorScheme="green"
                      onClick={() => handlePaySalary(employee)}
                    >
                      Pay Salary
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      leftIcon={<FiTrash2 />}
                    >
                      Delete
                    </Button>
                  </ButtonGroup>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Forms */}
      <AddEmployeeForm isOpen={isAddOpen} onClose={onAddClose} />
      {selectedEmployee && (
        <SalaryPaymentForm
          isOpen={isPayOpen}
          onClose={onPayClose}
          employee={selectedEmployee}
        />
      )}
    </Box>
  );
};
