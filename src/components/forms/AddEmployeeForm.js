import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
  } from '@chakra-ui/react';
  import { useState } from 'react';
  import { addEmployee } from '../../firebase/employeeService';
  
  export const AddEmployeeForm = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      designation: '',
      dateOfJoining: '',
      grossSalary: '',
      accountNumber: '',
    });
    const toast = useToast();
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        // Calculate next salary date (30 days from joining)
        const joiningDate = new Date(formData.dateOfJoining);
        const nextSalaryDate = new Date(joiningDate);
        nextSalaryDate.setDate(joiningDate.getDate() + 30);
  
        await addEmployee({
          ...formData,
          grossSalary: Number(formData.grossSalary),
          nextSalaryDate: nextSalaryDate.toISOString(),
          status: 'active',
          createdAt: new Date().toISOString(),
        });
  
        toast({
          title: 'Employee added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } catch (error) {
        toast({
          title: 'Error adding employee',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Employee</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" onSubmit={handleSubmit} pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </FormControl>
  
                <FormControl isRequired>
                  <FormLabel>Designation</FormLabel>
                  <Input
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Enter designation"
                  />
                </FormControl>
  
                <FormControl isRequired>
                  <FormLabel>Date of Joining</FormLabel>
                  <Input
                    name="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                  />
                </FormControl>
  
                <FormControl isRequired>
                  <FormLabel>Gross Salary</FormLabel>
                  <Input
                    name="grossSalary"
                    type="number"
                    value={formData.grossSalary}
                    onChange={handleChange}
                    placeholder="Enter gross salary"
                  />
                </FormControl>
  
                <FormControl isRequired>
                  <FormLabel>Account Number</FormLabel>
                  <Input
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                  />
                </FormControl>
  
                <Button
                  colorScheme="blue"
                  type="submit"
                  width="full"
                  isLoading={loading}
                >
                  Add Employee
                </Button>
              </VStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };