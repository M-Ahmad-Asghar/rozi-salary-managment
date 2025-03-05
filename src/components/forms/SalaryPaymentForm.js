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
  Image,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { storage } from "../../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { recordSalaryPayment } from "../../firebase/salaryService";
import { useAuth } from "../../context/AuthContext";

export const SalaryPaymentForm = ({ isOpen, onClose, employee }) => {
  const {user} = useAuth()  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionNumber: "",
    transactionAmount: employee?.grossSalary || "",
    transactionDate: new Date().toISOString().split("T")[0],
  });
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceipt(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = "";
      if (receipt) {
        // Upload receipt to Firebase Storage
        const storageRef = ref(
          storage,
          `receipts/${employee.id}/${Date.now()}_${receipt.name}`
        );
        const snapshot = await uploadBytes(storageRef, receipt);
        receiptUrl = await getDownloadURL(snapshot.ref);
   
      }

      // Calculate next salary date (30 days from current payment)
      const currentPaymentDate = new Date(formData.transactionDate);
      const nextSalaryDate = new Date(currentPaymentDate);
      nextSalaryDate.setDate(currentPaymentDate.getDate() + 30);
      const runToast = () => toast({
        title: "Salary payment recorded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      if (receiptUrl?.length) {
        await recordSalaryPayment({
          employeeId: employee.id,
          name: employee.name,
          designation: employee.designation,
          email: employee.email,
          employeeId: employee.id,
          createdBy: user?.email,
          ...formData,
          receiptUrl,
          nextSalaryDate: nextSalaryDate.toISOString(),
          status: "completed",
          createdAt: new Date().toISOString(),
        }, runToast);
      }

   
      onClose();
    } catch (error) {
      toast({
        title: "Error recording payment",
        description: error.message,
        status: "error",
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
        <ModalHeader>Record Salary Payment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box as="form" onSubmit={handleSubmit} pb={6}>
            <VStack spacing={4}>
              <Text fontWeight="bold">Employee: {employee?.name}</Text>

              <FormControl isRequired>
                <FormLabel>Transaction Number</FormLabel>
                <Input
                  name="transactionNumber"
                  value={formData.transactionNumber}
                  onChange={handleChange}
                  placeholder="Enter transaction number"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Transaction Amount</FormLabel>
                <Input
                  name="transactionAmount"
                  type="number"
                  value={formData.transactionAmount}
                  onChange={handleChange}
                  placeholder="Enter transaction amount"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Transaction Date</FormLabel>
                <Input
                  name="transactionDate"
                  type="date"
                  value={formData.transactionDate}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Upload Receipt</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  p={1}
                />
              </FormControl>

              {previewUrl && (
                <Box>
                  <Image
                    src={previewUrl}
                    alt="Receipt preview"
                    maxH="200px"
                    objectFit="contain"
                  />
                </Box>
              )}

              <Button
                colorScheme="blue"
                type="submit"
                width="full"
                isLoading={loading}
              >
                Record Payment
              </Button>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
