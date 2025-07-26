"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserRegistrationSchema,
  UserRegistratonProps,
} from "@/schemas/auth.schema";

// Define error type for better type safety
type ClerkError = {
  errors: Array<{
    longMessage: string;
    message: string;
  }>;
};

// Define user type for the registration response
type RegisteredUser = {
  id: string;
  fullname: string;
  type: string;
};

const onCompleteUserRegistraton = async (
  fullname: string,
  userId: string,
  type: string
): Promise<{ status: number; user?: RegisteredUser }> => {
  try {
    // Simulate API call
    console.log("Completing user registration:", { fullname, userId, type });
    return { status: 200, user: { id: userId, fullname, type } };
  } catch (error) {
    console.error("Registration completion failed:", error);
    return { status: 400 };
  }
};

export const useSignUpForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const methods = useForm<UserRegistratonProps>({
    resolver: zodResolver(UserRegistrationSchema),
    defaultValues: {
      type: "owner",
    },
    mode: "onChange",
  });

  const onGenerateOTP = async (
    email: string,
    password: string,
    onNext: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (!isLoaded) return;
    try {
      await signUp.create({
        emailAddress: email,
        password: password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      onNext((prev) => prev + 1);
    } catch (error) {
      const clerkError = error as ClerkError;
      toast.error(clerkError.errors[0].longMessage);
    }
  };

  const onHandleSubmit = methods.handleSubmit(
    async (values: UserRegistratonProps) => {
      if (!isLoaded) return;
      try {
        setLoading(true);
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: values.otp,
        });

        if (completeSignUp.status !== "complete") {
          return { message: "Something went wrong" };
        }
        if (completeSignUp.status == "complete") {
          if (!signUp.createdUserId) return;
          const registered = await onCompleteUserRegistraton(
            values.fullname,
            signUp.createdUserId,
            values.type
          );
          if (registered?.status == 200 && registered.user) {
            await setActive({
              session: completeSignUp.createdSessionId,
            });
            setLoading(false);
            router.push("/dashboard");
          }

          if (registered?.status == 400) {
            toast.error("Something went wrong");
          }
        }
      } catch (error) {
        const clerkError = error as ClerkError;
        toast.error(clerkError.errors[0].longMessage);
        setLoading(false);
      }
    }
  );
  return {
    methods,
    onHandleSubmit,
    onGenerateOTP,
    loading,
  };
};
