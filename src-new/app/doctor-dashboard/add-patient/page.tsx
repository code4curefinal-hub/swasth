
'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, collection } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const addPatientSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
  gender: z.string().min(1, { message: "Gender is required."}),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Invalid email address." }),
  address: z.string().min(1, { message: "Address is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function AddPatientPage() {
  const { user: doctorUser } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof addPatientSchema>>({
    resolver: zodResolver(addPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined,
      phoneNumber: "",
      email: "",
      address: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof addPatientSchema>) {
    if (!doctorUser || !firestore) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to add a patient."});
        return;
    }

    setIsLoading(true);

    try {
      // Generate a new ID for the patient user document.
      const newPatientId = doc(collection(firestore, 'users')).id;

      const userProfile = {
        id: newPatientId,
        firstName: values.firstName,
        lastName: values.lastName,
        role: "patient",
        email: values.email,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        phoneNumber: values.phoneNumber,
        address: values.address,
        doctorId: doctorUser.uid,
      };

      // 1. Create the patient's user document in Firestore.
      const userDocRef = doc(firestore, 'users', newPatientId);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      // 2. Add a link to this patient in the doctor's own patient list.
      const doctorPatientsColRef = collection(firestore, 'users', doctorUser.uid, 'patients');
      const patientLinkDoc = {
        patientId: newPatientId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email
      };
      const patientDocInDoctorList = doc(doctorPatientsColRef, newPatientId);
      setDocumentNonBlocking(patientDocInDoctorList, patientLinkDoc, {});
      
      toast({
        title: "Patient Added Successfully",
        description: `${values.firstName} ${values.lastName} has been added. They will need to sign up with this email to access their dashboard.`,
      });

      router.push('/doctor-dashboard');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Add Patient",
        description: "An unexpected error occurred while creating the patient profile.",
      });
      console.error("Add patient error:", error);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-primary"/>
                    <CardTitle>Add a New Patient</CardTitle>
                </div>
                <CardDescription>
                    Enter the details for the new patient. An account will be created for them and they will be added to your patient list.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Anjali" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Sharma" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="patient@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Initial Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                                <FormDescription>The patient will be prompted to change this upon first login.</FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Date of birth</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown-buttons"
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mobile Number</FormLabel>
                                <FormControl>
                                    <Input type="tel" placeholder="9876543210" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="City, State, ZIP" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                             <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                             <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Adding Patient..." : "Add Patient"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  )
}

    